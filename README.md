# Sputnik

Stage based flow control, used for bootstrapping a Node.js server.

The stages themselves are executed in parallel.

## Installation

    $ npm install sputnik

## What is it for?

It is mainly meant for booting code where you work with plugins.

You define several 'stages' that have functions attached to them.

Then you run your plugins, which can hook into those named stages and run code
before or after said stages.

Then you finally 'launch' the rocket and watch your server boot in the order
you want.

## Functions

### Sputnik([options])

Create a new Sputnik

```js
var sputnik = new Sputnik();
```

### add(name, function)

Define a stage function, but do not begin it just yet.
You can return a promise to make the stage wait from ending.

```js
sputnik.add(function datasources() {
	// Do some stuff
});
```

### get(name)

Get a stage. Define it (as empty) if it doesn't exist yet.

### launch(name)

Begin the stage

### after(name, function)

Similar to before()

```js
sputnik.after('datasources', function() {
  // This will only run after datasources has ended
);
```

The name parameter can be an array of stage names,
then the function will then only be executed when all of the stages has finished.

```js
sputnik.after(['init', 'datasources', 'startServer'], function() {
  // This will only run after init, datasources & startServer have ended
);
```