# docker buildx build --output type=local,dest=./ .

# --- Linux builds and Windows cross-compile ---
# Currently requires amd64, but could test a cross-compiler on ARM for x64?
FROM --platform=linux/amd64 debian:12.5-slim AS build

RUN dpkg --add-architecture amd64
RUN dpkg --add-architecture arm64

RUN apt-get update

# Common tools
RUN apt-get install -y make

# Linux amd64 build
RUN apt-get install -y gcc
#RUN apt-get install -y gcc-x86-64-linux-gnu

# Linux aarch64 build
RUN apt-get install -y gcc-aarch64-linux-gnu

# Linux libraries
RUN apt-get install -y libdbus-1-dev:amd64
RUN apt-get install -y libdbus-1-dev:arm64

# Windows build
RUN apt-get install -y gcc-mingw-w64

# Source files
WORKDIR /workspace
COPY watcher.c watcher.h ./
COPY Makefile-lin watcher-lin.c ./
COPY Makefile-win watcher-win.c ./

# Linux: amd64 & arm64 binaries required
RUN make -f Makefile-lin CC=gcc   BIN_NAME=watcher-lin-x64
#RUN make -f Makefile-lin CC=x86-64-linux-gnu-gcc   BIN_NAME=watcher-lin-x64
RUN make -f Makefile-lin CC=aarch64-linux-gnu-gcc BIN_NAME=watcher-lin-arm

# Windows: x86 32-bit version should run on any Windows 10/11 x86/x64/ARM (via thunk/emulation)
RUN make -f Makefile-win



# --- Mac build ---
# See: https://github.com/shepherdjerred/macos-cross-compiler/pkgs/container/macos-cross-compiler
#docker run -v .:/workspace --rm -it ghcr.io/shepherdjerred/macos-cross-compiler:latest aarch64-apple-darwin22-clang --target=aarch64-apple-darwin22 -framework Foundation watcher.c watcher-mac.m -o watcher-mac
FROM --platform=linux/amd64 ghcr.io/shepherdjerred/macos-cross-compiler:latest AS build-mac

RUN apt-get update
RUN apt-get install -y make

WORKDIR /workspace
COPY watcher.c watcher.h ./
COPY Makefile-mac watcher-mac.m ./

# Mac: universal binary (aarch64 & x86_64)
RUN make -f Makefile-mac BIN_NAME=watcher-mac LIPO=aarch64-apple-darwin22-lipo CC_X64=x86_64-apple-darwin22-clang TARGET_X64=--target=x86_64-apple-darwin22 CC_ARM=aarch64-apple-darwin22-clang TARGET_ARM=--target=aarch64-apple-darwin22


# --- Extract build binaries ---
FROM scratch AS binaries
COPY --from=build /workspace/watcher-lin-x64 /
COPY --from=build /workspace/watcher-lin-arm /
COPY --from=build /workspace/watcher-win.exe /
COPY --from=build-mac /workspace/watcher-mac /
