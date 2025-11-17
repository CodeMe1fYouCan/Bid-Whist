import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import Lobby from './components/Lobby';
import Room from './components/Room';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/lobby" component={Lobby} />
        <Route path="/room/:roomCode" component={Room} />
        <Route path="/game" component={Game} />
      </Switch>
    </Router>
  );
};

export default App;