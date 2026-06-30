import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import News from './pages/News';
import PostView from './pages/PostView';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<PostView />} />
        {/* Tags, login, and editor routes are added in later phases. */}
      </Routes>
    </>
  );
}

export default App;
