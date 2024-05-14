#ifdef _WIN32
  #include <tchar.h>
#else
  #define _tmain main
  #define _TCHAR char
#endif

#include <stdio.h>

#include "watcher.h"

void callback(int value, void *reference)
{
    printf("%s%d\n", (const char *)(reference ? reference : ""), value);
    fflush(stdout);
}

int _tmain(int argc, _TCHAR *argv[])
{
    return watcher(callback, NULL);
}
