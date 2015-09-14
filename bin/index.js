#!/usr/bin/env node

'use strict';

const argv = process.argv.slice(2);
var command = argv[0];
const path = argv[1] || process.cwd();

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

const andever = require('../lib');

function help() {
	console.log();
	console.log('  AndEver usage: andever <path> <command>');
	console.log();
	console.log('    path:      the path to your Node.js app');
	console.log('    command:');
	console.log('      start:   daemonizes the app');
	console.log('      restart: restarts the daemonized app');
	console.log('      stop:    stops the daemonized app');
	console.log('      status:  outputs the status of the running app (exit codes: 0 = running, 1 = not running)');
	console.log();
}

var fn = help;

if (path) {
	andever.setPath(path);

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
