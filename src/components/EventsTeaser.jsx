import React from 'react';
import { Calendar } from 'lucide-react';

export default function EventsTeaser() {
  return (
    <section id="events" className="py-24 px-4 bg-primary/5">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-5xl font-drama font-bold text-text mb-6">
          Upcoming Events & Conferences
        </h2>
        
        <p className="text-xl text-text/70 max-w-2xl mb-12">
          Connect with peers and help set the agenda for how PAs improve addiction care for patients and communities.
        </p>

        <div className="bg-white p-8 md:p-12 rounded-4xl shadow-sm border border-primary/10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-8 text-left group hover:shadow-lg transition-all">
          <div className="flex-1">
            <div className="text-primary-text font-bold font-data tracking-widest text-sm mb-2 uppercase">Fall 2026</div>
            <h3 className="text-2xl font-bold tracking-tight mb-2 group-hover:text-primary-text transition-colors">SAMPA Inaugural Member Summit</h3>
            <p className="text-text/60">A multi-day gathering for founding members to shape SAMPA's next chapter—stronger peer connection, better-informed practice, and care that reaches the people and communities who need it.</p>
          </div>
          <button className="whitespace-nowrap px-8 py-3 rounded-full border border-primary/20 hover:bg-primary-text hover:text-white font-semibold transition-colors">
            Get Notified
          </button>
        </div>

      </div>
    </section>
  );
}
