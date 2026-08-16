import React from 'react';
import { Link } from 'react-router-dom';

// Homepage mission / nonprofit band. Full narrative lives on /about.

export default function About() {
  return (
    <section id="about" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-5xl p-10 md:p-16 lg:p-24 shadow-sm border border-primary/5 flex flex-col md:flex-row gap-12 lg:gap-24 items-center">

        <div className="w-full md:w-1/2">
          <h2 className="text-sm font-bold tracking-widest text-accent uppercase mb-4 relative before:content-[''] before:w-8 before:h-px before:bg-accent/50 before:inline-block before:align-middle before:mr-3">
            Our Mission
          </h2>
          <p className="text-sm font-semibold text-primary-text mb-4 font-data tracking-wide">
            SAMPA, Inc. is a 501(c)(3) nonprofit organization · EIN 42-2288772
          </p>
          <h3 className="text-3xl md:text-5xl font-drama text-text leading-tight mb-8">
            Built for the people addiction medicine serves.
          </h3>
          <p className="text-lg text-text/80 leading-relaxed mb-6 font-medium">
            SAMPA is a nonprofit with one measure of success: better care for
            people with substance use disorders. We pursue it by strengthening
            the PAs who deliver that care — often the clinicians closest to
            rural and underserved communities — through education, training,
            and clinical practice.
          </p>
          <p className="text-lg text-text/70 leading-relaxed mb-8">
            Today that work lives in newly launched programs: daily
            addiction-medicine news, member email updates, a private member
            directory for peer collaboration, a policy hub where we make
            the case for access to addiction care — including medications for
            opioid use disorder, starting with federal public comments — and
            a first set of{' '}
            <Link to="/resources" className="text-primary-text font-semibold underline-offset-2 hover:underline">
              practice resources
            </Link>
            {' '}you can use now. CME and a job board are still on the way —
            always in service of better care.
          </p>
          <Link
            to="/about"
            className="inline-block px-7 py-3 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors"
          >
            Learn more about SAMPA
          </Link>
        </div>

        <div className="w-full md:w-1/2 relative">
          <div className="aspect-square bg-gradient-to-tr from-primary/10 to-accent/10 rounded-4xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <img src="/SAMPA_no_bg.svg" alt="SAMPA Seal" className="w-2/3 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-primary/5">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-text to-accent bg-clip-text text-transparent leading-tight">
              Improving <br />
              Outcomes
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
