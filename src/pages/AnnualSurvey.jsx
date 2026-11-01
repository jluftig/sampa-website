import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../lib/AuthContext';
import {
  ANNUAL_SURVEY,
  emptySurveyAnswers,
  sanitizeSurveyAnswers,
  surveyIsOpen,
} from '../lib/annualSurvey';
import { supabase } from '../lib/supabaseClient';

function QuestionField({ question, value, onChange, disabled }) {
  if (question.type === 'text') {
    return (
      <textarea
        className="mt-2 min-h-28 w-full rounded-2xl border border-primary/20 p-3 text-base"
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (question.type === 'yesno') {
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {[[true, 'Yes'], [false, 'No']].map(([answer, label]) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            aria-pressed={value === answer}
            className={`min-h-12 rounded-full border px-4 text-sm font-semibold ${value === answer ? 'border-primary-text bg-primary-text text-white' : 'border-primary/20'}`}
            onClick={() => onChange(answer)}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }
  const selected = question.type === 'single' ? [value].filter(Boolean) : (value || []);
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {question.options.map((option) => {
        const on = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            aria-pressed={on}
            className={`min-h-12 rounded-full border px-3 text-left text-sm font-semibold ${on ? 'border-primary-text bg-primary-text text-white' : 'border-primary/20 bg-white'}`}
            onClick={() => {
              if (question.type === 'single') {
                onChange(on ? null : option);
                return;
              }
              if (on) onChange(selected.filter((item) => item !== option));
              else if (!question.max || selected.length < question.max) onChange([...selected, option]);
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function AnnualSurveyForm({ year = ANNUAL_SURVEY.year, previewAnswers = null }) {
  const { user } = useAuth();
  const numericYear = Number(year);
  const open = surveyIsOpen(numericYear);
  const [answers, setAnswers] = useState(previewAnswers || emptySurveyAnswers());
  const [state, setState] = useState(previewAnswers ? 'ready' : 'loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (previewAnswers || !user || !Number.isInteger(numericYear)) return undefined;
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('member_survey_responses')
        .select('answers')
        .eq('user_id', user.id)
        .eq('survey_year', numericYear)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setState('error');
        setMessage('The survey is not available yet. Your membership is unaffected.');
        return;
      }
      setAnswers(data?.answers ? { ...emptySurveyAnswers(), ...sanitizeSurveyAnswers(data.answers) } : emptySurveyAnswers());
      setState('ready');
    })();
    return () => { active = false; };
  }, [numericYear, previewAnswers, user]);

  const save = async (e) => {
    e.preventDefault();
    if (!open || !user) return;
    setState('saving');
    const clean = sanitizeSurveyAnswers(answers);
    const { error } = await supabase.from('member_survey_responses').upsert({
      user_id: user.id,
      survey_year: numericYear,
      answers: clean,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id,survey_year' });
    if (error) {
      setState('ready');
      setMessage(error.message || 'Could not save. Try again.');
      return;
    }
    setAnswers(clean);
    setState('saved');
    setMessage('Saved. You can edit this until the end of the year.');
  };

  if (!Number.isInteger(numericYear) || numericYear !== ANNUAL_SURVEY.year) {
    return <p>That survey is not on the site yet.</p>;
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{numericYear} member survey</h1>
        <p className="mt-2 text-sm text-text/70">About {ANNUAL_SURVEY.minutes} minutes. Optional, and it never blocks joining or renewing.</p>
        {!open && <p className="mt-2 text-sm">This year's survey is closed. You can still read what you sent.</p>}
      </header>
      {state === 'loading' && <p>Loading your answers…</p>}
      {state === 'error' && <p>{message}</p>}
      {state !== 'loading' && state !== 'error' && ANNUAL_SURVEY.sections.map((section) => (
        <section key={section.id} className="space-y-6">
          <h2 className="text-xl font-bold">{section.title}</h2>
          {section.questions.map((question) => (
            <fieldset key={question.id} className="rounded-3xl border border-primary/10 bg-white p-4">
              <legend className="px-1 text-sm font-semibold">{question.label}</legend>
              <QuestionField
                question={question}
                value={answers[question.id]}
                disabled={!open}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
              />
            </fieldset>
          ))}
        </section>
      ))}
      {open && state !== 'loading' && state !== 'error' && (
        <button type="submit" className="min-h-12 rounded-full bg-primary-text px-6 font-bold text-white" disabled={state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save survey'}
        </button>
      )}
      {message && state !== 'error' && <p className="text-sm">{message}</p>}
      <p><Link to="/dashboard" className="text-sm font-semibold text-primary-text">Back to my account</Link></p>
    </form>
  );
}

export default function AnnualSurvey() {
  const { year } = useParams();
  const { user, loading } = useAuth();
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-text">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-28">
        {loading || !user ? <p>Checking access…</p> : <AnnualSurveyForm year={year} />}
      </main>
      <Footer />
    </div>
  );
}
