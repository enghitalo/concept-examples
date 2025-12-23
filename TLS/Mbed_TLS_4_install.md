Here's a comprehensive guide on how to install Mbed TLS 4.0.0, including both system-wide installation and local development setups.

## Installation Methods

### Method 1: Package Manager (Easiest)

#### Ubuntu/Debian:

```bash
# Install Mbed TLS 3.x (latest stable in repos)
sudo apt update
sudo apt install libmbedtls-dev

# Check installed version
dpkg -l | grep mbedtls
```

#### Fedora/RHEL/CentOS:

```bash
sudo dnf install mbedtls-devel
```

#### macOS (Homebrew):

```bash
brew install mbedtls
```

### Method 2: Build from Source (Recommended for Mbed TLS 4.0.0)

Since Mbed TLS 4.0.0 might not be in package repositories yet, here's how to build from source:

#### Step 1: Install Dependencies

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install build-essential cmake git python3 python3-pip
sudo apt install gcc g++ make pkg-config
```

**Fedora/RHEL/CentOS:**

```bash
sudo dnf groupinstall "Development Tools"
sudo dnf install cmake git python3 python3-pip
```

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install cmake git python3
```

#### Step 2: Clone Mbed TLS Repository

```bash
# Clone the repository
git clone https://github.com/Mbed-TLS/mbedtls.git
git submodule update --init --recursive
cd mbedtls

# Checkout version 4.0.0 (or latest stable)
git checkout mbedtls-4.0.0

# Or for the development version:
git checkout development
```

#### Step 3: Build and Install

**Option A: System-wide installation**

```bash
# Create build directory
mkdir build && cd build

# Configure with CMake
cmake .. -DUSE_SHARED_MBEDTLS_LIBRARY=On

# Build
make -j$(nproc)  # Use all CPU cores

# Test the build
make test

# Install system-wide (requires sudo)
sudo make install

# Update linker cache
sudo ldconfig
```

**Option B: Local installation (no root required)**

```bash
mkdir build && cd build

# Install to local directory
cmake .. -DCMAKE_INSTALL_PREFIX=$HOME/mbedtls-4.0.0

make -j$(nproc)
make test
make install

# Add to your environment
echo 'export PATH="$HOME/mbedtls-4.0.0/bin:$PATH"' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH="$HOME/mbedtls-4.0.0/lib:$LD_LIBRARY_PATH"' >> ~/.bashrc
echo 'export PKG_CONFIG_PATH="$HOME/mbedtls-4.0.0/lib/pkgconfig:$PKG_CONFIG_PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Option C: Build with specific configuration for TLS 1.3**

```bash
mkdir build && cd build

# Enable TLS 1.3 and required features
cmake .. \
    -DENABLE_PROGRAMS=On \
    -DUSE_SHARED_MBEDTLS_LIBRARY=On

make -j$(nproc)
sudo make install
```

### Method 3: Using vcpkg (Cross-platform package manager)

```bash
# Install vcpkg if not installed
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.sh

# Install Mbed TLS
./vcpkg install mbedtls

# For TLS 1.3 support, you might need custom triplet
```

### Method 4: Docker (Isolated environment)

Create a `Dockerfile`:

```dockerfile
FROM ubuntu:22.04

RUN apt update && apt install -y \
    build-essential \
    cmake \
    git \
    gcc \
    g++ \
    make \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone and build Mbed TLS
RUN git clone https://github.com/Mbed-TLS/mbedtls.git && \
    git submodule update --init --recursive && \
    cd mbedtls && \
    git checkout mbedtls-4.0.0 && \
    mkdir build && cd build && \
    cmake .. -DUSE_SHARED_MBEDTLS_LIBRARY=On && \
    make -j4 && \
    make install && \
    ldconfig

# Copy your server code
COPY server.c Makefile ./

# Build your server
RUN make

CMD ["./tls_server"]
```

Build and run:

```bash
docker build -t tls-server .
docker run -p 8443:8443 tls-server
```

## Verify Installation

### Check Version and Features:

```bash
# Check if libraries are installed
pkg-config --modversion mbedtls
pkg-config --cflags mbedtls
pkg-config --libs mbedtls

# Test with a simple program
cat > test_mbedtls.c << 'EOF'
#include <mbedtls/version.h>
#include <stdio.h>

int main() {
    printf("Mbed TLS version: %s\n", MBEDTLS_VERSION_STRING_FULL);
    printf("Build date: %s\n", MBEDTLS_VERSION_DATE);
    return 0;
}
EOF

