import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { JoinFlow } from './Join';
import { AnnualSurveyForm } from './AnnualSurvey';

const RENEWER = {
  user: { id: 'preview-member', email: 'jordan@example.org' },
  profile: {
    full_name: 'Jordan Vold',
    email: 'jordan@example.org',
    phone: '4155550134',
    credentials: 'PA-C',
    npi: '1234567893',
    state: 'California',
    home_city: 'Oakland',
    career_stage: 'practicing',
    aapa_member: true,
    sms_opt_in: true,
    newsletter_opt_in: true,
    membership_tier: 'fellow',
    membership_status: 'active',
    renews_on: '2027-03-03',
    cancel_at_period_end: false,
    membership_years: 1,
    organizations: [{
      name: 'Bridge Clinic',
      role: 'Clinician',
      city: 'Oakland',
      state: 'California',
      practice_settings: ['bridge'],
      website: 'https://bridgetotreatment.org',
    }],
    primary_practice_setting: 'bridge',
    focus_areas: ['opioids', 'alcohol'],
    directory_visible: true,
    share_email: true,
    share_phone: false,
  },
};

const JUST_PAID = {
  user: { id: 'preview-joiner', email: 'ada@example.org' },
  profile: {
    full_name: 'Ada Student',
    email: 'ada@example.org',
    state: 'California',
    career_stage: 'student',
    membership_tier: 'student',
    membership_status: 'active',
    renews_on: '2027-11-01',
    cancel_at_period_end: false,
    membership_years: 1,
    organizations: [],
  },
};

export default function JoinPreview() {
  const [params] = useSearchParams();
  const who = params.get('who') || 'joiner';
  if (params.get('survey') === '1') {
    return (
      <div className="min-h-screen bg-background px-4 pb-16 pt-8">
        <AnnualSurveyForm year="2026" previewAnswers={{}} />
      </div>
    );
  }
  const preview = who === 'renewer' ? RENEWER : who === 'paid' ? JUST_PAID : { user: null, profile: null };
  const mode = who === 'renewer' ? 'renew' : 'join';
  return <JoinFlow mode={mode} preview={preview} />;
}
