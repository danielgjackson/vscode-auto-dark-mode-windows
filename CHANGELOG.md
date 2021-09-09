# Change Log

## 1.0.10

- Configured to additionally package as a [Web Extension](https://code.visualstudio.com/api/extension-guides/web-extensions) so that the extension will work when VS Code is running in a browser (e.g. [github.dev](https://github.dev)).

## 1.0.9

- Removed warning when not using `autoDetectColorScheme`.  Removed the original functionality on Windows to track the system light/dark setting (must now use the built-in method instead).

## 1.0.7

- As VS Code now includes a built-in option to match OS theme, refocussed extension on toggling the theme.  Added prompt to change built-in setting.  Added small status-bar icon for theme toggle.

## 1.0.6

- Published release.

## 1.0.5

- Change "extensionKind" to newer array `["ui"]`, rather than old string `"ui"`, with the new meaning that the extension must run locally.  Fixes issue when the only window open is in a remote session.

## 1.0.4

- Internal changes to prepare for a possible future standardized/cross-platform way to detect system dark mode changes.

## 1.0.3

- Robustly handles multiple/rapid dark mode switches.

## 1.0.2

- Uses status bar for information rather than information messages.
- No delay between switching and the confirmation message.

## 1.0.1

- Minor documentation tweaks

## 1.0.0

- Initial release

