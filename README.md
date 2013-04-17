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

    sputnik.defineStage('datasources', function() {
			// Do some stuff
    });

### getStage(stageName)

Get a stage. Define it (as empty) if it doesn't exist yet.

### begin(stageName)

Begin the stage:

* Do all the 'before' functions
* Do all the defined stage functions (defineStage)

### wait(stageName)

Make a stage wait from ending.

This function returns a callback that needs to be executed when the waiting is over.

    // Create a database connection (this example was originally run in a loop)
    (function (name, sputnikWaiter) {
      
      db[name].connect(e, function() {
      
        // Tell sputnik this connection has been made
        sputnikWaiter();
        
      });
      
    })(name, sputnik.wait('datasources'));

### end(stageName)

End a stage.

If there are no more wait() functions that need to call back,
all the 'after' functions will be called.

Otherwise it'll wait for the last wait() callback.

### before(stageName, function[, order])

Run code before a stage begins.

When no order is given, the default value of 10 is used.

The lower the order, the faster it'll be executed.

    sputnik.before('datasources', function() {
      // This will run before the main datasources code
    );

Should the stage have already begun, the function will be executed immediately,
though a warning will be printed out to the console.

### after(stageName, function[, order])

Similar to before()

    sputnik.after('datasources', function() {
      // This will only run after datasources has ended,
      // and all its waiter callbacks (if any) have, actually, called back.
    );

The stageName parameter can be an array of stage names,
then the function will then only be executed when all of the stages has finished.

    sputnik.after(['init', 'datasources', 'startServer'], function() {
      // This will only run after init, datasources & startServer have ended,
      // and all their waiter callbacks (if any) have, actually, called back.
    );

### launch([order, others])

* Begin all the stages that have not yet been started.
* Execute their functions
* End all the stages

You can pass the an array containing stage names.
They will then be started in said order.

    sputnik.launch([
      'init',
      'plugins',
      'datasources',
      'startServer'
    ]);

When the 'others' parameter is true or undefined, any remaining stage will be
started in order of appearance.

If it's false, it will be ignored.