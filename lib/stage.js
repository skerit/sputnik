var Blast = __Protoblast,
    Fn = Blast.Bound.Function;

/**
 * Stage class
 * Stages: used to launch Sputnik
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Sputnik}   sputnik
 * @param    {String}    name
 */
var Stage = Fn.inherits(null, 'Develry.Sputnik', function Stage(sputnik, name) {

	// The parent sputnik class
	this.sputnik = sputnik;

	// The stage name
	this.name = name;

	// The main pledge
	this.pledge = new Blast.Classes.Pledge();

	// When this stage has started
	this.started = null;

	// When this stage ended
	this.ended = null;

	// The main tasks of this stage
	this.tasks = [];
});

/**
 * Add a new function/promise to the stage
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Function|Promise}   fnc
 */
Stage.setMethod(function add(fnc) {

	if (this.tasks.indexOf(fnc) > -1) {
		return;
	}

	this.tasks.push(fnc);

	this.pledge.addProgressPart(1);
});

/**
 * Begin this stage
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.0.1
 * @version  0.1.0
 */
Stage.setMethod(function start() {

	if (this.started) {
		throw new Error('The "' + this.name + '" stage has already started');
	}

	this.started = Date.now();

	let that = this,
	    pledges = [],
	    i;

	if (this.sputnik.debug) {
		this.sputnik.log('Starting "' + this.name + '" stage');
	}

	for (i = 0; i < this.tasks.length; i++) {
		let task = this.tasks[i];

		if (typeof task == 'function') {
			task = task();
		}

		if (task && task.then) {
			task.then(function reportProgress() {
				that.pledge.reportProgressPart(1);
			});

			pledges.push(task);
		} else {
			this.pledge.reportProgressPart(1);
		}
	}

	Function.parallel(pledges, function done(err) {

		that.ended = Date.now();

		if (err) {
			return that.pledge.reject(err);
		}

		if (that.sputnik.debug) {
			that.sputnik.log('Finished "' + that.name + '" stage in', that.ended - that.started, 'ms');
		}

		that.pledge.resolve();
	});

	return this.pledge;
});

module.exports = Stage;