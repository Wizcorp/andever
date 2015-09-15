#!/usr/bin/env node

'use strict';


// set up exception handling

function handleError(error) {
	const exitCode = typeof error.exitCode === 'number' ? error.exitCode : -1;

	if (process.env.DEBUG) {
		console.error(error.stack);
	} else {
		console.error(error.message);
	}

	process.exit(exitCode);
}

process.on('uncaughtException', handleError);


// parse app path and options

const argv = process.argv.slice(2);
const command = argv[0];

var options = {
	appPath: undefined,
	append: false,
	stdio: ['ignore', 'ignore', 'ignore'],
	pidPath: undefined
};

for (var i = 1; i < argv.length; i += 1) {
	var m, arg = argv[i];

	if (i === 1 && !arg.match(/^-/)) {
		options.appPath = arg;
		continue;
	}

	if (arg === '--append') {
		options.append = true;
		continue;
	}

	m = arg.match(/^--out=(.+)$/);
	if (m) {
		options.stdio[1] = m[1].trim();
		continue;
	}

	m = arg.match(/^--err=(.+)$/);
	if (m) {
		options.stdio[2] = m[1].trim();
		continue;
	}

	m = arg.match(/^--pid=(.+)$/);
	if (m) {
		options.pidPath = m[1].trim();
		continue;
	}
}

const andever = require('../lib');

function help() {
	console.log();
	console.log('  AndEver usage: andever <command> [path] [options]');
	console.log();
	console.log('    path           the path to your Node.js app');
	console.log();
	console.log('    command:');
	console.log('      start        daemonizes the app');
	console.log('      restart      restarts the daemonized app');
	console.log('      stop         stops the daemonized app');
	console.log('      status       outputs the status of the running app (exit codes: 0 = running, 1 = not running)');
	console.log();
	console.log('    options:');
	console.log('      --out=path   file path to write the app\'s stdout to (applies to "start" and "restart")');
	console.log('      --err=path   file path to write the app\'s stderr to (applies to "start" and "restart")');
	console.log('      --append     will append to log files instead of truncating (applies to "start" and "restart")');
	console.log('      --pid=path   file path to write the PID file to (applies to all commands)');
	console.log();
}

var fn = help;

if (command) {
	andever.setOptions(options);

	switch (command) {
		case 'monitor': fn = andever.monitor; break;
		case 'start': fn = andever.start; break;
		case 'restart': fn = andever.restart; break;
		case 'stop': fn = andever.stop; break;
		case 'status': fn = andever.status; break;
	}
}

try {
	fn();
} catch (error) {
	handleError(error);
}
