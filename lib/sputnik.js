var Stage = require('./stage');

// Define the logger
if (typeof log == 'undefined') {
	var log = {};
	log.error = console.error;
	log.warn = console.log;
	log.verbose = console.log;
}

/**
 * Sputnik class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Object}   options
 */
var Sputnik = function Sputnik (options) {
	
	if (typeof options == 'undefined') options = {};
	if (typeof options.strict == 'undefined') options.strict = true;
	
	this.options = options;
	
	// All sputniks in order of appearance
	this.orderedStages = [];
	
	// All stages by name
	this.stages = {};
	
	// Keep track of launches
	this.launched = {};
	
	// Define the logger functions
	this.log = log;
	
	// Run functions on any stage
	this.anyBegin = [];
	this.anyEnd = [];
	
}

/**
 * Do the provided function as a stage.
 * This will begin & end a stage.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the new stage
 * @param    {Function} fnc       The stage function
 */
Sputnik.prototype.executeAsStage = function executeAsStage (name, fnc) {
	this.begin(name);
	fnc();
	this.end(name);
}

/**
 * Define the provided function as a stage, but execute later.
 * This will begin & end a stage.
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the new stage
 * @param    {Function} fnc       The stage function
 *
 * @returns  {Object}   Returns the stage
 */
Sputnik.prototype.defineStage = function defineStage (name, fnc) {
	
	var stage;
	
	if (typeof this.stages[name] == 'undefined') {
		stage = new Stage(this, name);
	} else {
		stage = this.stages[name];
	}
	
	// Add the function if it's provided
	if (fnc) stage.when('during', fnc);
	
	return stage;
}

/**
 * Get a stage, and define it if needed
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.2
 * @version  0.0.2
 *
 * @param    {String}   name      The name of the new stage
 *
 * @returns  {Object}   Returns the stage
 */
Sputnik.prototype.getStage = function getStage (name) {
	return this.defineStage(name);
}

/**
 * Begin a stage
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the stage
 *
 * @returns  {Boolean}            If the stage has been made or not
 */
Sputnik.prototype.begin = function begin (name) {
	
	var stage = this.defineStage(name);

	// And begin the stage (which fires the 'before' and 'during' functions)
	stage.begin();
	
	return true;
}

/**
 * End a stage
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the stage to end
 */
Sputnik.prototype.end = function end (name) {
	
	if (typeof this.stages[name] == 'undefined') {
		return false;
	}
	
	var stage = this.stages[name];
	stage.end();
	
	return true;
}

/**
 * Make a stage wait on a certain function
 *
 * @param    {String}    stageName   The name of the stage that should wait
 *
 * @returns  {Function}              The callback that should be called
 */
Sputnik.prototype.wait = function wait (stageName) {
	
	var that = this;
	
	if (typeof this.stages[stageName] == 'undefined') {
		if (this.options.strict) {
			this.log.error('Tried to wait for stage ' + stageName.bold + ' which has not been started', {level: 1});
			return false;
		} else {
			this.begin(stageName);
		}
	}
	
	var stage = this.stages[stageName];
	
	if (!stage.open) {
		this.log.error('Tried to wait for function ' + fnc.name + ' in already counted stage: ' + stageName, {level: 1});
	} else {
		
		// Indicate this stage needs to wait for 1 more callback
		stage.waiter();
		
		// Bind the callback function
		return stage.caller.bind(stage);
	}
	
	return function(){that.log.warn('Returned empty wait callback')};
}

/**
 * Execute a function before starting a certain stage
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.2
 *
 * @param    {String}   name      The name of the stage this function should run before
 * @param    {Function} fnc       The function to execute
 * @param    {Function} callback  The callback to pass to the function
 * @param    {Integer}  order     The order in which to execute this function
 */
Sputnik.prototype.before = function before (stageName, fnc, order) {
	var stage = this.getStage(stageName);
	stage.when('before', fnc, order);
}

/**
 * Execute a function after a certain stage
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.2
 *
 * @param    {String}   name      The name of the stage this function should run before
 * @param    {Function} fnc       The function to execute
 * @param    {Function} callback  The callback to pass to the function
 * @param    {Integer}  order     The order in which to execute this function
 */
Sputnik.prototype.after = function after (stageName, fnc, order) {
	
	var stage, i, launch, AfterNik;
	
	if (typeof stageName == 'string') {
		stage = this.getStage(stageName);
		stage.when('after', fnc, order);
	} else if (stageName instanceof Array) {
		
		launch = true;
		
		// First see if any of these stages hasn't finished yet.
		// Because if they all have, we can just execute the function.
		for (i in stageName) {
			stage = stageName[i];
			launch = launch && stage.finished;
		}
		
		if (launch) {
			fnc();
			return;
		}
		
		// Define a new sputnik
		AfterNik = new Sputnik();
		
		// Begin the combined stage
		AfterNik.begin('combined');
		
		// Make it wait for the given stages to finish
		for (i in stageName) {
			stage = this.getStage(stageName[i]);
			stage.when('after', AfterNik.wait('combined'), order);
		}
		
		// End the stage (no more waits will happen)
		AfterNik.end('combined');
		
		AfterNik.after('combined', fnc, order);
		
	}
	
}

/**
 * Run this function on any stage, meant for debugging
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Function}   fnc   The function to run
 */
Sputnik.prototype.onBegin = function onBegin (fnc) {
	this.anyBegin.push(fnc);
}

/**
 * Run this function when any stage has ended, meant for debugging
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Function}   fnc   The function to run
 */
Sputnik.prototype.onEnd = function onEnd (fnc) {
	this.anyEnd.push(fnc);
}

/**
 * Begin stages that have not yet begun
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Array}   order   Stage names to start in given order
 * @param    {Boolean} others  Weather to start other, remaining stages
 *                             If it's an array, those are NOT started
 */
Sputnik.prototype.launch = function launch (order, others) {
	
	if (typeof others == 'undefined') others = false;
	
	var i, stageName, stage;
	
	if (order instanceof Array) {
		
		for (i = 0; i < order.length; i++) {
			
			stageName = order[i];
			
			if (this.stages[stageName]) {
				
				stage = this.stages[stageName];
				stage.begin(false);
				stage.end();
				
			} else {
				log.error('Tried to launch undefined stage ' + stageName);
			}
			
		}
	}
	
	if (others) {
		for (stageName in this.stages) {
			
			// If others is an array of other stages NOT to start,
			// continue the loop for every element that matches
			if (others instanceof Array) {
				if (others.indexOf(stageName) > -1) continue;
			}
			
			this.stages[stageName].begin(false);
			this.stages[stageName].end();
		}
	}
}

module.exports = Sputnik;