# AndEver

A minimalistic daemonizer that will run your Node apps forever and ever!

## Installing

```sh
npm install --save andever
```

In your package.json, you can now add:

```json
{
	"scripts": {
		"start": "andever start",
		"restart": "andever restart",
		"stop": "andever stop"
	}
}
```

Now you can control your app's lifecycle by running `npm start`, `npm restart` and `npm stop`.

## Why another process manager?

Short answer: because all the other ones give me headaches.

Long answer:

If you want to use PM2 or Forever and you really are happy with them, please use them. This is not for you. I have my
own reasons though, and I'll try to sum them up quickly here:

1. A simple process manager should be a very simple solution.
   Right now, PM2 has become so bloated the amount of code and dependencies it adds to your project are probably bigger
   than your project itself. I just wanna daemonize my app! PM2 is well maintained, but has become bloatware.
3. Forever on the other hand is abandonware. The number of unaddressed issues has reached such a point that using
   forever would make me lose sleep at night.
3. Forever just never seems to work for me. The fact that I can run "forever start myapp" multiple times and have it not
   complain is a major frustration for me.

### It's time for something new

Let's do this the substack way. AndEver is a 0-dependency solution to solve just one thing: daemonization of your Node
app. Nothing fancy. Just a nice and simple solution.

### But I want...

* ... lists of all processes that are running! Run `ps`.
* ... it to do stuff that has nothing to do with daemonization! Yeah... no.
* Alright, make an issue and we'll talk about it. But we're not going to bloat AndEver with useless bells and whistles.

## Usage

```
AndEver usage: andever <command> [path] [options]

  path           the path to your Node.js app

  command:
	start        daemonizes the app
	restart      restarts the daemonized app
	stop         stops the daemonized app
	status       outputs the status of the running app (exit codes: 0 = running, 1 = not running)

  options:
	--out=path   file path to write the app's stdout to (applies to "start" and "restart")
	--err=path   file path to write the app's stderr to (applies to "start" and "restart")
	--append     will append to log files instead of truncating (applies to "start" and "restart")
	--pid=path   file path to write the PID file to (applies to all commands)
```

## Behavior

When running AndEver to boot your app, it will run a copy of itself in the background that will only have one
responsibility: restarting your app if it unexpectedly goes down. However, if it goes down with an exit code 0 or
because of a signal it received, we don't restart it.

When the process is started up, its PID is written to its root folder in a file called `.andever.pid`. This file will
be used by the other commands (restart, stop and status).

AndEver does **not** take care of your [cluster](https://nodejs.org/api/cluster.html) setup. We feel that this is the
responsibility of the cluster management code, not the daemonizer, and so we have not bloated AndEver with such logic.
There is no cluster logic to be found here.

## License

MIT, enjoy.
