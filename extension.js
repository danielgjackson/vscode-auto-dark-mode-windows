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
	[vscode.ColorThemeKind.HighContrastLight]: false,	// 4
};

// Built-in tracking blocks theme changes
function isVSAutoDetect() {
	return vscode.workspace.getConfiguration('window').get('autoDetectColorScheme');
}
async function setVSAutoDetect(newTrackingState) {
	if (isVSAutoDetect() != newTrackingState) {
		await vscode.workspace.getConfiguration('window').update('autoDetectColorScheme', newTrackingState, vscode.ConfigurationTarget.Global);
	}
}

// Determine the desired theme for light/dark mode
function getCurrentTheme() {
	// The configuration
	const config = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	return config;
}

// Whether the active theme kind is dark
function isActiveThemeDark() {
	const kind = vscode.window.activeColorTheme.kind;
	return isThemeKindDark[kind];
}

// Determine the desired theme for light/dark mode
function getThemeForMode(dark) {
	return vscode.workspace.getConfiguration('workbench').get(dark ? 'preferredDarkColorTheme' : 'preferredLightColorTheme');;
}

// Determine if the theme matches a particular mode
function doesThemeMatchMode(dark) {
	return getCurrentTheme() === getThemeForMode(dark);
}

// Sets the theme to a specific mode
async function setThemeForMode(dark) {
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
		// Experimental: Toggle between tracking the system mode to try to flip to the opposite theme.

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

		// Built-in tracking hides theme changes in more recent VS Code versions, so ensure it is disabled.
		await setVSAutoDetect(false);

		// Determine which theme to switch to
		const setDark = !doesThemeMatchMode(true);
		if (false) {
			// Use built-in command to toggle theme
			// Note: this doesn't seem to work here? (Perhaps when recently tracking the system theme?)
			await vscode.commands.executeCommand('workbench.action.toggleLightDarkThemes');
			statusMessage('Toggle Dark/Light');
		} else {
			// Manually set theme
			if (await setThemeForMode(setDark)) {
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
