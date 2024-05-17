#!/bin/sh

rm watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac

docker buildx build --output type=local,dest=./ .

docker run -v .:/workspace --rm -it ghcr.io/shepherdjerred/macos-cross-compiler:latest aarch64-apple-darwin22-clang --target=aarch64-apple-darwin22 -framework Foundation watcher.c watcher-mac.m -o watcher-mac

ls watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac
