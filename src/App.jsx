import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import RequireEditor from './components/RequireEditor';
import Home from './pages/Home';
import News from './pages/News';
import PostView from './pages/PostView';
import Login from './pages/Login';
import Editor from './pages/Editor';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<PostView />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/editor"
          element={
            <RequireEditor>
              <Editor />
            </RequireEditor>
          }
        />
        {/* Tag browse and the full editor tools are added in later phases. */}
      </Routes>
    </>
  );
}

export default App;
