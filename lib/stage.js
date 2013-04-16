/**
 * Stage class.
 * Stages: used to launch Sputnik
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Sputnik}   sputnik
 * @param    {String}    name
 */
var Stage = function Stage (sputnik, name) {
	
	// The stage name
	this.name = name;
	
	// The queued functions
	this.queue = {before: {}, during: {}, after: {}};
	
	// Add the stage to the id
	this.id = sputnik.orderedStages.push(this) - 1;
	
	// On how many callbacks this stage needs to wait
	this.waiters = 0;
	
	// How many callbacks have actually called back
	this.callers = 0;
	
	// Has this stage begun?
	this.begun = false;
	
	// Is this stage still open, meaning:
	// are we still counting waiting functions?
	this.open = true;
	
	// Does this stage have a go?
	this.finished = false;
	
	this.sputnik = sputnik;
	
	this.log = sputnik.log;
	
	// Add the stage to the sputniks object
	sputnik.stages[name] = this;
	
}

Stage.prototype.begin = function begin (warnDuplicate) {
	
	if (typeof warnDuplicate == 'undefined') warnDuplicate = true;
	
	if (!this.begun) {
		
		// Execute all the before actions
		this.doQueue('before');
		
		// Execute all the during actions
		this.doQueue('during');
		
		this.begun = true;
		
	} else {
		if (warnDuplicate) this.log.error('Tried to begin stage ' + this.name + ' twice');
	}
}

Stage.prototype.waiter = function waiter () {
	if (this.open) this.waiters++;
}

Stage.prototype.caller = function caller () {
	this.callers++;
	this.evaluate();
	this.doQueue('after');
}

/**
 * Indicate we are no longer adding any more waiters
 */
Stage.prototype.end = function end () {
	this.open = false;
	this.doQueue('after');
}

/**
 * See if the stage queue can be executed, and do so if it is
 */
Stage.prototype.evaluate = function evaluate () {
	if (!this.open && this.waiters <= this.callers) {
		this.finished = true;
	}
}

/**
 * Do the queue, if applicable
 */
Stage.prototype.doQueue = function doQueue (queueType) {
	
	// Get the before or after queue
	var queue = this.queue[queueType];
	
	// Get the order keys
	var keys = Object.keys(queue);
	
	// Sort them
	keys.sort();
	
	for (var i in keys) {
		var q = queue[keys[i]];
		
		for (var nr in q) {
			var p = q[nr];
			p.fnc();
		}
		
		// now remove them
		delete queue[keys[i]];
	}
	
}

/**
 * Execute a function before or after this stage
 */
Stage.prototype.when = function when (when, fnc, order) {
	
	if (typeof order == 'undefined') order = 10;
	
	// If this stage is finished, just do it
	if (this.finished) {
		fnc();
	} else if ((when == 'during' || when == 'before') && this.begun) {
		this.log.verbose('Executed function meant ' + when + ' a stage after it had already begun', {level: 1});
		fnc();
	} else {
		var queue = this.queue[when];
		if (typeof queue[order] == 'undefined') queue[order] = [];
		queue[order].push({fnc: fnc});
	}
}

module.exports = Stage;