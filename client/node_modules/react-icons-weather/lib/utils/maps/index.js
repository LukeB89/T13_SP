'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.darkSkyIcons = exports.yahooIcons = exports.owmIcons = undefined;

var _owmWeatherIcons = require('./owm-weather-icons.json');

var owmIcons = _interopRequireWildcard(_owmWeatherIcons);

var _yahooWeatherIcons = require('./yahoo-weather-icons.json');

var yahooIcons = _interopRequireWildcard(_yahooWeatherIcons);

var _darkskyWeatherIcons = require('./darksky-weather-icons.json');

var darkSkyIcons = _interopRequireWildcard(_darkskyWeatherIcons);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.owmIcons = owmIcons;
exports.yahooIcons = yahooIcons;
exports.darkSkyIcons = darkSkyIcons;