gcc test_mbedtls.c -lmbedtls -o test_mbedtls
./test_mbedtls
```

### Check if TLS 1.3 is enabled:

```bash
cat > check_tls13.c << 'EOF'
#include <mbedtls/ssl.h>
#include <stdio.h>

int main() {
#ifdef MBEDTLS_SSL_PROTO_TLS1_3
    printf("TLS 1.3 is ENABLED\n");
#else
    printf("TLS 1.3 is DISABLED\n");
#endif
    return 0;
}
EOF

gcc check_tls13.c -lmbedtls -o check_tls13
./check_tls13
```

## Configuration for TLS 1.3 Server

### Create a custom `mbedtls_config.h`:

```bash
# Copy the default config
cp mbedtls/include/mbedtls/mbedtls_config.h mbedtls/include/mbedtls/mbedtls_config.h.backup

# Create your custom config
cat > custom_config.h << 'EOF'
/* TLS 1.3 Support */
#define MBEDTLS_SSL_PROTO_TLS1_3

/* Cipher Suites */
#define MBEDTLS_CHACHA20_C
#define MBEDTLS_POLY1305_C
#define MBEDTLS_AES_C
#define MBEDTLS_GCM_C

/* PSA Crypto (required for TLS 1.3) */
#define MBEDTLS_PSA_CRYPTO_C
#define MBEDTLS_USE_PSA_CRYPTO

/* Certificate Handling */
#define MBEDTLS_X509_CRT_PARSE_C
#define MBEDTLS_X509_CSR_PARSE_C
#define MBEDTLS_X509_CREATE_C
#define MBEDTLS_X509_CRT_WRITE_C
#define MBEDTLS_PK_WRITE_C
#define MBEDTLS_PEM_WRITE_C
#define MBEDTLS_SSL_KEEP_PEER_CERTIFICATE

/* Required Components */
#define MBEDTLS_SSL_CLI_C
#define MBEDTLS_SSL_SRV_C
#define MBEDTLS_NET_C
#define MBEDTLS_ENTROPY_C
#define MBEDTLS_CTR_DRBG_C
#define MBEDTLS_ECDSA_C
#define MBEDTLS_ECP_C
#define MBEDTLS_BIGNUM_C
#define MBEDTLS_OID_C
#define MBEDTLS_ASN1_PARSE_C
#define MBEDTLS_ASN1_WRITE_C
#define MBEDTLS_PK_PARSE_C
#define MBEDTLS_PK_C
#define MBEDTLS_SHA256_C
#define MBEDTLS_SHA512_C

/* Platform */
#define MBEDTLS_PLATFORM_C
#define MBEDTLS_PLATFORM_MEMORY

/* Error reporting */
#define MBEDTLS_ERROR_C
#define MBEDTLS_ERROR_STRERROR_DUMMY

/* Timing */
#define MBEDTLS_TIMING_C

/* Debugging (optional) */
// #define MBEDTLS_DEBUG_C

/* Memory allocation */
#define MBEDTLS_MEMORY_BUFFER_ALLOC_C

/* Keep default settings for everything else */
#include "mbedtls/check_config.h"
EOF

# Use it during build
cmake .. -DMBEDTLS_USER_CONFIG_FILE="custom_config.h"
```

## Quick Install Script

Save this as `install_mbedtls.sh`:

```bash
#!/bin/bash
# Mbed TLS 4.0.0 Installation Script

set -e  # Exit on error

echo "Installing Mbed TLS 4.0.0 with TLS 1.3 support..."

# Install dependencies
if command -v apt &> /dev/null; then
    sudo apt update
    sudo apt install -y build-essential cmake git gcc g++ make pkg-config python3
elif command -v dnf &> /dev/null; then
    sudo dnf groupinstall -y "Development Tools"
    sudo dnf install -y cmake git gcc g++ make pkg-config python3
elif command -v brew &> /dev/null; then
    brew install cmake git python3
else
    echo "Package manager not found. Please install dependencies manually."
    exit 1
fi

# Clone and build
cd /tmp
git clone https://github.com/Mbed-TLS/mbedtls.git
git submodule update --init --recursive
cd mbedtls
git checkout mbedtls-4.0.0

mkdir build && cd build

