# Sputnik

Stage based flow control, used for bootstrapping a Node.js server.

The stages themselves are executed in parallel.

The before, defined & after functions are executed serially, per stage.

## Installation

    $ npm install sputnik

## What is it for?

It is mainly meant for booting code where you work with plugins.

You define several 'stages' that have functions attached to them.

Then you run your plugins, which can hook into those names stages and run code
before or after said stages.

Then you finally 'launch' the rocket and watch your server boot in the order
you want.

## Functions

### Sputnik([options])

Create a new Sputnik

    var sputnik = new Sputnik();

### defineStage(stageName, function)

Define a stage function, but do not begin it just yet.

    sputnik.defineStage('init', function() {
			// Do some stuff
    });

### begin(stageName)

Begin the stage:

* Do all the 'before' functions
* Do all the defined stage functions (defineStage)

### wait(stageName)

Make a stage wait from ending.

This function returns a callback that needs to be executed when the waiting is over.

### end(stageName)

End a stage.

If there are no more wait() functions that need to call back,
all the 'after' functions will be called.

Otherwise it'll wait for the last wait() callback.

### before(stageName, function[, order]) & after(stageName, function[, order])

Run code before a stage begins, or after it ends.

When no order is given, the default value of 10 is used.

The lower the order, the faster it'll be executed.

### launch([order, others])

Begin all the stages that have not yet been started.

You can pass the an array containing stage names.
They will then be started in said order.

When the 'others' parameter is true or undefined, any remaining stage will be
started in order of appearance.

If it's false, it will be ignored.