import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import simAppReducer, { simAppEpic } from './simApp';

const epicMiddleware = createEpicMiddleware(simAppEpic);
const store = createStore(simAppReducer, applyMiddleware(epicMiddleware))

export default store