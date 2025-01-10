// VS Code Extension - Toggle Light/Dark Theme
// Dan Jackson, 2019-2025

const vscode = require('vscode');

let statusBarItem = null;
let currentStatusMessage = null;
let currentStatusTimeout = null;


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
	return vscode.workspace.getConfiguration('workbench').get('colorTheme');
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

// async function sleep(ms) {
// 	return new Promise(resolve => setTimeout(resolve, ms));
// }

// Toggle the theme between light and dark
async function toggleTheme() {
	try {

/*
		New possible approach: 
		* When the system theme is not being tracked: toggle the current theme between light and dark.
		* When the system theme is being tracked: swap the preferred light/dark themes and, on supported platforms (non-web), track the system theme changes and reset the preferred schemes to their original values (if this is possible to determine, including if the names are translated?)
*/


/*
		// Experimental: Toggle between tracking the system mode to set the theme and the opposite theme.
		// Difficulty: No built-in way to detect the system mode.
		// Approach doesn't work as theme is not updated

		let autoOnDark = null;
		let autoOffDark = null;

		if (isVSAutoDetect()) {
			// Automatic theme detection is initially enabled
			autoOnDark = doesThemeMatchMode(true);
			await setVSAutoDetect(false);
			await sleep(2000);
			autoOffDark = doesThemeMatchMode(true);
		} else {
			// Automatic theme detection is initially disabled
			autoOffDark = doesThemeMatchMode(true);
			await setVSAutoDetect(true);
			await sleep(2000);
			autoOnDark = doesThemeMatchMode(true);
		}

		// Determine if the theme matches the mode
		if (autoOnDark === autoOffDark) {
			// Turn off auto mode
			await setVSAutoDetect(false);
			// Use built-in command to toggle theme
			await vscode.commands.executeCommand('workbench.action.toggleLightDarkThemes');
			statusMessage(`Theme matches auto mode -- toggled off`);
		} else {
			statusMessage(`Theme already changed after toggling auto mode.`);
		}
*/

		// Built-in tracking hides theme changes, so disable it
		await setVSAutoDetect(false);

		// // Determine which theme to switch to
		// const setDark = !doesThemeMatchMode(true);
		// if (true) {
			// Use built-in command to toggle theme
			await vscode.commands.executeCommand('workbench.action.toggleLightDarkThemes');
			statusMessage('Toggle Dark/Light');
		// } else {
		// 	// Manually set theme
		// 	if (await setThemeForMode(setDark)) {
		// 		statusMessage(`${setDark ? 'Set Dark' : 'Set Light'}`);
		// 	}
		// }

	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}

function activate(context) {
	const commandId = 'auto-dark-mode-windows.toggle';

	{
		let disposable = vscode.commands.registerCommand(commandId, toggleTheme);
		context.subscriptions.push(disposable);
	}

	// "activationEvents": [ "onCommand:workbench.action.toggleLightDarkThemes" ]
	// workbench.action.toggleLightDarkThemes
	if (true) {
		let disposable = vscode.commands.registerCommand("workbench.action.toggleLightDarkThemes", () => {
			statusMessage(`DEBUG: System toggle command fired`);
		});
		context.subscriptions.push(disposable);
	}

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
