import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* News, tags, login, and editor routes are added in later phases. */}
    </Routes>
  );
}

export default App;
