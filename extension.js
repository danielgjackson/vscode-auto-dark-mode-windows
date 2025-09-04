// VS Code Extension - Toggle Light/Dark Theme
// Dan Jackson, 2019-2025

const vscode = require('vscode');

let statusBarItem = null;
let currentStatusMessage = null;
let currentStatusTimeout = null;

const isThemeKindDark = {
	[vscode.ColorThemeKind.Light]: false,				// 1
	[vscode.ColorThemeKind.Dark]: true,					// 2
	[vscode.ColorThemeKind.HighContrast]: true,			// 3
};
// HighContrastLight is also defined in later versions
if (vscode.ColorThemeKind['HighContrastLight']) {
	isThemeKindDark[vscode.ColorThemeKind['HighContrastLight']] = false;	// 4
}

// Built-in tracking blocks theme changes
function isVSAutoDetect() {
	return vscode.workspace.getConfiguration('window').get('autoDetectColorScheme');
}
async function setVSAutoDetect(newTrackingState) {
	if (isVSAutoDetect() != newTrackingState) {
		await vscode.workspace.getConfiguration('window').update('autoDetectColorScheme', newTrackingState, vscode.ConfigurationTarget.Global);
	}
}

// Get the currently-configured theme (ignored if tracking system theme)
function getCurrentTheme() {
	// The configuration
	const config = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	return config;
}

// Whether the active theme kind is dark (whether tracking the system theme or not)
function isActiveThemeDark() {
	const kind = vscode.window.activeColorTheme.kind;
	return isThemeKindDark[kind];
}

// Determine the desired theme for light/dark mode
function getThemeForMode(dark) {
	return vscode.workspace.getConfiguration('workbench').get(dark ? 'preferredDarkColorTheme' : 'preferredLightColorTheme');
}

// Sets the theme for a specific light/dark mode
async function setThemeForMode(dark, theme) {
	return vscode.workspace.getConfiguration('workbench').update(dark ? 'preferredDarkColorTheme' : 'preferredLightColorTheme', theme, vscode.ConfigurationTarget.Global);
}

// Determine if the currently set theme (ignored if tracking system theme) matches a particular mode
function doesThemeMatchMode(dark) {
	return getCurrentTheme() === getThemeForMode(dark);
}

