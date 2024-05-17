# docker buildx build --output type=local,dest=./ .

# Currently requires amd64, but could be made to use the cross-compiler for x64?
FROM --platform=linux/amd64 debian:12.5-slim  AS build

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
WORKDIR /root/watcher
COPY *.sh Makefile* *.c *.h *.m *.swift .

# Linux: amd64 & arm64 binaries required
RUN make -f Makefile-lin CC=gcc   BIN_NAME=watcher-lin-x64
#RUN make -f Makefile-lin CC=x86-64-linux-gnu-gcc   BIN_NAME=watcher-lin-x64
RUN make -f Makefile-lin CC=aarch64-linux-gnu-gcc BIN_NAME=watcher-lin-arm

# Windows: x86 32-bit version should run on any Windows 10/11 x86/x64/ARM (via thunk/emulation)
RUN make -f Makefile-win

# TODO: Cross-compile for aarch64 macOS
#       - see: https://github.com/shepherdjerred/macos-cross-compiler/pkgs/container/macos-cross-compiler
#RUN make -f Makefile-mac


# Extract build binaries
FROM scratch AS binaries
COPY --from=build /root/watcher/watcher-lin-x64 /
COPY --from=build /root/watcher/watcher-lin-arm /
COPY --from=build /root/watcher/watcher-win.exe /
#COPY --from=build /root/watcher/watcher-mac /
