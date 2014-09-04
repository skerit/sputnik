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
	this.queue = {before: {}, 'before-serial': {}, during: {}, after: {}};
	
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
	
	this.timeoutId = false;
	this.timeoutMs = false;
	
	// Add the stage to the sputniks object
	sputnik.stages[name] = this;
	
	// Things this stage prevents
	this._prevent = [];
	
	// Indicate this stage was attempted to start, but prevented
	this.prevented = false;
	
}

/**
 * A callback that doesn't do anything
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.4
 * @version  0.0.4
 */
var DummyCallback = function DummyCallback(){};

Stage.prototype.begin = function begin (warnDuplicate) {

	var that = this, i;
	
	if (typeof warnDuplicate === 'undefined') warnDuplicate = true;
	
	// Do not start this stage if we're being prevented somewhere
	if (this.sputnik.preventions[this.name]) {
		this.prevented = true;
		return;
	}
	
	if (!this.begun) {
		
		// Execute the any functions
		for (i in this.sputnik.anyBegin) {
			this.sputnik.anyBegin[i](this);
		}
		
		// Execute all the before actions
		this.doQueue('before');

		// Execute all the serial before actions
		this.doQueue('before-serial', true, function() {

			// Execute all the during actions
			that.doQueue('during');
			
			that.begun = true;
		});
		
	} else {
		if (warnDuplicate) this.log.error('Tried to begin stage ' + this.name + ' twice');
	}
}

/**
 * Print out a message when the stage is still open after the given ms
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 *
 * @param    {Integer}   ms
 */
Stage.prototype.timeout = function timeout (ms) {
	this.timeoutMs = ms;
	this.resetTimeout();
}

/**
 * (Re) set the timeout
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Stage.prototype.resetTimeout = function resetTimeout () {
	
	var that = this;
	
	// Do nothing if no timeout ms is set
	if (!this.timeoutMs) return;
	
	if (this.timeoutId) clearTimeout(this.timeoutId);
	
	this.timeoutId = setTimeout(function() {
		that.log.warn('Stage ' + that.name + ' has timed out after ' + (ms/1000) + ' seconds');
	}, this.timeoutMs);
}

/**
 * Stop the timeout
 * 
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.1
 */
Stage.prototype.stopTimeout = function stopTimeout () {
	if (this.timeoutId) clearTimeout(this.timeoutId);
	this.timeoutMs = false;
}

Stage.prototype.waiter = function waiter () {
	this.resetTimeout();
	if (this.open) this.waiters++;
}

Stage.prototype.caller = function caller () {
	this.resetTimeout();
	this.callers++;
	this.evaluate();
	this.doQueue('after');
}

/**
 * Indicate we are no longer adding any more waiters
 */
Stage.prototype.end = function end () {
	
	var i;
	
	this.stopTimeout();
	
	// Only do this once
	if (this.open) {
		
		this.open = false;
		this.evaluate();
		this.doQueue('after');
		
	}

}

/**
 * See if the stage queue can be executed, and do so if it is
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.5
 *
 * @returns  {Boolean}  True if executed, false if not
 */
Stage.prototype.evaluate = function evaluate() {
	if (!this.prevented && !this.open && this.waiters <= this.callers) {
		this.finished = true;
	}
};

/**
 * Do the queue, if applicable
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.4
 *
 * @param    {String}   queueType   before, during or after
 * @param    {Boolean}  serial      Do the serial or parallel queue
 * @param    {Function} callback
 *
 * @returns  {Boolean}  True if executed, false if not
 */
Stage.prototype.doQueue = function doQueue (queueType, serial, callback) {
	
	if (queueType === 'after' && !this.finished) return false;
	
	var i, q, nr, waitFor = 0, calledBack = 0, waiterFnc = DummyCallback,
	    // Get the before or after queue
	    queue = this.queue[queueType] || {},
	
	    // Get the order keys
	    keys = Object.keys(queue);

	// Sort them
	keys.sort();
	
	// Prepare the callback if it's for a serial queue
	if (serial) {

		// The waiter callback for the serial functions
		waiterFnc = function waiterFnc() {
			calledBack++;

			// If every function is done, do the callback
			if (waitFor === calledBack && callback) callback();
		};
	}

	for (i in keys) {

		q = queue[keys[i]];
		
		for (nr in q) {
			waitFor++;
			q[nr].fnc.call(this, waiterFnc);
		}
		
		// now remove them
		delete queue[keys[i]];
	}
	
	if (!serial && queueType === 'after') {
		// Execute the any functions
		for (i in this.sputnik.anyEnd) {
			this.sputnik.anyEnd[i](this);
		}
		
		// Now, un-prevent other stages
		for (i = 0; i < this._prevent.length; i++) {
			this.unprevent(this._prevent[i]);
		}
	}

	// If this isn't a serial queue, or there's nothing to wait for,
	// execute the callback
	if (!serial || !waitFor) {
		if (callback) callback();
	}

	return true;
}

/**
 * Prevent another stage from running while this stage is busy
 */
Stage.prototype.prevent = function prevent (stageName) {
	
	if (typeof this.sputnik.preventions[stageName] === 'undefined') {
		this.sputnik.preventions[stageName] = [];
	}
	
	// Indicate the given stage needs to wait for this stage to end
	if (this.sputnik.preventions[stageName].indexOf(this.name) == -1) {
		this.sputnik.preventions[stageName].push(this.name);
	}
	
	// Also store this in our own var
	if (this._prevent.indexOf(stageName) == -1) {
		this._prevent.push(stageName);
	}
	
}

/**
 * Unprevent a stage
 */
Stage.prototype.unprevent = function unprevent (stageName) {
	
	var p = this.sputnik.preventions[stageName], id, xStage;
	
	if (typeof p !== 'undefined' && p instanceof Array) {
		
		id = p.indexOf(this.name);
		
		// If the id was found, remove it
		if (id > -1) p.splice(id, 1);
		
		if (!p || !p.length) {
			this.sputnik.preventions[stageName] = false;
		}
	}
	
	// If the stage is no longer being prevented by anything...
	if (!this.sputnik.preventions[stageName]) {
		
		xStage = this.sputnik.getStage(stageName);
		
		// And it hasn't tried to started once before, begin it now
		if (xStage.prevented) xStage.begin();
		
	}
	
}

/**
 * Execute a function before, after or during this stage
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.0.4
 */
Stage.prototype.when = function when (when, fnc, order) {
	
	if (typeof order === 'undefined') order = 10;
	
	// If this stage is finished, just do it
	if (this.finished) {
		fnc();
	} else if ((when === 'during' || when === 'before' || when === 'before-serial') && this.begun) {
		this.log.verbose('Executed function meant ' + when + ' a stage after it had already begun', {level: 1});
		fnc(DummyCallback);
	} else {
		var queue = this.queue[when];
		if (typeof queue[order] === 'undefined') queue[order] = [];
		queue[order].push({fnc: fnc});
	}
}

module.exports = Stage;