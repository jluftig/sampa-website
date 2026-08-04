import React from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Users, HeartPulse, ScrollText } from 'lucide-react';

const props = [
  {
    icon: <Newspaper className="w-8 h-8 text-primary" />,
    title: "Daily news to keep providers current",
    desc: "Research, policy, and practice updates so physician associates stay informed—and patients and communities benefit from care grounded in what is happening now."
  },
  {
    icon: <Users className="w-8 h-8 text-accent" />,
    title: "Member networking that strengthens practice",
    desc: "A private national peer directory and community for PAs in addiction medicine—share experience, find colleagues, and reduce isolation in the work."
  },
  {
    icon: <ScrollText className="w-8 h-8 text-primary" />,
    title: "Policy work for quality care and access",
    desc: "Public comments and positions drafted on behalf of addiction-medicine PAs—advancing clinical quality and access to MOUD for patients, not partisan politics.",
    href: "/policy",
    linkLabel: "See our Policy work",
  },
  {
    icon: <HeartPulse className="w-8 h-8 text-accent" />,
    title: "Care that reaches people who need it",
    desc: "Everything we build—from news to networking, policy, and education and training as we grow—exists so individuals and communities impacted by substance use disorders receive high-quality, accessible, patient-centered care."
  }
];

export default function ValueProps() {
  return (
    <section id="value-props" className="py-24 bg-gradient-to-b from-transparent to-primary/5 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-5xl font-sans tracking-tight font-bold text-text mb-6">
            What SAMPA offers now
          </h2>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Practical support for physician associates—so individuals and communities impacted by substance use disorders get better care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {props.map((p, idx) => (
            <div key={idx} className="bg-white p-10 rounded-4xl shadow-sm border border-primary/10 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-16 h-16 bg-primary/10 group-hover:bg-primary/20 transition-colors rounded-2xl flex items-center justify-center mb-8">
                {p.icon}
              </div>
              <h3 className="text-2xl font-bold font-sans tracking-tight mb-4 text-text/90 group-hover:text-primary-text transition-colors leading-snug">
                {p.title}
              </h3>
              <p className="text-text/70 leading-relaxed text-lg">
                {p.desc}
              </p>
              {p.href && (
                <Link
                  to={p.href}
                  className="inline-block mt-5 text-primary-text font-semibold hover:underline"
                >
                  {p.linkLabel} →
                </Link>
              )}
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
