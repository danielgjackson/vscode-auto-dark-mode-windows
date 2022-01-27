# Toggle Light/Dark Theme - VS Code Extension

<!--
![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Rating](https://vsmarketplacebadge.apphb.com/rating-short/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Installs](https://vsmarketplacebadge.apphb.com/installs/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Downloads](https://vsmarketplacebadge.apphb.com/downloads/danielgjackson.auto-dark-mode-windows.svg)
-->

This extension provides a quick toggle between light/dark themes in VS Code.  This may be useful for anyone working under significantly changing background or reflected light levels. 

> **New:** If you are on Windows and would like to quickly toggle the whole system dark mode, you might be interested in: [Toggle Dark/Light Mode](https://github.com/danielgjackson/toggle-dark-light).

![Toggle light/dark theme with a status bar icon](screenshot.png)


## Features

* *Toggle Theme* command: `auto-dark-mode-windows.toggle` (see [History](#history) for name choice!)
* Status bar icon to quickly perform the theme switch: <code>&#x1F313;&#xFE0E;</code>
* Default hot-key: `Ctrl`+`Alt`+`Shift`+`T`


## Requirements

None.


## Extension Settings

No additional settings are provided.  

* The standard settings are used to customize the light/dark themes:

    * `workbench.preferredDarkColorTheme`
    * `workbench.preferredLightColorTheme`

* The operating system's light/dark mode can be automatically tracked by enabling the standard setting (the *Toggle Theme* command will temporarily override the theme):

    * `window.autoDetectColorScheme`

* The status bar icon (<code>&#x1F313;&#xFE0E;</code>) can be hidden/shown by right-clicking the status bar and selecting *Toggle Light/Dark Theme (Extension)*.


## Known Issues

None.


## Release Notes

See: [Change Log](CHANGELOG.md)


## History

This extension was previously titled *Automatic Theme Switcher for Windows Dark Mode*, which automatically switched between dark/light themes to match the Windows Dark Mode (on *Windows 10 October 2018 Update* or later), and used the settings `autoDarkMode.darkTheme` and `autoDarkMode.lightTheme`.  The extension was partly inspired by a version for *macOS Mojave*: [auto-dark-mode](https://marketplace.visualstudio.com/items?itemName=LinusU.auto-dark-mode&ssr=false).  However, since VS Code V1.42 (January 2020), a standard setting has been available (`window.autoDetectColorScheme`) to perform this functionality as a built-in, cross-platform feature.  Since then, the extension remains useful as a quick toggle between the standard light/dark theme preferences.


## Links

* [GitHub Page: danielgjackson/vscode-auto-dark-mode-windows](https://github.com/danielgjackson/vscode-auto-dark-mode-windows)
* [Visual Studio Marketplace: Toggle Light/Dark Theme](https://marketplace.visualstudio.com/items?itemName=danielgjackson.auto-dark-mode-windows)
