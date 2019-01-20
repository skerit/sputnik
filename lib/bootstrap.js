// Require protoblast (without native mods) if it isn't loaded yet
if (typeof __Protoblast == 'undefined') {
	require('protoblast')(false);
}

require('./sputnik');

module.exports = __Protoblast.Classes.Develry.Sputnik;