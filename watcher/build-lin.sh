#!/bin/sh
gcc -o watcher-lin watcher.c watcher-lin.c `pkg-config --libs --cflags dbus-1`
