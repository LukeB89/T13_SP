'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _maps = require('./maps');

var helper = function () {
  var convertDarkSkyCode = function convertDarkSkyCode(id) {
    if (_maps.darkSkyIcons[id]) {
      return _maps.darkSkyIcons[id].icon;
    }
    throw new Error('ID passed to component invalid');
  };
  var convertYahooCode = function convertYahooCode(id) {
    if (_maps.yahooIcons[id]) {
      return _maps.yahooIcons[id].icon;
    }
    throw new Error('ID passed to component invalid');
  };
  // openweather
  var convertOWMCode = function convertOWMCode(id) {
    if (_maps.owmIcons[id]) {
      var prefix = 'wi wi-';
      var icon = _maps.owmIcons[id].icon;
      // If we are not in the ranges mentioned above, add a day/night prefix.
      if (!(id > 699 && id < 800) && !(id > 899 && id < 1000)) {
        icon = 'day-' + icon;
      }

      icon = prefix + icon;
      return icon;
    }
    throw new Error('ID passed to component invalid');
  };

  var convertCode = function convertCode(name, id) {
    switch (name) {
      case 'owm':
        return convertOWMCode(id);
      case 'darksky':
        return convertDarkSkyCode(id);
      case 'yahoo':
        return convertYahooCode(id);
      default:
        throw new Error('Name passed to component invalid');
    }
  };
  return {
    convertCode: convertCode
  };
}();

exports.default = helper;