// Sets the current theme (ignored if tracking system theme)
async function setCurrentTheme(dark) {
	const currentTheme = getCurrentTheme();
	const modeTheme = getThemeForMode(dark);
	if (currentTheme === modeTheme) {
		return false;	// already set
	}
	await vscode.workspace.getConfiguration('workbench').update('colorTheme', modeTheme, vscode.ConfigurationTarget.Global);
	return true;
}

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Toggle the theme between light and dark
async function toggleTheme() {
	try {
		if (false) {
			// Optional mode: Always track the system mode, but interchange the themes used for light/dark.

			// Get the current preferred themes
			const preferredDarkColorTheme = getThemeForMode(true);
			const preferredLightColorTheme = getThemeForMode(false);

			// Get original theme values
			let darkTheme = vscode.workspace.getConfiguration('autoDarkMode').get('darkTheme');
			let lightTheme = vscode.workspace.getConfiguration('autoDarkMode').get('lightTheme');

			// If either is not set, or if there is a mismatch (the user has likely changed the preferred themes manually): update the stored values
			const themesUnset = !darkTheme || !lightTheme;
			const themesMatch = (darkTheme == preferredDarkColorTheme && lightTheme == preferredLightColorTheme) || (darkTheme == preferredLightColorTheme && lightTheme == preferredDarkColorTheme)
			if (themesUnset || !themesMatch) {
				darkTheme = getThemeForMode(true);
				lightTheme = getThemeForMode(false);
				vscode.workspace.getConfiguration('autoDarkMode').update('darkTheme', darkTheme, vscode.ConfigurationTarget.Global);
				vscode.workspace.getConfiguration('autoDarkMode').update('lightTheme', lightTheme, vscode.ConfigurationTarget.Global);
			}

			// Ensure auto-tracking is enabled
			const themeInitial = isActiveThemeDark();
			if (!isVSAutoDetect()) {
				await setVSAutoDetect(true);
				await sleep(1000);
			}
			const themeAfter = isActiveThemeDark();

			// If auto-tracking didn't already change the theme, interchange the themes
			if (themeInitial == themeAfter) {
				const inverted = preferredLightColorTheme == lightTheme;
				setThemeForMode(true, preferredLightColorTheme);
				setThemeForMode(false, preferredDarkColorTheme);
				if (inverted) {
					statusMessage(`Interchanged ${themeAfter ? 'Light' : 'Dark'}`);
				} else {
					statusMessage(`Restored ${themeAfter ? 'Light' : 'Dark'}`);
				}
			} else {
				statusMessage('Auto=on');
			}

			return;
		}

		if (true) {
			// Optional mode: Toggle between tracking the system mode and not (changing the custom theme to be the inverse of the current system theme)

			// Get the current state of tracking and the current theme
			const trackInitial = isVSAutoDetect();
			const themeInitial = isActiveThemeDark();

			// Toggle tracking of system theme
			const trackAfter = !trackInitial;
			await setVSAutoDetect(trackAfter);

			// Get the state of the theme afterwards
			// Exit early on theme change, which should be the common case (unless the system theme changes frequently while not being tracked)
			let themeAfter;
			for (let delay = 0; delay < 20; delay++) {
				themeAfter = isActiveThemeDark();
				if (themeAfter != themeInitial) break;
				await sleep(100);
			}

			// Stop if we've already toggled the theme by changing the auto-tracking status.
			// This is the case when the configured theme is the opposite of the system theme.
			if (themeInitial != themeAfter) {
				statusMessage(`Toggled auto=${['off', 'on'][trackAfter ? 1 : 0]}`);
				return;
			}

			// Otherwise, toggling auto-tracking did not change the theme.
			// This is the case when the configured theme is the same as the system theme.
			// We will have to change the configured theme with system theme tracking disabled.
		}

		// Mode: Do not track the system theme, but just toggle between the light and dark themes.
		// Built-in tracking hides theme changes in more recent VS Code versions, so ensure it is disabled.
		await setVSAutoDetect(false);

		// Determine which theme to switch to
		const setDark = !isActiveThemeDark();  // Not using !doesThemeMatchMode(true) as this doesn't work when the system theme is being tracked
		if (false) {
			// Use built-in command to toggle theme
			// Note: this doesn't seem to work here? (Perhaps when recently tracking the system theme?)
			await vscode.commands.executeCommand('workbench.action.toggleLightDarkThemes');
			statusMessage('Toggle Dark/Light');
		} else {
			// Manually set theme
			if (await setCurrentTheme(setDark)) {
				statusMessage(`${setDark ? 'Set Dark' : 'Set Light'}` + ', auto=off');
			}
		}

	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}

function activate(context) {
	const commandId = 'auto-dark-mode-windows.toggle';

	// Register the toggle theme command: auto-dark-mode-windows.toggle
	{
		let disposable = vscode.commands.registerCommand(commandId, toggleTheme);
		context.subscriptions.push(disposable);
	}

	// Detect theme changes: onDidChangeActiveColorTheme. (vscode.window.activeColorTheme)
	// vscode.window.onDidChangeActiveColorTheme((e) => {
	// 	const isDark = isThemeKindDark[e.kind];
	// 	const msg = `DEBUG: Theme changed, dark=${isDark}`;
	// 	statusMessage(msg);
	// 	console.log(msg);
	// });

	// Track uses of the built-in toggle command
	// "activationEvents": [ "onCommand:workbench.action.toggleLightDarkThemes" ]
	// if (true) {
	// 	let disposable = vscode.commands.registerCommand("workbench.action.toggleLightDarkThemes", () => {
	// 		if (isVSAutoDetect) {
	// 			// Note: VSCode theme toggle command doesn't work when tracking system theme.
	// 			// Possibly use own toggle command instead?
	// 		}
	// 	});
	// 	context.subscriptions.push(disposable);
	// }

	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = commandId;
	context.subscriptions.push(statusBarItem);
	updateStatusBarItem();
}

function updateStatusBarItem() {
	if (!statusBarItem) { return; }
	let text = `$(color-mode)`;
	if (currentStatusMessage) {
		text = text + ' ' + currentStatusMessage;
	}
	statusBarItem.text = text;
	statusBarItem.tooltip = `Toggle dark/light theme.`;
	statusBarItem.show();
}

function statusMessage(message) {
	const timeout = 2000;
	if (true && message) {
		console.log(`AUTO-DARK-MODE: ${message}`);
	}
	if (currentStatusTimeout) {
		clearTimeout(currentStatusTimeout);
		currentStatusTimeout = null;
	}
	if (!statusBarItem) {
		if (message) {
			vscode.window.setStatusBarMessage(message, timeout);
		}
		return;
	}
	currentStatusMessage = message;
	updateStatusBarItem();
	if (message !== null) {
		currentStatusTimeout = setTimeout(() => {
			statusMessage(null);
		}, timeout);
	}
}

module.exports = {
	activate
};
