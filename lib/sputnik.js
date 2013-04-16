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
	
	if (typeof fnc == 'undefined') {
		this.log.error('Tried to make stage ' + stageName + ' wait on undefined function');
		return false;
	}
	
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
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the stage this function should run before
 * @param    {Function} fnc       The function to execute
 * @param    {Function} callback  The callback to pass to the function
 * @param    {Integer}  order     The order in which to execute this function
 */
Sputnik.prototype.before = function before (stageName, fnc, order) {
	var stage = this.stages[stageName];
	stage.when('before', fnc, order);
}

/**
 * Execute a function after a certain stage
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {String}   name      The name of the stage this function should run before
 * @param    {Function} fnc       The function to execute
 * @param    {Function} callback  The callback to pass to the function
 * @param    {Integer}  order     The order in which to execute this function
 */
Sputnik.prototype.after = function after (stageName, fnc, order) {
	var stage = this.stages[stageName];
	stage.when('after', fnc, order);
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
 */
Sputnik.prototype.launch = function launch (order, others) {
	
	if (typeof others == 'undefined') others = true;
	
	var i, stageName, stage;
	
	if (order instanceof Array) {
		
		for (i = 0; i < order.length; i++) {
			
			stageName = order[i];
			
			if (this.stages[stageName]) {
				
				stage = this.stages[stageName];
				stage.begin(false);
				
			} else {
				log.error('Tried to launch undefined stage ' + stageName);
			}
			
		}
	}
	
	if (others) {
		for (stageName in this.stages) {
			this.stages[stageName].begin(false);
		}
	}
}

module.exports = Sputnik;