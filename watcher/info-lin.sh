#!/bin/sh
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
