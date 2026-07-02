import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import RequireEditor from './components/RequireEditor';
import Home from './pages/Home';
import News from './pages/News';
import PostView from './pages/PostView';
import Tags from './pages/Tags';
import TagView from './pages/TagView';
import Login from './pages/Login';
import EditorDashboard from './pages/EditorDashboard';
import PostEditor from './pages/PostEditor';
import AdminTags from './pages/AdminTags';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:slug" element={<PostView />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/tags/:slug" element={<TagView />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/editor"
          element={
            <RequireEditor>
              <EditorDashboard />
            </RequireEditor>
          }
        />
        <Route
          path="/editor/new"
          element={
            <RequireEditor>
              <PostEditor />
            </RequireEditor>
          }
        />
        <Route
          path="/editor/tags"
          element={
            <RequireEditor adminOnly>
              <AdminTags />
            </RequireEditor>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <RequireEditor>
              <PostEditor />
            </RequireEditor>
          }
        />
        {/* Tag browse is added in a later phase. */}
      </Routes>
    </>
  );
}

export default App;
