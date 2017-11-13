import React from 'react';
import ReactDOM from 'react-dom';
import SpeedSimApp from './SpeedSimApp';

import { Provider } from 'react-redux'
import store from './redux/store'

const element = (
  <Provider store={store}>
    <SpeedSimApp />
  </Provider>
)

ReactDOM.render(element, document.getElementById('root'));
