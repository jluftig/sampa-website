import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Users, Mail, BookOpen, GraduationCap, Briefcase, ScrollText } from 'lucide-react';

const live = [
  {
    icon: Newspaper,
    title: 'Daily news for providers',
    desc: 'Research, policy, and practice updates so care stays grounded in what is happening now—and people and communities benefit.',
    href: '/news',
    cta: 'Read the news',
  },
  {
    icon: Users,
    title: 'Member networking directory',
    desc: 'A private national peer directory for PAs in addiction medicine—collaborate on mission-related projects, share experience, and reduce isolation in the work.',
    href: '/join',
    cta: 'Join to connect',
  },
  {
    icon: ScrollText,
    title: 'Policy for patient access',
    desc: 'When rules and payment systems limit access to evidence-based treatment, patients lose—especially in rural and underserved communities. Our Policy hub is a nonpartisan voice for quality care and access, starting with federal comments.',
    href: '/policy',
    cta: 'See our Policy hub',
  },
];

const building = [
  {
    icon: Mail,
    title: 'Member email updates',
    desc: 'Society announcements, a weekly roundup of SAMPA’s PA-focused news, and optional lists for policy, jobs, and CME—with preferences members control. Preference controls exist today; regular campaigns are rolling out.',
  },
  {
    icon: BookOpen,
    title: 'Practice resources',
    desc: 'Evidence-based treatment guidance so PAs can apply current best practices when supporting patients with substance use disorders.',
  },
  {
    icon: GraduationCap,
    title: 'CME',
    desc: 'Continuing medical education tailored to addiction medicine for physician associates—so clinical skills keep pace with the field.',
  },
  {
    icon: Briefcase,
    title: 'Job board',
    desc: 'A mission-aligned place for openings in addiction medicine, helping PAs find roles where they can serve individuals and communities in need.',
  },
];

export default function ValueProps() {
  return (
    <section id="programs" className="py-24 bg-gradient-to-b from-transparent to-primary/5 px-4">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-sans tracking-tight font-bold text-text mb-6">
            What we do
          </h2>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Programs that improve care for people and communities impacted by
            substance use disorders — by supporting the PAs who deliver that care,
            including in rural and underserved settings. Live offerings are newly
            launched; more is on the way.
          </p>
        </div>

        <h3 className="text-sm font-bold tracking-widest text-accent uppercase mb-8 text-center md:text-left">
          Live now
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {live.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="bg-white p-10 rounded-4xl shadow-sm border border-primary/10">
                <div className="flex items-center justify-between gap-3 mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-data uppercase tracking-wider text-accent font-semibold">
                    New
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-sans tracking-tight mb-4 text-text/90 leading-snug">
                  {p.title}
                </h3>
                <p className="text-text/70 leading-relaxed text-lg mb-6">
                  {p.desc}
                </p>
                <Link
                  to={p.href}
                  className="font-semibold text-primary-text hover:underline"
                >
                  {p.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-bold tracking-widest text-accent uppercase mb-8 text-center md:text-left">
          In development
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {building.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="bg-white/80 p-10 rounded-4xl border border-primary/10">
                <div className="flex items-center justify-between gap-3 mb-8">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-accent" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-data uppercase tracking-wider text-text/50 font-semibold">
                    Coming soon
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-sans tracking-tight mb-4 text-text/90 leading-snug">
                  {p.title}
                </h3>
                <p className="text-text/70 leading-relaxed text-lg">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center mt-12 text-text/60">
          <Link to="/about#programs" className="font-semibold text-primary-text hover:underline">
            Full program details on our About page
          </Link>
        </p>

      </div>
    </section>
  );
}
