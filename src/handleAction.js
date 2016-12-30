import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import identity from 'lodash/identity';
import isUndefined from 'lodash/isUndefined';
import includes from 'lodash/includes';
import invariant from 'invariant';
import { ACTION_TYPE_DELIMITER } from './combineActions';

const getReducerType = ({ payload, error }) => {
  if (payload && isFunction(payload.then)) return 'first';
  return error ? 'throw' : 'next';
};

export default function handleAction(actionType, reducer = identity, defaultState) {
  const actionTypes = actionType.toString().split(ACTION_TYPE_DELIMITER);
  invariant(
    !isUndefined(defaultState),
    `defaultState for reducer handling ${actionTypes.join(', ')} should be defined`
  );
  invariant(
    isFunction(reducer) || isPlainObject(reducer),
    'Expected reducer to be a function or object with next and throw reducers'
  );

  const reducerMap = isFunction(reducer)
    ? { first: reducer, next: reducer, throw: reducer }
    : reducer;

  return (state = defaultState, action) => {
    const { type } = action;
    if (type && !includes(actionTypes, type.toString())) {
      return state;
    }

    const targetReducer = reducerMap[getReducerType(action)];

    return targetReducer ? targetReducer(state, action) : state;
  };
}
