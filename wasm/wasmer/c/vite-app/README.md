# Vite WASM App

## Init

npm create vite@latest vite-app -- --template vanilla-ts

cat > vite.config.js

```ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [
    wasm(),
    // topLevelAwait() // Not needed if build.target == 'esnext'
  ],
});
```

## Run

### Install ninja from source

```sh
git clone git@github.com:ninja-build/ninja.git
cd ninja
./configure.py --bootstrap
cmake -Bbuild-cmake
cmake --build build-cmake
sudo cp ./ninja /usr/bin
```

```sh
sudo apt install libgtest-dev build-essential cmake
cd /usr/src/googletest
sudo cmake .
sudo cmake --build . --target install
```

## Intall LLVM from source

```sh
git clone git@github.com:llvm/llvm-project.git --depth=1
cd llvm-project
cmake -S llvm -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
ninja -C build check-llvm
```

```sh

build_llvm=`pwd`/build-llvm
installprefix=`pwd`/install
llvm=`pwd`/llvm-project
mkdir -p $build_llvm
mkdir -p $installprefix

cmake -G Ninja -S $llvm/llvm -B $build_llvm \
      -DLLVM_INSTALL_UTILS=ON \
      -DCMAKE_INSTALL_PREFIX=$installprefix \
      -DCMAKE_BUILD_TYPE=Release

ninja -C $build_llvm install

```

```sh

build_llvm=`pwd`/build-llvm
build_clang=`pwd`/build-clang
installprefix=`pwd`/install
llvm=`pwd`/llvm-project
mkdir -p $build_llvm
mkdir -p $installprefix

cmake -G Ninja -S $llvm/clang -B $build_clang \
      -DLLVM_EXTERNAL_LIT=$build_llvm/utils/lit \
      -DLLVM_ROOT=$installprefix

ninja -C $build_clang
```

```sh
  wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | sudo apt-key add -
  name=$(lsb_release -s -c)
  sudo add-apt-repository -y "deb http://apt.llvm.org/$name/ llvm-toolchain-$name-19 main"
  sudo add-apt-repository -y "deb-src http://apt.llvm.org/$name/ llvm-toolchain-$name-19 main"
  sudo apt-get install -y clang-19 llvm-19 lld-19
```


```sh
cargo install wasm-component-ld
  #   Finished `release` profile [optimized] target(s) in 27.76s
  # Installing $HOME/.cargo/bin/wasm-component-ld
  #  Installed package `wasm-component-ld v0.5.12` (executable `wasm-component-ld`)
# compile the C code
# --no-entry Don't search for the entry point symbol (by default ``_start``).
clang --target=wasm32-wasip2 \
--no-standard-libraries \
-fuse-ld=$HOME/.cargo/bin/wasm-component-ld \
-Wl,--export-all \
-Wl,--no-entry \
-o src/hello.wasm src/hello.c

#  Run Vite
npm run build && npm run preview
```
