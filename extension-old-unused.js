// Note: This is the older version that used an external process.

const vscode = require('vscode');
const os = require('os')
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

const title = 'Toggle Light/Dark Theme';

let terminating = false;
let process = null;
let outBuffer = "";
let pendingAction = null;

const lockFilePath = path.join(os.tmpdir(), 'vscode-auto-dark-mode-windows.lock');

function spawnProcess(context) {
	try {
		const options = {
			stdio: [
				null,
				'pipe',
				'pipe',
			]
		}
		
		// Executable that efficiently waits for a change
		let watcherExecutable = null;
		if (os.platform() === 'win32') {
			watcherExecutable = 'watcher-win.exe';
		} else if (os.platform() === 'darwin') {
			watcherExecutable = 'watcher-mac';
		} else if (os.platform() === 'linux') {
			watcherExecutable = 'watcher-lin';
		}

		if (!watcherExecutable) {
			console.error(`${title}: Unsupported platform for watching system scheme: ${os.platform()}`);
			return false;
		}
		const waitRegistryCommand = context.asAbsolutePath(watcherExecutable);
		
		if (fs.existsSync(waitRegistryCommand)) {
			process = child_process.spawn(waitRegistryCommand, [], options);
		} else {
			console.error(`${title}: External watch program not found: ${waitRegistryCommand}`);
			return false;
		}

		process.stdout.on('data', (data) => {
			outBuffer += data;
			let idx;
			while ((idx = outBuffer.indexOf('\n')) >= 0) {
				const line = outBuffer.substr(0, idx).trim();
				outBuffer = outBuffer.substr(idx + 1);
				const value = parseInt(line);
				if (value !== 0 || line === "0") {
					matchDarkMode(value == 0);
				} else {
					console.warn(`${title}: unexpected stdout: ${data}`);
				}
			}
		});
		process.stderr.on('data', (data) => {
			console.error(`${title}: stderr: ${data}`);
		});
		process.on('close', (code) => {
			if (!terminating) {
				console.error(`${title}: unexpected exit: ${code}`);
				vscode.window.showErrorMessage(`${title}: unexpected process exit: ${code}`);
			}
		});
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}

async function killProcess() {
	if (process !== null) {
		terminating = true;
		process.kill('SIGINT'); // 'SIGHUP', 'SIGINT', 'SIGTERM', 'SIGKILL'
		process = null;
	}
}

function getTheme(light) {
	// Get the new, standard preferred theme setting
	const workbenchConfiguration = vscode.workspace.getConfiguration('workbench');
	let theme = workbenchConfiguration.get(light ? 'preferredLightColorTheme' : 'preferredDarkColorTheme');
	if (!theme) {
		// Get the old extension-specific configuration
		const themeConfiguration = vscode.workspace.getConfiguration('autoDarkMode');
		theme = themeConfiguration.get(light ? 'lightTheme' : 'darkTheme');
	}
	if (!theme) {
		// Give up and return current theme
		theme = workbenchConfiguration.get('colorTheme');
	}
	return theme;
}

function isDarkTheme() {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	return currentTheme === getTheme(false);
}

async function setTheme(isDark, delay, complete) {
	// cope with change request during settle delay
	pendingAction = { isDark, delay, complete };

	// Use a lock-file to make sure we only do this in one instance of VS Code
	let lockFile = null;
	try {
		// Try to clean a stale lock file (will fail if held by another)
		try {
			if (fs.existsSync(lockFilePath)) {
				fs.unlinkSync(lockFilePath);
			}
		} catch(e) { ; }

		lockFile = fs.openSync(lockFilePath, 'wx+');
		for (;;) {
			const action = pendingAction;
			const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
			let newTheme = getTheme(!action.isDark);
			if (newTheme !== currentTheme) {
				vscode.workspace.getConfiguration('workbench').update('colorTheme', newTheme, vscode.ConfigurationTarget.Global);
				if (action.complete) { action.complete(action.isDark); }
				if (action.delay) {
					// Delay a little while in the lock so other instances will lose the race
					await new Promise((resolve) => setTimeout(resolve, 5000));
				}
			}
			// Check no other changes while we were busy
			if (action === pendingAction) {
				return action.isDark;
			}
		}
	} catch(e) {
		// Could not lock (pending action)
		return undefined;
	} finally {
		try { if (lockFile != null) { fs.closeSync(lockFile); } } catch (e) { ; }
		if (fs.existsSync(lockFilePath)) {
			try { if (lockFile != null) { fs.unlinkSync(lockFilePath); } } catch (e) { ; }
		}
	}
}

async function matchDarkMode(dark) {
	try {
		function switched(isDark) {
			statusMessage(`${isDark ? 'Dark' : 'Light'}`);
		}
		
		const result = await setTheme(dark, true, switched);

		if (result === undefined) {	// another process is switching
			statusMessage(`${dark ? 'Dark' : 'Light'}`);
		}
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Problem while matching theme to ${dark ? 'dark' : 'light'}`);
	}
}

async function toggleTheme() {
	try {
		const dark = !isDarkTheme();
		function toggled(isDark) {
			statusMessage(`${isDark ? 'Dark' : 'Light'}`);
		}
		await setTheme(dark, false, toggled);
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}

let statusBarItem = null;

function activate(context) {
	//console.info(`${title}: activated`);

	const commandId = 'auto-dark-mode-windows.toggle';

	let disposable = vscode.commands.registerCommand(commandId, toggleTheme);
	context.subscriptions.push(disposable);

	// create a new status bar item that we can now manage
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = commandId;
	context.subscriptions.push(statusBarItem);

	context.subscriptions.push({ dispose: killProcess() });

	let useBuiltIn = false;
	const autoDetectColorScheme = vscode.workspace.getConfiguration('window').get('autoDetectColorScheme');
	if (autoDetectColorScheme) {
		useBuiltIn = true;
		//context.subscriptions.push(vscode.window.onDidChangeTheme(updateStatusBarItem));
		//vscode.window.showInformationMessage(`${title}: Using built-in theme switching.`);
	}
	// Placeholder code for possible cross-platform, method of detecting system dark mode changes
	/*
	// OLD POSSIBILITY 1: 'nativeTheme' module has the property: nativeTheme.shouldUseDarkColors / nativeTheme.themeSource
	// OLD POSSIBILITY 2: const { systemPreferences } = require('electron'); systemPreferences.isDarkMode();
	// OLD POSSIBILITY 3: If extensions could get a real 'window' object, could use matchMedia()
	const windowObject = vscode.window; // This is not a real 'window' object
	if (windowObject && windowObject.matchMedia) {
		const matchMediaDark = windowObject.matchMedia('(prefers-color-scheme: dark)');
		if (matchMediaDark.media !== 'not all') {
			const listener = (isDark) => {
				//vscode.window.showInformationMessage('BUILT-IN: state =', isDark.matches);
				matchDarkMode(isDark.matches);
			}
			useBuiltIn = true;
			//vscode.window.showInformationMessage('BUILT-IN: addListener');
			matchMediaDark.addListener(listener);
			context.subscriptions.push({ dispose: async () => {
				//vscode.window.showInformationMessage('BUILT-IN: removeListener');
				matchMediaDark.removeListener(listener);
			}});
			listener(matchDarkMode);
		}
	}
	//vscode.window.showErrorMessage(`BUILT-IN: Using=${useBuiltIn}`);
	*/

	if (!useBuiltIn) {
		const preference = 'window.autoDetectColorScheme';
		vscode.window.showInformationMessage(
			`VS Code can now match the system dark mode itself -- please set the setting: '${preference}'.  This extension may still be used as a shortcut to manually toggle the theme (default: Cmd/Ctrl+Alt+Shift+T)`,
			'Settings...'
		).then((item) => {
			if (!item) return;
			vscode.commands.executeCommand('workbench.action.openSettings', preference);
		});

		const release = os.release().split('.').map(x => parseInt(x));
		if (os.platform() !== 'win32' || release.length < 3 || release[0] < 10 || (release[0] === 10 && release[1] === 0 && release[2] < 17763)) {
			vscode.window.showWarningMessage(`${title}: This extension can only monitor Dark Mode on Windows 10 (after October 2018 update).`);
		} else if (!spawnProcess(context)) {
			vscode.window.showErrorMessage(`${title}: Error spawning monitoring process`);
		}
	}

	updateStatusBarItem();
}

let currentStatusMessage = null;
let currentStatusTimeout = null;

function updateStatusBarItem() {
	if (!statusBarItem) return;
	// https://code.visualstudio.com/api/references/icons-in-labels
	// $(color-mode) $(activate-breakpoints) $(symbol-null) $(light-bulb) $(circle-filled)/$(circle-outline) $(star-full)/$(star-empty) $(eye)/$(eye-closed)
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
		if (!message) {
			vscode.window.setStatusBarMessage(message, timeout);
		}
		return;
	}
	currentStatusMessage = message;
	updateStatusBarItem();
	currentStatusTimeout = setTimeout(() => {
		statusMessage(null);
	}, timeout);
}

async function deactivate() {
	//console.info(`${title}: deactivating`);
	statusBarItem = null;
	await killProcess();
}

module.exports = {
	activate,
	deactivate
}
