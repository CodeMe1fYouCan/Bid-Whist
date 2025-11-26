import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Room from './components/Room';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/room/:roomCode" component={Room} />
          <Route path="/game/:roomCode" component={Game} />
        </Switch>
      </Router>
    </ErrorBoundary>
  );
};

export default App;