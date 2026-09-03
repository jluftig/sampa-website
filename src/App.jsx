import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import RequireEditor from './components/RequireEditor';
import RequireAuth from './components/RequireAuth';
import RequireActiveMember from './components/RequireActiveMember';
import RequireMemberViewer from './components/RequireMemberViewer';
import Home from './pages/Home';

// Route-level code splitting: the homepage loads eagerly; every other page
// (and its heavier dependencies — TipTap, DOMPurify) loads on demand.
const News = lazy(() => import('./pages/News'));
const PostView = lazy(() => import('./pages/PostView'));
const Policy = lazy(() => import('./pages/Policy'));
const PolicyView = lazy(() => import('./pages/PolicyView'));
const Tags = lazy(() => import('./pages/Tags'));
const TagView = lazy(() => import('./pages/TagView'));
const Search = lazy(() => import('./pages/Search'));
const Login = lazy(() => import('./pages/Login'));
const Join = lazy(() => import('./pages/Join'));
const JoinInvoice = lazy(() => import('./pages/JoinInvoice'));
const Donate = lazy(() => import('./pages/Donate'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MemberDirectory = lazy(() => import('./pages/MemberDirectory'));
const MemberProfile = lazy(() => import('./pages/MemberProfile'));
const BoardMeetings = lazy(() => import('./pages/BoardMeetings'));
const BoardMeetingView = lazy(() => import('./pages/BoardMeetingView'));
const About = lazy(() => import('./pages/About'));
const Caq = lazy(() => import('./pages/Caq'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NewsletterConfirmed = lazy(() => import('./pages/NewsletterConfirmed'));
const Terms = lazy(() => import('./pages/Terms'));
const EditorDashboard = lazy(() => import('./pages/EditorDashboard'));
const PostEditor = lazy(() => import('./pages/PostEditor'));
const AdminTags = lazy(() => import('./pages/AdminTags'));
const AdminPeople = lazy(() => import('./pages/AdminPeople'));
const AdminMembers = lazy(() => import('./pages/AdminMembers'));
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
          <Route path="/policy" element={<Policy />} />
          <Route path="/policy/:slug" element={<PolicyView />} />
          <Route path="/keywords" element={<Tags />} />
          <Route path="/keywords/:slug" element={<TagView />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/join/invoice" element={<JoinInvoice />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/about" element={<About />} />
          <Route path="/caq" element={<Caq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/newsletter-confirmed" element={<NewsletterConfirmed />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/members"
            element={
              <RequireActiveMember>
                <MemberDirectory />
              </RequireActiveMember>
            }
          />
          <Route
            path="/members/:id"
            element={
              <RequireActiveMember>
                <MemberProfile />
              </RequireActiveMember>
            }
          />
          <Route
            path="/board"
            element={
              <RequireActiveMember
                deniedCopy="Board meeting agendas and minutes are a benefit of active SAMPA membership. Join to read this year’s Board meeting schedule, agendas, and approved minutes."
              >
                <BoardMeetings />
              </RequireActiveMember>
            }
          />
          <Route
            path="/board/:slug"
            element={
              <RequireActiveMember
                deniedCopy="Board meeting agendas and minutes are a benefit of active SAMPA membership. Join to read this year’s Board meeting schedule, agendas, and approved minutes."
              >
                <BoardMeetingView />
              </RequireActiveMember>
            }
          />
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
            path="/editor/members"
            element={
              <RequireMemberViewer>
                <AdminMembers />
              </RequireMemberViewer>
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
