import React from 'react';
import { Layout } from 'lucide-react';
import './App.css';
import Board from './components/Board';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <Layout size={24} color="var(--accent-color)" />
          KanbanPM
        </h1>
      </header>
      <main className="App-main">
        <Board boardId={1} />
      </main>
    </div>
  );
}

export default App;
