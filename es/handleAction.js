import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import identity from 'lodash/identity';
import isUndefined from 'lodash/isUndefined';
import includes from 'lodash/includes';
import invariant from 'invariant';
import { ACTION_TYPE_DELIMITER } from './combineActions';

var getReducerType = function getReducerType(_ref) {
  var payload = _ref.payload,
      error = _ref.error;

  if (payload && isFunction(payload.then)) return 'first';
  return error ? 'throw' : 'next';
};

export default function handleAction(actionType) {
  var reducer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identity;
  var defaultState = arguments[2];

  var actionTypes = actionType.toString().split(ACTION_TYPE_DELIMITER);
  invariant(!isUndefined(defaultState), 'defaultState for reducer handling ' + actionTypes.join(', ') + ' should be defined');
  invariant(isFunction(reducer) || isPlainObject(reducer), 'Expected reducer to be a function or object with next and throw reducers');

  var reducerMap = isFunction(reducer) ? { first: reducer, next: reducer, throw: reducer } : reducer;

  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
    var action = arguments[1];
    var type = action.type;

    if (type && !includes(actionTypes, type.toString())) {
      return state;
    }

    var targetReducer = reducerMap[getReducerType(action)];

    return targetReducer ? targetReducer(state, action) : state;
  };
}