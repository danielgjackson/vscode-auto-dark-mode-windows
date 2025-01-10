# Toggle Light/Dark Theme - VS Code Extension

<!--
![Visual Studio Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Rating](https://vsmarketplacebadge.apphb.com/rating-short/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Installs](https://vsmarketplacebadge.apphb.com/installs/danielgjackson.auto-dark-mode-windows.svg)
![Visual Studio Marketplace Downloads](https://vsmarketplacebadge.apphb.com/downloads/danielgjackson.auto-dark-mode-windows.svg)
-->

This extension provides a status bar icon to quickly toggle between light/dark themes in VS Code.  
<!-- This will also work as a temporary override if the system theme being tracked (except on the web).  -->
This may be useful for anyone working under significantly changing background or reflected light levels. 

![Toggle light/dark theme with a status bar icon](screenshot.png)

> If you are on Windows and would like to quickly toggle the whole system dark mode, you might be interested in this utility: [Toggle Dark/Light Mode](https://github.com/danielgjackson/toggle-dark-light).


## Features

* A *Toggle Theme* command to switch between light/dark themes: `auto-dark-mode-windows.toggle` (see [History](#history) for name choice!)
<!--
* The toggling works, even while system theme changes are also being tracked (except on the web), as this extension provides its own tracking of the system theme.
-->
* Status bar icon to quickly perform the theme switch: <code>&#x1F313;&#xFE0E;</code>
* Default hot-key: `Ctrl`+`Alt`+`Shift`+`T`


## Requirements

None.


## Extension Settings

No additional settings are provided by the extension itself.  

* Your choice of VS Code light/dark theme are used, you can adjust these by opening VS Code's settings with the command *Preferences: Open Settings (UI)*, or through the menu: *Code* (on Mac) or *File* (on Windows/Linux) / *Preferences* / *Settings*, then:

    * *Workbench* / *Appearance* / *Preferred Light Color Theme* (`workbench.preferredLightColorTheme`)
    * *Workbench* / *Appearance* / *Preferred Dark Color Theme* (`workbench.preferredDarkColorTheme`)

* While the operating system's light/dark mode can be automatically tracked by enabling the following VS Code setting: 

    * *Window* / *Auto Detect Color Scheme* (`window.autoDetectColorScheme`)

   ...since *VS Code V1.89 (April 2024)*, this prevents any temporary changes to the theme (which prevents toggling the theme), so this setting is disabled by the extension.  
   <!--
   Instead, this extension provides its own tracking of the system theme (not currently possible in web versions of VS Code) so that the *Toggle Theme* command can be used to temporarily override the system theme.
   -->

* The status bar icon (<code>&#x1F313;&#xFE0E;</code>) can be hidden/shown by right-clicking the status bar and selecting *Toggle Light/Dark Theme (Extension)*.


## Known Issues

None.


## Release Notes

See: [Change Log](CHANGELOG.md)


## History

* VS Code before 2020 could not synchronize the theme to match the system dark mode, nor could the theme quickly be changed between light/dark modes.  This extension was previously titled *Automatic Theme Switcher for Windows Dark Mode*, which automatically switched between dark/light themes to match the Windows Dark Mode (on *Windows 10 October 2018 Update* or later), and used the settings `autoDarkMode.darkTheme` and `autoDarkMode.lightTheme`.  The extension was partly inspired by a similar extension for *macOS Mojave*: [auto-dark-mode](https://marketplace.visualstudio.com/items?itemName=LinusU.auto-dark-mode).  

* [VS Code V1.42 (January 2020)](https://code.visualstudio.com/updates/v1_42#_auto-switch-theme-based-on-os-color-scheme) introduced a standard setting to synchronize with the system dark mode as a built-in, cross-platform feature: *Window: Auto Detect Color Scheme* (`window.autoDetectColorScheme`).  This extension remained useful to quickly toggle between the standard light/dark theme preferences, regardless of the current system dark mode.

* [VS Code V1.69 (June 2022)](https://code.visualstudio.com/updates/v1_69#_toggle-between-light-and-dark-themes) introduced a built-in command to quickly switch between themes: *Preferences: Toggle between Light/Dark Themes* (`workbench.action.toggleLightDarkThemes`).  This extension remains useful for the status bar icon which acts as a shortcut for this feature.

* [VS Code V1.89 (April 2024)](https://code.visualstudio.com/updates/v1_89#_auto-detect-system-color-mode-improvements) changed the behavior so that when *Window: Auto Detect Color Scheme* (`window.autoDetectColorScheme`) is enabled, the *Workbench: Color Theme* (`workbench.colorTheme`) setting is completely ignored.  This means that you can no longer quickly toggle the theme while tracking the system color (at start and on change) -- not even with the built-in *Preferences: Toggle between Light/Dark Themes* (`workbench.action.toggleLightDarkThemes`) command.


## Links

* [GitHub Page: danielgjackson/vscode-auto-dark-mode-windows](https://github.com/danielgjackson/vscode-auto-dark-mode-windows)
* [Visual Studio Marketplace: Toggle Light/Dark Theme](https://marketplace.visualstudio.com/items?itemName=danielgjackson.auto-dark-mode-windows)
