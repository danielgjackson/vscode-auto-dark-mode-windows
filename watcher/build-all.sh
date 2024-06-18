#!/bin/sh

rm watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac

docker buildx build --output type=local,dest=./ .

#if [[ "$OSTYPE" == "darwin"* ]]; then   lipo -create -output watcher-mac watcher-mac-x64 watcher-mac-arm   ; fi

ls watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac
