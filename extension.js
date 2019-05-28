const vscode = require('vscode');
const child_process = require('child_process');

// TODO: Use an API to query the registry (and not spawn a process): HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize AppsUseLightTheme REG_DWORD:0
// TODO: Instead of polling, use RegNotifyChangeKeyValue() or WM_WININICHANGE / WM_SETTINGCHANGE messages.

// Yuck, horrible spawned process that will be polled -- TODO: Remove this rubbish!
async function isDarkMode() {
	return new Promise(function(resolve, reject) {
		const options = {};
		function callback(error, stdout, stderr) {
			const regexDarkMode = /^\s*AppsUseLightTheme\s+REG_DWORD\s+0x0\s*$/gm;
			const darkMode = stdout.match(regexDarkMode) !== null;
			resolve(darkMode);
		}
		child_process.exec('reg.exe query HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize /v AppsUseLightTheme', options, callback);
	});
}

function isDarkTheme() {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const darkTheme = vscode.workspace.getConfiguration('autoDarkMode').get(`darkTheme`);
	return currentTheme === darkTheme;
}

function setDarkTheme(isDark) {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const themeConfiguration = vscode.workspace.getConfiguration('autoDarkMode');
	const newTheme = themeConfiguration.get(isDark ? 'darkTheme' : 'lightTheme');
	if (newTheme !== currentTheme) {
		vscode.workspace.getConfiguration('workbench').update('colorTheme', newTheme, vscode.ConfigurationTarget.Global)
		return isDark;
	}
	return null;
}

async function matchDarkMode() {
	try {
		const dark = await isDarkMode();
		if (lastMode !== dark) {	// Only react to changes (allows manual toggle)
			lastMode = dark;
			if (setDarkTheme(dark) !== null) {
				vscode.window.showInformationMessage(`Switched theme to ${dark ? 'dark' : 'light'} to match Windows.`);
			}
		}
	} catch(e) {
		console.error(e);
		vscode.window.showInformationMessage(`Error matching theme to dark mode`);
	}
}

async function toggleTheme() {
	try {
		const dark = !isDarkTheme();
		if (setDarkTheme(dark) !== null) {
			vscode.window.showInformationMessage(`Toggled theme to ${dark ? 'dark' : 'light'}.`);
		}
	} catch(e) {
		console.error(e);
		vscode.window.showInformationMessage(`Error toggling theme`);
	}
}



let timerId = null;
let lastMode = null;		// Track system dark mode - only react to changes (allows manual toggle)

function activate(context) {
	console.log('"auto-dark-mode-windows" activated.');
	let disposable = vscode.commands.registerCommand('auto-dark-mode-windows.toggle', toggleTheme);
	timerId = setInterval(matchDarkMode, 10000);
	matchDarkMode();
	context.subscriptions.push(disposable);
}

function deactivate() {
	console.log('"auto-dark-mode-windows" deactivated.');
	clearInterval(timerId);
	timerId = null;
}

module.exports = {
	activate,
	deactivate
}
