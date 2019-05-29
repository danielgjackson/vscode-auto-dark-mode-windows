const vscode = require('vscode');
//const path = require('path');
const fs = require('fs');
const child_process = require('child_process');

let terminating = false;
let process = null;
let buffer = "";

function spawnProcess(context) {
	try {
		//const queryDarkCommand = path.join(__dirname, 'query-dark.cmd');
		const queryDarkCommand = context.asAbsolutePath('query-dark.cmd');
		if (!fs.existsSync(queryDarkCommand)) {
			console.error(`Dark mode: Command script not found: ${queryDarkCommand}`);
			return false;
		}
		const options = {
			stdio: [
				null,
				'pipe',
				'pipe',
			]
		}
		//console.log('Spawning: ', queryDarkCommand);
		process = child_process.spawn('cmd.exe', ['/c', queryDarkCommand], options);

		process.stdout.on('data', (data) => {
			buffer += data;
			let idx;
			while ((idx = buffer.indexOf('\n')) >= 0) {
				const line = buffer.substr(0, idx).trim();
				buffer = buffer.substr(idx + 1);
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
				vscode.window.showErrorMessage(`Error matching theme to dark mode`);
			}
		});
		return true;
	} catch (e) {
		console.error(e);
		return false;
	}
}

function isDarkTheme() {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const darkTheme = vscode.workspace.getConfiguration('autoDarkMode').get(`darkTheme`);
	return currentTheme === darkTheme;
}

function setTheme(isDark) {
	const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
	const themeConfiguration = vscode.workspace.getConfiguration('autoDarkMode');
	const newTheme = themeConfiguration.get(isDark ? 'darkTheme' : 'lightTheme');
	if (newTheme !== currentTheme) {
		vscode.workspace.getConfiguration('workbench').update('colorTheme', newTheme, vscode.ConfigurationTarget.Global)
		return isDark;
	}
	return null;
}

async function matchDarkMode(dark) {
	try {
		if (setTheme(dark) !== null) {
			vscode.window.showInformationMessage(`Switched theme to ${dark ? 'dark' : 'light'} to match Windows.`);
		}
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error matching theme to dark mode`);
	}
}

async function toggleTheme() {
	try {
		const dark = !isDarkTheme();
		if (setTheme(dark) !== null) {
			vscode.window.showInformationMessage(`Toggled theme to ${dark ? 'dark' : 'light'}.`);
		}
	} catch(e) {
		console.error(e);
		vscode.window.showErrorMessage(`Error toggling theme`);
	}
}


function activate(context) {
	//console.log('"auto-dark-mode-windows" activated');
	let disposable = vscode.commands.registerCommand('auto-dark-mode-windows.toggle', toggleTheme);

	terminating = false;
	if (!spawnProcess(context)) {
		vscode.window.showErrorMessage(`Error spawning dark mode monitoring process`);
	}

	context.subscriptions.push(disposable);
}

function deactivate() {
	//console.log('"auto-dark-mode-windows" deactivating');
	if (process !== null) {
		terminating = true;
		process.kill('SIGINT');	// 'SIGTERM', 'SIGINT', 'SIGHUP'
		process = null;
	}
	return undefined;	// synchronous shutdown
}

module.exports = {
	activate,
	deactivate
}
