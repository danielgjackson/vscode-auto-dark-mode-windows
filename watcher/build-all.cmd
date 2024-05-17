@echo off
del watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac

docker buildx build --output type=local,dest=./ .

dir /b watcher-lin-x64 watcher-lin-arm watcher-win.exe watcher-mac

pause
