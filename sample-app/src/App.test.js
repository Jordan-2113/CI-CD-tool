import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

// tests are failing in the jenkinsx builds.  I think I need to use
// a different version of node but dont know hot to control that yet
//
it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('will fake a test', () => {
  console.log('TODO - A test goes here.');
});
