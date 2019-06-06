const vscode = require('vscode');
const os = require('os')
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

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
		
		// (Preferred) Executable that efficiently waits for a change
		const waitRegistryCommand = context.asAbsolutePath('wait-registry.exe');
		// (Alternative) Batch file that inefficiently polls for a change
		const queryDarkBatch = context.asAbsolutePath('query-dark.cmd');
		
		if (fs.existsSync(waitRegistryCommand)) {
			process = child_process.spawn(waitRegistryCommand, ['HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize', 'AppsUseLightTheme', '*'], options);
		} else if (fs.existsSync(queryDarkBatch)) {
			process = child_process.spawn('cmd.exe', ['/c', queryDarkBatch], options);
		} else {
			console.error(`Dark mode: External watch programs not found: ${waitRegistryCommand} / ${queryDarkBatch}`);
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
					console.log(`Dark mode: unexpected stdout: ${data}`);
				}
			}
		});
		process.stderr.on('data', (data) => {
			console.error(`Dark mode: stderr: ${data}`);
		});
		process.on('close', (code) => {
			if (!terminating) {
				console.error(`Dark mode: unexpected exit: ${code}`);
				vscode.window.showErrorMessage(`Dark mode: unexpected process exit: ${code}`);
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

function isDarkTheme() {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const darkTheme = vscode.workspace.getConfiguration('autoDarkMode').get(`darkTheme`);
	return currentTheme === darkTheme;
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
			const themeConfiguration = vscode.workspace.getConfiguration('autoDarkMode');
			let newTheme = themeConfiguration.get(action.isDark ? 'darkTheme' : 'lightTheme');
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
			vscode.window.setStatusBarMessage(`Switched theme to ${isDark ? 'dark' : 'light'} to match Windows. 'Toggle Theme' command to switch back.`);
		}
		
		const result = await setTheme(dark, true, switched);

		if (result === undefined) {	// another process is switching
			vscode.window.setStatusBarMessage(`Switching theme to ${dark ? 'dark' : 'light'} to match Windows. 'Toggle Theme' command to switch back.`);
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
			vscode.window.setStatusBarMessage(`Toggled theme to ${isDark ? 'dark' : 'light'}.`);
		}
		await setTheme(dark, false, toggled);
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}


function activate(context) {
	//console.log('"auto-dark-mode-windows" activated');
	let disposable = vscode.commands.registerCommand('auto-dark-mode-windows.toggle', toggleTheme);
	context.subscriptions.push(disposable);

	context.subscriptions.push({ dispose: killProcess() });

	const release = os.release().split('.').map(x => parseInt(x));
	if (os.platform() !== 'win32' || release.length < 3 || release[0] < 10 || (release[0] === 10 && release[1] === 0 && release[2] < 17763)) {
		vscode.window.showWarningMessage(`Dark mode: This extension can only monitor Dark Mode on Windows 10 (after October 2018 update).`);
	} else if (!spawnProcess(context)) {
		vscode.window.showErrorMessage(`Dark mode: Error spawning monitoring process`);
	}
}

async function deactivate() {
	//console.log('"auto-dark-mode-windows" deactivating');
	await killProcess();
}

module.exports = {
	activate,
	deactivate
}
