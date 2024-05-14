typedef void (*watcher_callback)(int, void *);

int watcher(watcher_callback callback, void *reference);
