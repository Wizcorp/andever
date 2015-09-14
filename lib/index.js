'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;
const joinPath = require('path').join;
const nodePath = process.argv[0];

const options = {
	termTimeout: 5000,
	respawnDelay: 2000
};

var appName = 'Application';
var appPath;
var pidPath;


exports.setPath = function setPath(path) {
	appPath = fs.realpathSync(path);
	pidPath = joinPath(appPath, '.andever.pid');

	try {
		const pkg = JSON.parse(fs.readFileSync(joinPath(appPath, 'package.json'), 'utf-8'));
		if (pkg.name) {
			appName = pkg.name;
		}
	} catch (error) {
		// ignore
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
		pid = fs.readFileSync(pidPath, { encoding: 'utf-8' });
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
		stdio: 'inherit',
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
		}, options.respawnDelay)
	});
}


function start() {
	assertNotRunning();

	// start the monitor

	const argv = process.argv.slice(1);
	const index = argv.indexOf('start');
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
			if (timeSpent >= options.termTimeout) {
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


exports.monitor = function () {
	monitor();
};

exports.start = function () {
	start();
};

exports.restart = function () {
	term(start);
};

exports.stop = function () {
	term();
};

exports.status = function () {
	const pid = getPid();
	if (pid) {
		console.log(appName + ' is running (pid: ' + pid + ')');
		process.exit(0);
	}

	console.log(appName + ' is not running');
	process.exit(1);
};
