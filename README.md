# Toggle Light/Dark Theme - VS Code Extension

<!-- ![Automatic Switching](icon.png) -->

## Features

* Command *Toggle Theme* (`auto-dark-mode-windows.toggle`) with default hot-key `Ctrl`+`Alt`+`Shift`+`T`, to toggle between light/dark theme.
* A small status bar icon to perform the theme switch.

This standard settings are used to customize the light/dark themes:

* `workbench.preferredDarkColorTheme` (default: *Default Dark+*)
* `workbench.preferredLightColorTheme` (default: *Default Light+*)


## History

This add-on was previously *Automatic Theme Switcher for Windows Dark Mode*, which automatically switched between dark/light themes to match Windows Dark Mode (which required *Windows 10 October 2018 Update* or later), and used the settings `autoDarkMode.darkTheme` and `autoDarkMode.lightTheme`.  The extension was partly inspired by a version for *macOS Mojave*: [auto-dark-mode](https://marketplace.visualstudio.com/items?itemName=LinusU.auto-dark-mode&ssr=false).

However, since VS Code V1.42 (January 2020), a standard setting has been available: `window.autoDetectColorScheme`.  This performs the same action in a cross-platform way and should be used instead.  If this setting is not enabled during start-up, the extension will prompt to change the setting, but the original behaviour will continue. 


## Requirements

None.


## Extension Settings

None.


## Known Issues

None.


## Release Notes

See: [Change Log](CHANGELOG.md)


## Links

* [GitHub Page: danielgjackson/vscode-auto-dark-mode-windows](https://github.com/danielgjackson/vscode-auto-dark-mode-windows)
* [Visual Studio Marketplace: Toggle Light/Dark Theme](https://marketplace.visualstudio.com/items?itemName=danielgjackson.auto-dark-mode-windows
)
