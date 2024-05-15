// Linux implementation of the watcher() function.

// TODO: Not yet implemented.
/* See the following:
# gsettings get org.gnome.desktop.interface color-scheme  ## 'prefer-dark' / 'prefer-light' / 'default'

# See: https://docs.flatpak.org/en/latest/portal-api-reference.html#gdbus-org.freedesktop.impl.portal.Settings
# e.g. https://github.com/libsdl-org/SDL/blob/863a9029ae50bd136e5144bc1ce2ea53a6b37ccc/src/core/linux/SDL_system_theme.c
# e.g. https://github.com/kovidgoyal/kitty/blob/98624d614e8dd51e8e7f48c0ef1e01aebdc03766/glfw/linux_desktop_settings.c
# e.g. https://github.com/lutris/lutris/blob/5959768f8aea725a1ab98ea3aa4183c0ab7b617d/lutris/style_manager.py
# TODO: Wait for 'SettingChanged' signal

colorScheme=$(gdbus call --session --timeout=1000 --dest=org.freedesktop.portal.Desktop --object-path /org/freedesktop/portal/desktop --method org.freedesktop.portal.Settings.Read org.freedesktop.appearance color-scheme)
case $colorScheme in
  ( '(<<uint32 1>>,)' ) exit 1;;    # 1 = prefer-dark
  ( '(<<uint32 2>>,)' ) exit 2;;    # 2 = prefer-light
  ( *                 ) exit 0;;    # 0/default = no preference
esac
*/

// gcc watcher.c watcher-lin.c -o watcher-lin
// ./watcher-lin

#ifndef __linux__
	#error "watcher-lin.c is only expected to be compiled on Linux"
#endif

#include <stdio.h>

#include <dbus/dbus.h>

#include "watcher.h"

static void dbus_error(DBusError *err, const char *prefix)
{
    fprintf(stderr, "ERROR: DBus Error %s: %s\n", prefix ? prefix : "", err->message ? err->message : "(null)");
    dbus_error_free(err);
    return;
}

int watcher(watcher_callback callback, void *reference)
{
    DBusError err;
    dbus_error_init(&err);

    DBusConnection *session_bus = NULL;
    session_bus = dbus_bus_get(DBUS_BUS_SESSION, &err);
    if (dbus_error_is_set(&err))
    {
        dbus_error(&err, "dbus_bus_get(DBUS_BUS_SESSION)");
        return -1;
    }
    printf("session_bus=%p\n", session_bus);

    // !!!
    fprintf(stderr, "ERROR: Linux implementation of the watcher() function is not implemented yet.\n");

    //callback(0, reference);
    return -1;
}
