'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;
const joinPath = require('path').join;
const resolvePath = require('path').resolve;
const nodePath = process.argv[0];

const termTimeout = 5000;
const respawnDelay = 2000;

var appPath = process.cwd();
var pidPath = joinPath(appPath, '.andever.pid');
var stdio = 'ignore';
var appName;

function getAppName() {
	try {
		const pkg = JSON.parse(fs.readFileSync(joinPath(appPath, 'package.json'), 'utf8'));
		if (pkg.name) {
			return pkg.name;
		}
	} catch (error) { /* ignore */ }

	return 'Application';
}

appName = getAppName();


function transformStdio(value, append) {
	if (Array.isArray(value)) {
		return value.map(function (val) {
			return transformStdio(val, append);
		});
	}

	if (typeof value === 'string') {
		value = value.trim();

		if (value && value !== 'ignore' && value !== 'ipc' && value !== 'pipe' && value !== 'inherit') {
			// looks like a path, so treat it like one

			const fd = fs.openSync(value, append ? 'a' : 'w');
			return fs.createWriteStream(null, { fd: fd });
		}
	}

	return 'ignore';
}


exports.setOptions = function (opts) {
	if (opts.appPath) {
		appPath = fs.realpathSync(opts.appPath);
		pidPath = joinPath(appPath, '.andever.pid');
		appName = getAppName();
	}

	if (opts.pidPath) {
		pidPath = resolvePath(appPath, opts.pidPath);
	}

	if (opts.stdio) {
		stdio = transformStdio(opts.stdio, opts.append);
	}
};


function noop() {}

function pidResponds(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return false;
	}
}

function delPid() {
	try {
		fs.unlinkSync(pidPath);
	} catch (error) {
		// ignore errors
	}
}

function setPid(pid) {
	fs.writeFileSync(pidPath, String(pid));
}

function getPid() {
	var pid;

	try {
		pid = fs.readFileSync(pidPath, { encoding: 'utf8' });
	} catch (error) {
		if (error.code === 'ENOENT') {
			return 0;
		}

		error.exitCode = 255;
		throw error;
	}

	pid = parseInt(pid, 10);

	if (!pidResponds(pid)) {
		delPid();
		return 0;
	}

	return pid;
}


function assertNotRunning() {
	const pid = getPid();
	if (pid) {
		var error = new Error(appName + ' is already running (pid: ' + pid + ')');
		error.exitCode = 1;
		throw error;
	}
}


function monitor() {
	const proc = spawn(nodePath, [appPath], {
		stdio: stdio,
		detached: false
	});

	console.log(appName + ' is running (pid: ' + proc.pid + ')');

	setPid(proc.pid);

	function shutdown() {
		term(function () {
			process.exit(0);
		});
	}

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	proc.on('exit', function (code, signal) {
		delPid();

		if (typeof code === 'number') {
			if (code === 0) {
				console.log(appName + ' shut down gracefully.');
				process.exit(0);
			} else {
				console.error(appName + ' shut down with exit code: ' + code + '.');
				process.exit(code);
			}
		}

		if (signal) {
			console.log(appName + ' shut down (signal: ' + signal + ').');
			process.exit(0);
		}

		console.log('Restarting ' + appName);

		setTimeout(function () {
			monitor();
		}, respawnDelay)
	});
}


function start() {
	assertNotRunning();

	// start the monitor

	const argv = process.argv.slice(1);
	var index = argv.indexOf('start');
	if (index === -1) {
		index = argv.indexOf('restart');
	}

	if (index === -1) {
		throw new Error('Could not detect "start" or "restart" command argument.');
	}

	argv[index] = 'monitor';

	const proc = spawn(nodePath, argv, {
		stdio: 'ignore',
		detached: true
	});

	proc.unref();

	console.log(appName + ' is now being monitored');
}


function kill(cb) {
	cb = cb || noop;

	const pid = getPid();

	var interval = setInterval(function () {
		if (!pidResponds(pid)) {
			clearInterval(interval);
			console.log(appName + ' terminated.');
			delPid();
			return cb();
		}

		process.kill(pid, 'SIGKILL');
	}, 200);
}


function term(cb) {
	cb = cb || noop;

	const pid = getPid();
	if (!pid) {
		console.log(appName + ' is not running');
		return cb();
	}

	process.kill(pid, 'SIGTERM');

	var timeSpent = 0;
	var step = 200;

	var interval = setInterval(function () {
		timeSpent += step;

		if (pidResponds(pid)) {
			if (timeSpent >= termTimeout) {
				console.error(appName + ' termination timed out, falling back to SIGKILL...');
				clearInterval(interval);
				kill(cb);
			}
		} else {
			clearInterval(interval);
			console.log(appName + ' terminated.');
			delPid();
			cb();
		}
	}, step);
}


/**
 * Runs the app in the foreground, restarting whenever the app unexpectedly shuts down.
 */

exports.monitor = function () {
	monitor();
};

/**
 * Spawns a monitor instance (see monitor)
 */

exports.start = function () {
	start();
};

/**
 * Restarts a running application
 */

exports.restart = function () {
	term(start);
};

/**
 * Stops a running application
 */

exports.stop = function () {
	term();
};

/**
 * Prints the status of the application and returns an appropriate exit code to match the status
 */

exports.status = function () {
	const pid = getPid();
	if (pid) {
		console.log(appName + ' is running (pid: ' + pid + ')');
		process.exit(0);
	}

	console.log(appName + ' is not running');
	process.exit(1);
};
