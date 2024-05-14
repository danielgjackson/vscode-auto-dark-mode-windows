// VS Code Extension - Toggle Light/Dark Theme
// Dan Jackson, 2019-2024

// NOTE: Built-in command for toggle:  workbench.action.toggleLightDarkThemes  (broken in 1.89 when tracking system theme)


const vscode = require('vscode');

let statusBarItem = null;
let currentStatusMessage = null;
let currentStatusTimeout = null;

function getTheme(dark) {
	const workbenchConfiguration = vscode.workspace.getConfiguration('workbench');
	const theme = workbenchConfiguration.get(dark ? 'preferredDarkColorTheme' : 'preferredLightColorTheme');
	return theme;
}

function toggleTheme() {
	try {
		const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
		const isDark = currentTheme === getTheme(true);
		const setDark = !isDark;
		const newTheme = getTheme(setDark);
		if (newTheme && newTheme !== currentTheme) {
			vscode.workspace.getConfiguration('workbench').update('colorTheme', newTheme, vscode.ConfigurationTarget.Global);
			statusMessage(`${setDark ? 'Dark' : 'Light'}`);
		}
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}

function activate(context) {
	const commandId = 'auto-dark-mode-windows.toggle';
	let disposable = vscode.commands.registerCommand(commandId, toggleTheme);
	context.subscriptions.push(disposable);
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
	const autoDetectColorScheme = vscode.workspace.getConfiguration('window').get('autoDetectColorScheme');
	if (autoDetectColorScheme) {
		statusBarItem.tooltip = `Toggle dark/light theme.\nTracking system theme.`;
	} else {
		statusBarItem.tooltip = `Toggle dark/light theme.\nSet 'window.autoDetectColorScheme' to track system theme.`;
	}
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
