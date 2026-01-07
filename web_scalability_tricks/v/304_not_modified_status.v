import vweb
import pg
import time
import net
import io

interface Cache {
	set(key string, value string)
	get(key string) ?string
}

struct MemoryCache {
mut:
	data map[string]string
}

fn (mut c MemoryCache) set(key string, value string) {
	c.data[key] = value
}

fn (c MemoryCache) get(key string) ?string {
	return c.data[key]
}

struct MemcachedCache {
mut:
	conn net.TcpConn
}

fn new_memcached_cache(host string, port int) ?MemcachedCache {
	mut conn := net.dial_tcp('${host}:${port}')?
	return MemcachedCache{
		conn: conn
	}
}

fn (mut c MemcachedCache) set(key string, value string) {
	command := 'set ${key} 0 3600 ${value.len}\r\n${value}\r\n'
	c.conn.write_string(command) or { panic(err) }

	// Lê a resposta para o comando `set`
	mut reader := io.new_buffered_reader(reader: c.conn)
	response := reader.read_line() or { panic(err) }
	if !response.starts_with('STORED') {
		panic('Failed to store key in Memcached')
	}
}

fn (mut c MemcachedCache) get(key string) ?string {
	command := 'get ${key}\r\n'
	c.conn.write_string(command) or { panic(err) }

	// Lê a resposta para o comando `get`
	mut reader := io.new_buffered_reader(reader: c.conn)
	response := reader.read_line() or { panic(err) }

	if response.starts_with('VALUE') {
		data := reader.read_line() or { panic(err) }
		end_line := reader.read_line() or { panic(err) }
		if end_line.trim_space() == 'END' {
			return data
		}
	} else if response.starts_with('END') {
		println('Key not found.')
	}

	return none
}

struct App {
	vweb.Context
mut:
	db       pg.DB
	cache    Cache
	etag_map map[string]string
}

fn main() {
	mut cache := MemoryCache{
		data: map[string]string{}
	}
	// Troque para MemcachedCache para usar o Memcached como cache.
	// mut cache := new_memcached_cache('127.0.0.1', 11211) or {
	// 	panic('Failed to connect to Memcached server: $err')
	// }

	mut app := &App{
		db:       pg.connect(pg.Config{
			host:     'localhost'
			port:     5432
			user:     'seu_usuario'
			password: 'sua_senha'
			dbname:   'seu_banco'
		}) or { panic(err) }
		cache:    cache
		etag_map: map[string]string{}
	}
	vweb.run(app, 8080)
}

pub fn (mut app App) before_request() {
	// Log de cada requisição para depuração
	println('Recebendo requisição para ${app.req.url}')
}

@['/data/:key']
pub fn (mut app App) get_data(key string) vweb.Result {
	// Verifica o cabeçalho If-None-Match para comparação de ETag
	if_none_match := app.req.header.get_custom('If-None-Match') or { '' }
	current_etag := app.etag_map[key] or { '' }

	// Se o ETag não mudou, retorna 304
	if if_none_match == current_etag {
		app.set_status(304, 'Not Modified')
		return app.text('')
	}

	// Tenta buscar do cache
	if value := app.cache.get(key) {
		app.set_etag_header(current_etag)
		return app.text(value)
	}

	// Caso não esteja no cache, busca no banco de dados
	query := 'SELECT value FROM data_table WHERE key = $1'
	result := app.db.query_one(query, key) or { return app.text('Erro ao buscar dados', 500) }

	// Converte o resultado e atualiza o cache e o ETag
	value := result.get_string(0) or { '' }
	app.cache.set(key, value)
	new_etag := 'W/"' + time.now().unix.str() + '"'
	app.etag_map[key] = new_etag
	app.set_etag_header(new_etag)

	return app.text(value)
}

fn (mut app App) set_etag_header(etag string) {
	// Define o cabeçalho ETag na resposta
	app.add_header('ETag', etag)
}
