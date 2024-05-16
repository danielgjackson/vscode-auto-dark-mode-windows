#ifdef _WIN32
  #include <tchar.h>
#else
  #define _tmain main
  #define _TCHAR char
#endif

#include <stdio.h>
#include <stdlib.h>

#include "watcher.h"

typedef struct {
    const char *prefix;
    const char *suffix;
    int eol;
} config;

void callback(int value, void *reference)
{
    config *myConfig = (config *)reference;
    printf("%s%d%s%s", (myConfig && myConfig->prefix) ? myConfig->prefix : "", value, (myConfig && myConfig->suffix) ? myConfig->suffix : "", (!myConfig || myConfig->eol) ? "\n" : "");
    fflush(stdout);
}

int _tmain(int argc, _TCHAR *argv[])
{
    // Config
    config myConfig = {0};
    myConfig.prefix = NULL;
    myConfig.suffix = NULL;
    myConfig.eol = 1;

    // Config from parameters
    if (argc > 1) {
        myConfig.prefix = argv[1];
    }
    if (argc > 2) {
        myConfig.suffix = argv[2];
    }
    if (argc > 3) {
        myConfig.eol = atoi(argv[3]);
    }

    // Defaults
    if (myConfig.prefix == NULL) {
        myConfig.prefix = "";
    }
    if (myConfig.suffix == NULL) {
        myConfig.suffix = "";
    }

    // Run watcher code
    int result = watcher(callback, &myConfig);
    return result;
}
