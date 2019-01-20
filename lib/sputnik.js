var Blast = __Protoblast,
    Fn    = Blast.Bound.Function,
    Stage = require('./stage');

/**
 * Sputnik class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {Object}   options
 */
var Sputnik = Fn.inherits('Informer', 'Develry.Sputnik', function Sputnik(options) {

	this.options = options || {};

	this.stages = new Blast.Classes.Deck();
});

/**
 * Is debugging enabled?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type     {Boolean}
 */
Sputnik.setProperty(function debug() {

	if (this._debug != null) {
		return this._debug;
	}

	return this.options.debug || false;
}, function setDebug(value) {
	this._debug = !!value;
	return this._debug;
});

/**
 * Log something
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Sputnik.setMethod(function log(...args) {

	var fnc;

	if (this.options.log) {
		this.options.log(...args);
	} else {
		console.log(...args);
	}
});

/**
 * Add a function to the given stage
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}     name   Name of the stage
 * @param    {Function}   fnc    The function to execute
 *
 * @return   {Stage}
 */
Sputnik.setMethod(function add(name, fnc) {

	var stage;

	if (typeof name == 'function') {
		fnc = name;
		name = fnc.name;
	}

	if (!this.stages.has(name)) {
		this.stages.set(name, new Stage(this, name));
	}

	stage = this.stages.get(name);

	if (typeof fnc == 'function' || fnc && fnc.then) {
		stage.add(fnc);
	}

	return stage;
});

/**
 * Get a stage, and define it if needed
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.2
 * @version  0.1.0
 *
 * @param    {String}   name      The name of the new stage
 *
 * @returns  {Stage}   Returns the stage
 */
Sputnik.setMethod(function get(name) {
	return this.add(name);
});

/**
 * Launch a stage
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {String}   name   The name of the stage
 */
Sputnik.setMethod(function launch(name) {

	if (Array.isArray(name)) {
		let i;

		for (i = 0; i < name.length; i++) {
			this.launch(name[i]);
		}

		return;
	}

	stage = this.stages.get(name);

	if (!stage) {
		throw new Error('Unable to start stage "' + name + '": stage not found');
	}

	let that = this;

	this.emit('launching', stage);

	stage.start().then(function finished() {
		that.emit('launched', stage);
	});
});

/**
 * Do something after the given stage has finished
 *
 * @author   Jelle De Loecker   <jelle@kipdola.be>
 * @since    0.0.1
 * @version  0.1.0
 *
 * @param    {String}   name   The name of the stage
 *
 * @return   {Pledge}
 */
Sputnik.setMethod(function after(name, callback) {

	var result;

	if (Array.isArray(name)) {
		let tasks = [],
		    i;

		for (i = 0; i < name.length; i++) {
			tasks.push(this.after(name[i]));
		}

		result = Fn.parallel(tasks);
	} else {
		result = this.get(name).pledge;
	}

	result.done(callback);

	return result;
});

module.exports = Sputnik;