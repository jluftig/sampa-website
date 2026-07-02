import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import RequireEditor from './components/RequireEditor';
import Home from './pages/Home';

// Route-level code splitting: the homepage loads eagerly; every other page
// (and its heavier dependencies — TipTap, DOMPurify) loads on demand.
const News = lazy(() => import('./pages/News'));
const PostView = lazy(() => import('./pages/PostView'));
const Tags = lazy(() => import('./pages/Tags'));
const TagView = lazy(() => import('./pages/TagView'));
const Login = lazy(() => import('./pages/Login'));
const EditorDashboard = lazy(() => import('./pages/EditorDashboard'));
const PostEditor = lazy(() => import('./pages/PostEditor'));
const AdminTags = lazy(() => import('./pages/AdminTags'));
const AdminPeople = lazy(() => import('./pages/AdminPeople'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<PostView />} />
          <Route path="/keywords" element={<Tags />} />
          <Route path="/keywords/:slug" element={<TagView />} />
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
            path="/editor/keywords"
            element={
              <RequireEditor adminOnly>
                <AdminTags />
              </RequireEditor>
            }
          />
          <Route
            path="/editor/people"
            element={
              <RequireEditor adminOnly>
                <AdminPeople />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
