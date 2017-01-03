'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = handleAction;

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isPlainObject = require('lodash/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

var _identity = require('lodash/identity');

var _identity2 = _interopRequireDefault(_identity);

var _isUndefined = require('lodash/isUndefined');

var _isUndefined2 = _interopRequireDefault(_isUndefined);

var _includes = require('lodash/includes');

var _includes2 = _interopRequireDefault(_includes);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _combineActions = require('./combineActions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getReducerType = function getReducerType(_ref) {
  var payload = _ref.payload,
      error = _ref.error;

  if (payload && (0, _isFunction2.default)(payload.then)) return 'first';
  return error ? 'throw' : 'next';
};

function handleAction(actionType) {
  var reducer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _identity2.default;
  var defaultState = arguments[2];

  var actionTypes = actionType.toString().split(_combineActions.ACTION_TYPE_DELIMITER);
  (0, _invariant2.default)(!(0, _isUndefined2.default)(defaultState), 'defaultState for reducer handling ' + actionTypes.join(', ') + ' should be defined');
  (0, _invariant2.default)((0, _isFunction2.default)(reducer) || (0, _isPlainObject2.default)(reducer), 'Expected reducer to be a function or object with next and throw reducers');

  var reducerMap = (0, _isFunction2.default)(reducer) ? { next: reducer, throw: reducer } : reducer;

  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
    var action = arguments[1];
    var type = action.type;

    if (type && !(0, _includes2.default)(actionTypes, type.toString())) {
      return state;
    }

    var targetReducer = reducerMap[getReducerType(action)];

    return targetReducer ? targetReducer(state, action) : state;
  };
}