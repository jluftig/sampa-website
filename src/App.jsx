import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import RequireEditor from './components/RequireEditor';
import RequireAuth from './components/RequireAuth';
import RequireActiveMember from './components/RequireActiveMember';
import RequireMemberViewer from './components/RequireMemberViewer';
import RequirePolicyWork from './components/RequirePolicyWork';
import RequireBoardDashboard from './components/RequireBoardDashboard';
import Home from './pages/Home';
import Subscriptions from './pages/Subscriptions';
import { routes } from './lib/routeManifest';

// Route-level code splitting: the homepage and /subscriptions load eagerly.
// Every other page (and TipTap / DOMPurify) loads on demand. Subscriptions
// stays in the first bundle because a lazy route keeps the previous page
// on screen until its chunk arrives. The route list lives in routeManifest.
const pages = {
  Home: Home,
  Subscriptions: Subscriptions,
  News: lazy(() => import('./pages/News')),
  DailyRoundup: lazy(() => import('./pages/DailyRoundup')),
  FeatureArticle: lazy(() => import('./pages/FeatureArticle')),
  TopicRoundup: lazy(() => import('./pages/TopicRoundup')),
  DailyTagView: lazy(() => import('./pages/DailyTagView')),
  PostView: lazy(() => import('./pages/PostView')),
  Policy: lazy(() => import('./pages/Policy')),
  PolicyView: lazy(() => import('./pages/PolicyView')),
  Tags: lazy(() => import('./pages/Tags')),
  TagView: lazy(() => import('./pages/TagView')),
  Search: lazy(() => import('./pages/Search')),
  Login: lazy(() => import('./pages/Login')),
  Join: lazy(() => import('./pages/Join')),
  JoinPreview: import.meta.env.DEV ? lazy(() => import('./pages/JoinPreview')) : null,
  DirectoryBadgePreview: import.meta.env.DEV ? lazy(() => import('./pages/DirectoryBadgePreview')) : null,
  JoinInvoice: lazy(() => import('./pages/JoinInvoice')),
  AnnualSurvey: lazy(() => import('./pages/AnnualSurvey')),
  Donate: lazy(() => import('./pages/Donate')),
  Dashboard: lazy(() => import('./pages/Dashboard')),
  EmailChoices: lazy(() => import('./pages/EmailChoices')),
  EmailChoicesPreview: lazy(() => import('./pages/EmailChoicesPreview')),
  MemberDirectory: lazy(() => import('./pages/MemberDirectory')),
  MemberProfile: lazy(() => import('./pages/MemberProfile')),
  BoardMeetings: lazy(() => import('./pages/BoardMeetings')),
  BoardDashboard: lazy(() => import('./pages/BoardDashboard')),
  BoardMeetingView: lazy(() => import('./pages/BoardMeetingView')),
  Giveaway: lazy(() => import('./pages/Giveaway')),
  About: lazy(() => import('./pages/About')),
  Resources: lazy(() => import('./pages/Resources')),
  Caq: lazy(() => import('./pages/Caq')),
  Privacy: lazy(() => import('./pages/Privacy')),
  NewsletterConfirmed: lazy(() => import('./pages/NewsletterConfirmed')),
  Terms: lazy(() => import('./pages/Terms')),
  EditorDashboard: lazy(() => import('./pages/EditorDashboard')),
  PostEditor: lazy(() => import('./pages/PostEditor')),
  AdminTags: lazy(() => import('./pages/AdminTags')),
  SuggestedDailyTags: lazy(() => import('./pages/SuggestedDailyTags')),
  AdminPeople: lazy(() => import('./pages/AdminPeople')),
  AdminRecords: lazy(() => import('./pages/AdminRecords')),
  AdminMembers: lazy(() => import('./pages/AdminMembers')),
  PolicyWorkHub: lazy(() => import('./pages/PolicyWorkHub')),
  NotFound: lazy(() => import('./pages/NotFound')),
};

const gates = {
  RequireAuth,
  RequireActiveMember,
  RequireMemberViewer,
  RequirePolicyWork,
  RequireBoardDashboard,
  RequireEditor,
};

function elementFor(route) {
  if (route.redirect) return <Navigate to={route.redirect} replace />;
  const Page = pages[route.page];
  const child = <Page />;
  if (!route.gate) return child;
  const Gate = gates[route.gate];
  return <Gate {...(route.gateProps || {})}>{child}</Gate>;
}

function App() {
  const visible = routes.filter((route) => !route.devOnly || import.meta.env.DEV);
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          {visible.map((route) => (
            <Route key={route.path} path={route.path} element={elementFor(route)} />
          ))}
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
