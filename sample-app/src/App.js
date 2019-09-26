import React, { Component } from 'react';
import logo from './img/M2-Logo.png';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            <small><code>I am Aplos 1</code></small>
          </p>
        </header>
      </div>
    );
  }
}

export default App;
