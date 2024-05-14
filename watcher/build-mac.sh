#!/bin/sh

# Swift version
swiftc -o watcher-mac watcher-mac.swift

# ObjC version
#clang -framework Foundation watcher-mac.m -o watcher-mac
