#!/bin/sh

rm watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac

docker buildx build --output type=local,dest=./ .

ls watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac
