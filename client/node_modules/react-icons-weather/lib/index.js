'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

require('./css/weather-icons.css');

var _utils = require('./utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

/**
* @param {string} name the name of weather api (open weather map, yahoo and dark sky)
* @param {string} iconId Id based on weather condition
* @param {string} flip
* @param {string} fixedWidth
* @param {string} rotate
* @module WeatherIcon
* @type {ReactClass}
**/

var WeatherIcon = function WeatherIcon(props) {
  var icon;

  var name = props.name,
      className = props.className,
      rotate = props.rotate,
      fixedWidth = props.fixedWidth,
      iconId = props.iconId,
      flip = props.flip,
      other = _objectWithoutProperties(props, ['name', 'className', 'rotate', 'fixedWidth', 'iconId', 'flip']);

  icon = _utils2.default.convertCode(name, iconId);
  icon += flip ? ' wi-flip-' + flip : '';
  icon += rotate ? ' wi-rotate-' + rotate : '';
  icon += fixedWidth ? ' wi-fw' : '';
  icon += className ? ' ' + className : '';
  return _react2.default.createElement('i', _extends({}, other, { name: name, className: icon }));
};

WeatherIcon.propTypes = {
  name: _propTypes2.default.oneOf(['owm', 'darksky', 'yahoo']).isRequired,
  className: _propTypes2.default.string,
  iconId: _propTypes2.default.string.isRequired,
  flip: _propTypes2.default.oneOf(['horizontal', 'vertical']),
  fixedWidth: _propTypes2.default.bool,
  rotate: _propTypes2.default.oneOf(['90', '180', '270'])
};
exports.default = WeatherIcon;