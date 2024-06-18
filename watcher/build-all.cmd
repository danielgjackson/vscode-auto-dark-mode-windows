@echo off
del watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac-arm watcher-mac-x64

docker buildx build --output type=local,dest=./ .

dir /b watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac-arm watcher-mac-x64

pause
