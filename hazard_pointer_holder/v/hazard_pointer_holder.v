import sync
import time

struct HazardPointer {
mut:
	ptr  voidptr
	next &HazardPointer = unsafe { nil }
}

struct HazardPointerHolder {
mut:
	ptr voidptr
}

struct HazardPointerDomain {
mut:
	head    &HazardPointer = unsafe { nil } // Lista encadeada de ponteiros de risco
	mutex   sync.Mutex
	retired []voidptr // Lista de ponteiros retirados
}

fn (mut hp HazardPointerHolder) protect(ptr voidptr) {
	hp.ptr = ptr
}

fn (mut hp HazardPointerHolder) reset() {
	hp.ptr = unsafe { nil }
}

fn (mut domain HazardPointerDomain) acquire() &HazardPointer {
	domain.mutex.lock()
	defer {
		domain.mutex.unlock()
	}
	// Tenta reutilizar um ponteiro de risco existente que não está em uso
	mut current := domain.head
	for current != unsafe { nil } {
		if current.ptr == unsafe { nil } {
			return current
		}
		current = current.next
	}
	// Se não houver ponteiro de risco livre, aloca um novo
	mut new_hp := &HazardPointer{}
	new_hp.next = domain.head
	domain.head = new_hp
	return new_hp
}

fn (mut domain HazardPointerDomain) retire(ptr voidptr) {
	domain.mutex.lock()
	defer {
		domain.mutex.unlock()
	}
	// Adiciona o ponteiro à lista de ponteiros retirados
	domain.retired << ptr
}

@[manualfree]
fn (mut domain HazardPointerDomain) reclaim() {
	domain.mutex.lock()
	defer {
		domain.mutex.unlock()
	}
	mut unprotected := []voidptr{}
	// Verifica se cada ponteiro retirado está protegido
	for ptr in domain.retired {
		mut is_protected := false
		mut current := domain.head
		for current != unsafe { nil } {
			if current.ptr == ptr {
				is_protected = true
				break
			}
			current = current.next
		}
		if !is_protected {
			unprotected << ptr
		}
	}
	// Remove ponteiros não protegidos da lista de retirados e libera a memória
	domain.retired = domain.retired.filter(it !in unprotected)
	for ptr in unprotected {
		println('Desalocando ponteiro: ${ptr}')
		unsafe { free(ptr) } // Libera a memória do ponteiro
	}
}

fn main() {
	mut domain := HazardPointerDomain{}
	mut holders := [4]HazardPointerHolder{} // 4 threads usando Hazard Pointers

	// Simulamos 4 threads protegendo e retirando ponteiros
	for i in 0 .. holders.len {
		mut holder := unsafe { &holders[i] }
		spawn thread_task(mut holder, mut &domain, i)
	}

	// Período de limpeza periódica (reclaim) para desalocar objetos que não estão mais protegidos
	for _ in 0 .. 5 {
		time.sleep(1 * time.second) // Espera antes de cada execução de reclaim
		println('Executando reclaim...')
		domain.reclaim()
	}

	println('Fim do programa')
}

// Função para simular uma tarefa em uma thread
fn thread_task(mut holder HazardPointerHolder, mut domain HazardPointerDomain, id int) {
	for _ in 0 .. 3 {
		// Simula alocação de recurso
		resource := unsafe { malloc(16) } // Aloca 16 bytes para o recurso
		println('Thread ${id} protegendo recurso: ${resource}')
		mut hp := domain.acquire() // Adquire um hazard pointer
		holder.protect(resource) // Protege o ponteiro com o hazard pointer
		hp.ptr = holder.ptr

		// Simula trabalho com o recurso
		time.sleep(500 * time.millisecond)

		// Retira o ponteiro após o uso
		println('Thread ${id} retirando recurso: ${resource}')
		domain.retire(resource) // Marca para desalocação futura
		holder.reset() // Remove a proteção do holder
		hp.ptr = unsafe { nil } // Libera o hazard pointer

		// Dorme para simular atraso antes do próximo ciclo
		time.sleep(200 * time.millisecond)
	}
}