# Configure with TLS 1.3 support
cmake .. \
    -DENABLE_PROGRAMS=On \
    -DMBEDTLS_SSL_PROTO_TLS1_3=On \
    -DMBEDTLS_PSA_CRYPTO_C=On \
    -DMBEDTLS_CHACHA20_C=On \
    -DMBEDTLS_POLY1305_C=On \
    -DMBEDTLS_SSL_KEEP_PEER_CERTIFICATE=On \
    -DUSE_SHARED_MBEDTLS_LIBRARY=On

# Build
make -j$(nproc)

# Test
echo "Running tests..."
make test

# Install
sudo make install
sudo ldconfig

echo "Installation complete!"
echo "Mbed TLS 4.0.0 with TLS 1.3 support has been installed."
```

Make it executable and run:

```bash
chmod +x install_mbedtls.sh
./install_mbedtls.sh
```

## Troubleshooting

### Common Issues and Solutions:

1. **"mbedtls/ssl.h: No such file or directory"**

   ```bash
   # Check if headers are installed
   ls /usr/include/mbedtls/

   # If using local installation, set include path
   gcc -I$HOME/mbedtls-4.0.0/include -L$HOME/mbedtls-4.0.0/lib -lmbedtls -lmbedx509 -lmbedcrypto server.c -o server
   ```

2. **"undefined reference to `mbedtls\_...'"**

   ```bash
   # Link all required libraries
   gcc server.c -lmbedtls -lmbedx509 -lmbedcrypto -o server

   # If using pthread
   gcc server.c -lmbedtls -lmbedx509 -lmbedcrypto -lpthread -o server
   ```

3. **TLS 1.3 not available**

   ```bash
   # Rebuild with TLS 1.3 enabled
   cd mbedtls/build
   cmake .. -DMBEDTLS_SSL_PROTO_TLS1_3=On
   make clean
   make -j$(nproc)
   sudo make install
   ```

4. **PSA Crypto errors**

   ```bash
   # Ensure PSA Crypto is enabled
   cmake .. -DMBEDTLS_PSA_CRYPTO_C=On -DMBEDTLS_USE_PSA_CRYPTO=On
   ```

5. **Certificate generation fails**
   ```bash
   # Enable certificate writing features
   cmake .. -DMBEDTLS_X509_CRT_WRITE_C=On -DMBEDTLS_PEM_WRITE_C=On
   ```

### Test with the provided server:

1. **Create a simple test:**

```bash
cat > compile_test.sh << 'EOF'
#!/bin/bash
echo "Compiling TLS server..."

# Try different include paths
PATHS=(
    "/usr/include"
    "/usr/local/include"
    "$HOME/mbedtls-4.0.0/include"
    "/opt/local/include"  # macOS
)

for path in "${PATHS[@]}"; do
    if [ -f "$path/mbedtls/ssl.h" ]; then
        echo "Found Mbed TLS in: $path"
        INCLUDE_PATH=$path
        break
    fi
done

if [ -z "$INCLUDE_PATH" ]; then
    echo "Mbed TLS not found!"
    exit 1
fi

# Compile
gcc -I$INCLUDE_PATH -o tls_server server.c -lmbedtls -lmbedx509 -lmbedcrypto

if [ $? -eq 0 ]; then
    echo "Compilation successful!"
    echo "Run with: ./tls_server"
else
    echo "Compilation failed!"
fi
EOF

chmod +x compile_test.sh
./compile_test.sh
```

## Development Environment Setup

### Visual Studio Code Setup:

Create `.vscode/c_cpp_properties.json`:

```json
{
  "configurations": [
    {
      "name": "Linux",
      "includePath": [
        "${workspaceFolder}/**",
        "/usr/include",
        "/usr/local/include",
        "${HOME}/mbedtls-4.0.0/include"
      ],
      "defines": [],
      "compilerPath": "/usr/bin/gcc",
      "cStandard": "c11",
      "cppStandard": "gnu++14",
      "intelliSenseMode": "linux-gcc-x64"
    }
  ],
  "version": 4
}
```

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "gcc",
      "args": [
        "-I/usr/include",
        "-g",
        "-o",
        "${workspaceFolder}/tls_server",
        "${workspaceFolder}/server.c",
        "-lmbedtls",
        "-lmbedx509",
        "-lmbedcrypto",
        "-lpthread"
      ],
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Summary

1. **For quick testing**: Use package manager (`apt install libmbedtls-dev`)
2. **For TLS 1.3 support**: Build from source with specific flags
3. **For development**: Use local installation in home directory
4. **For production**: System-wide installation with proper configuration