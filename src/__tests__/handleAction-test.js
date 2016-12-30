import { expect } from 'chai';
import { handleAction, createAction, createActions, combineActions } from '../';

describe('handleAction()', () => {
  const type = 'TYPE';
  const prevState = { counter: 3 };
  const defaultState = { counter: 0 };

  it('should throw an error if the reducer is the wrong type', () => {
    const wrongTypeReducers = [1, 'string', [], null];

    wrongTypeReducers.forEach(wrongTypeReducer => {
      expect(() => {
        handleAction(type, wrongTypeReducer, defaultState);
      }).to.throw(
        Error,
        'Expected reducer to be a function or object with next and throw reducers'
      );
    });
  });

  it('uses the identity if the specified reducer is undefined', () => {
    const reducer = handleAction(type, undefined, defaultState);

    expect(reducer(prevState, { type })).to.equal(prevState);
    expect(reducer(prevState, { type, error: true, payload: new Error })).to.equal(prevState);
  });

  describe('single handler form', () => {
    it('should throw an error if defaultState is not specified', () => {
      expect(() => {
        handleAction(type, undefined);
      }).to.throw(
        Error,
        'defaultState for reducer handling TYPE should be defined'
      );
    });

    describe('resulting reducer', () => {
      it('returns previous state if type does not match', () => {
        const reducer = handleAction('NOTTYPE', () => null, defaultState);
        expect(reducer(prevState, { type })).to.equal(prevState);
      });

      it('returns default state if type does not match', () => {
        const reducer = handleAction('NOTTYPE', () => null, { counter: 7 });
        expect(reducer(undefined, { type }))
          .to.deep.equal({
            counter: 7
          });
      });

      it('accepts single function as handler', () => {
        const reducer = handleAction(type, (state, action) => ({
          counter: state.counter + action.payload
        }), defaultState);
        expect(reducer(prevState, { type, payload: 7 }))
          .to.deep.equal({
            counter: 10
          });
      });

      it('accepts action function as action type', () => {
        const incrementAction = createAction(type);
        const reducer = handleAction(incrementAction, (state, action) => ({
          counter: state.counter + action.payload
        }), defaultState);

        expect(reducer(prevState, incrementAction(7)))
          .to.deep.equal({
            counter: 10
          });
      });

      it('accepts a default state used when the previous state is undefined', () => {
        const reducer = handleAction(type, (state, action) => ({
          counter: state.counter + action.payload
        }), { counter: 3 });

        expect(reducer(undefined, { type, payload: 7 }))
          .to.deep.equal({
            counter: 10
          });
      });

      it('should work with createActions action creators', () => {
        const { increment } = createActions('INCREMENT');

        const reducer = handleAction(increment, (state, { payload }) => ({
          counter: state.counter + payload
        }), defaultState);

        expect(reducer(undefined, increment(7)))
          .to.deep.equal({
            counter: 7
          });
      });

      it('should not throw and return state when action is non-FSA', () => {
        const reducer = handleAction(type, (state) => state, defaultState);
        const action = {
          foo: {
            bar: 'baz'
          }
        };

        expect(reducer(undefined, action)).not.to.throw;
        expect(reducer(undefined, action)).to.deep.equal({
          counter: 0
        });
      });
    });
  });

  describe('map of handlers form', () => {
    it('should throw an error if defaultState is not specified', () => {
      expect(() => {
        handleAction(type, { next: () => null });
      })
      .to.throw(
        Error,
        'defaultState for reducer handling TYPE should be defined'
      );
    });

    describe('resulting reducer', () => {
      it('returns previous state if type does not match', () => {
        const reducer = handleAction('NOTTYPE', { next: () => null }, defaultState);
        expect(reducer(prevState, { type })).to.equal(prevState);
      });

      it('uses `first()` if action is still a promise', () => {
        const reducer = handleAction(type, {
          first: (state) => ({
            ...state,
            pending: true
          })
        }, defaultState);
        expect(reducer(prevState, { type, payload: Promise.resolve(7) }))
          .to.deep.equal({
            counter: 3,
            pending: true
          });
        expect(reducer(prevState, { type, payload: Promise.reject(new Error()) }))
          .to.deep.equal({
            counter: 3,
            pending: true
          });
      });

      it('uses `next()` if action does not represent an error', () => {
        const reducer = handleAction(type, {
          next: (state, action) => ({
            counter: state.counter + action.payload
          })
        }, defaultState);
        expect(reducer(prevState, { type, payload: 7 }))
          .to.deep.equal({
            counter: 10
          });
      });

      it('uses `throw()` if action represents an error', () => {
        const reducer = handleAction(type, {
          throw: (state, action) => ({
            counter: state.counter + action.payload
          })
        }, defaultState);

        expect(reducer(prevState, { type, payload: 7, error: true }))
          .to.deep.equal({
            counter: 10
          });
      });

      it('returns previous state if matching handler is not function', () => {
        const reducer = handleAction(type, { next: null, error: 123 }, defaultState);
        expect(reducer(prevState, { type, payload: 123 })).to.equal(prevState);
        expect(reducer(prevState, { type, payload: 123, error: true }))
          .to.equal(prevState);
      });
    });
  });

  describe('with combined actions', () => {
    it('should handle combined actions in reducer form', () => {
      const action1 = createAction('ACTION_1');
      const reducer = handleAction(
        combineActions(action1, 'ACTION_2', 'ACTION_3'),
        (state, { payload }) => ({ ...state, number: state.number + payload }),
        defaultState
      );

      expect(reducer({ number: 1 }, action1(1))).to.deep.equal({ number: 2 });
      expect(reducer({ number: 1 }, { type: 'ACTION_2', payload: 2 })).to.deep.equal({ number: 3 });
      expect(reducer({ number: 1 }, { type: 'ACTION_3', payload: 3 })).to.deep.equal({ number: 4 });
    });

    it('should handle combined actions in next/throw form', () => {
      const action1 = createAction('ACTION_1');
      const reducer = handleAction(combineActions(action1, 'ACTION_2', 'ACTION_3'), {
        next(state, { payload }) {
          return { ...state, number: state.number + payload };
        }
      }, defaultState);

      expect(reducer({ number: 1 }, action1(1))).to.deep.equal({ number: 2 });
      expect(reducer({ number: 1 }, { type: 'ACTION_2', payload: 2 })).to.deep.equal({ number: 3 });
      expect(reducer({ number: 1 }, { type: 'ACTION_3', payload: 3 })).to.deep.equal({ number: 4 });
    });

    it('should handle combined error actions', () => {
      const action1 = createAction('ACTION_1');
      const reducer = handleAction(combineActions(action1, 'ACTION_2', 'ACTION_3'), {
        next(state, { payload }) {
          return { ...state, number: state.number + payload };
        },

        throw(state) {
          return { ...state, threw: true };
        }
      }, defaultState);
      const error = new Error;

      expect(reducer({ number: 0 }, action1(error)))
        .to.deep.equal({ number: 0, threw: true });
      expect(reducer({ number: 0 }, { type: 'ACTION_2', payload: error, error: true }))
        .to.deep.equal({ number: 0, threw: true });
      expect(reducer({ number: 0 }, { type: 'ACTION_3', payload: error, error: true }))
        .to.deep.equal({ number: 0, threw: true });
    });

    it('should handle combined first actions', () => {
      const reducer = handleAction(combineActions('ACTION_1', 'ACTION_2'), {
        first(state) {
          return { ...state, pending: true };
        },

        next(state, { payload }) {
          return { ...state, number: state.number + payload, pending: false };
        },

        throw(state) {
          return { ...state, threw: true, pending: false };
        }
      }, defaultState);

      expect(reducer({ number: 0 }, { type: 'ACTION_1', payload: Promise.resolve(7) }))
        .to.deep.equal({ number: 0, pending: true });
      expect(reducer({ number: 0 }, { type: 'ACTION_2', payload: Promise.reject(7) }))
        .to.deep.equal({ number: 0, pending: true });
    });

    it('should return previous state if action is not one of the combined actions', () => {
      const reducer = handleAction(
        combineActions('ACTION_1', 'ACTION_2'),
        (state, { payload }) => ({ ...state, state: state.number + payload }),
        defaultState
      );

      const state = { number: 0 };

      expect(reducer(state, { type: 'ACTION_3', payload: 1 })).to.equal(state);
    });

    it('should use the default state if the initial state is undefined', () => {
      const reducer = handleAction(
        combineActions('INCREMENT', 'DECREMENT'),
        (state, { payload }) => ({ ...state, counter: state.counter + payload }),
        defaultState
      );

      expect(reducer(undefined, { type: 'INCREMENT', payload: +1 })).to.deep.equal({ counter: +1 });
      expect(reducer(undefined, { type: 'DECREMENT', payload: -1 })).to.deep.equal({ counter: -1 });
    });

    it('should handle combined actions with symbols', () => {
      const action1 = createAction('ACTION_1');
      const action2 = Symbol('ACTION_2');
      const action3 = createAction(Symbol('ACTION_3'));
      const reducer = handleAction(
        combineActions(action1, action2, action3),
        (state, { payload }) => ({ ...state, number: state.number + payload }),
        defaultState
      );

      expect(reducer({ number: 0 }, action1(1)))
        .to.deep.equal({ number: 1 });
      expect(reducer({ number: 0 }, { type: action2, payload: 2 }))
        .to.deep.equal({ number: 2 });
      expect(reducer({ number: 0 }, { type: Symbol('ACTION_3'), payload: 3 }))
        .to.deep.equal({ number: 3 });
    });
  });
});
