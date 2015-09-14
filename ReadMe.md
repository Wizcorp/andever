# AndEver

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

## Why another process manager?

Short answer: because all the other ones give me headaches.

Long answer:

If you want to use PM2 or Forever and you really are happy with them, please use them. This is not for you. I have my
own reasons though, and I'll try to sum them up quickly here:

1. A simple process manager should be a very simple solution.
   Right now, PM2 has become so bloated the amount of code and dependencies it adds to your project are probably bigger
   than your project itself. I just wanna daemonize! PM2 is well maintained, but has become bloatware.
3. Forever on the other hand is abandonware. The number of unaddressed issues has reached such a point that I using
   forever makes me lose sleep at night.
3. Forever just never seems to work for me. The fact that I can run "forever start myapp" multiple times and have it not
   complain is a major frustration for me.

## It's time for something new

Let's do this the substack way. AndEver is a 0-dependency solution to solve just one thing: daemonization of your Node
app. Nothing fancy. Just a nice and simple solution.

## But I want...

* ... lists of all processes that are running! Run `ps`.
* ... it to do stuff that has nothing to do with daemonization! Yeah... no.
* Alright, make an issue and we'll talk about it. But we're not going to bloat AndEver with useless bells and whistles.

## Usage

```
AndEver usage: andever <command> [path]

  command:
	start:   daemonizes the app
	restart: restarts the daemonized app
	stop:    stops the daemonized app
	status:  outputs the status of the running app (exit codes: 0 = running, 1 = not running)
  path:      the path to your Node.js app (default: the current working directory)
```

## License

MIT, enjoy.
