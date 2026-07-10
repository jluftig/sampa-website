import React from 'react';
import { BookOpen, HeartPulse, Activity } from 'lucide-react';

const props = [
  {
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    title: "High-quality, evidence-based education",
    desc: "Delivering cutting-edge continuing medical education and training tailored for Physician Associates to master addiction medicine."
  },
  {
    icon: <HeartPulse className="w-8 h-8 text-accent" />,
    title: "Improving patient care for substance use disorders",
    desc: "Advancing compassionate, effective treatment strategies that reduce harm, save lives, and elevate outcomes for patients nationwide."
  },
  {
    icon: <Activity className="w-8 h-8 text-primary" />,
    title: "Scientific advancement and public health impact",
    desc: "Supporting research, stigma reduction, and community outreach to expand access to addiction medicine and improve population health."
  }
];

export default function ValueProps() {
  return (
    <section id="value-props" className="py-24 bg-gradient-to-b from-transparent to-primary/5 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-5xl font-sans tracking-tight font-bold text-text mb-6">
            Our Key Pillars
          </h2>
          <p className="text-xl text-text/70 max-w-2xl mx-auto">
            Everything we do is guided by a commitment to quality, patient care, and systemic change.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}
