import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    // We could add ScrollTrigger animations here once imported, but for now simple setup
  }, []);

  return (
    <section id="about" ref={sectionRef} className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-5xl p-10 md:p-16 lg:p-24 shadow-sm border border-primary/5 flex flex-col md:flex-row gap-12 lg:gap-24 items-center">
        
        <div className="w-full md:w-1/2">
          <h2 className="text-sm font-bold tracking-widest text-accent uppercase mb-4 relative before:content-[''] before:w-8 before:h-px before:bg-accent/50 before:inline-block before:align-middle before:mr-3">
            Our Mission
          </h2>
          <h3 className="text-3xl md:text-5xl font-drama text-text leading-tight mb-8">
            Empowering PAs in Addiction Medicine.
          </h3>
          <p className="text-lg text-text/80 leading-relaxed mb-6 font-medium">
            The Society for Addiction Medicine PAs is a nonprofit organization dedicated to improving the health and well-being of people with substance use disorders by advocating for, educating, and connecting Physician Associates practicing in addiction medicine across the nation.
          </p>
          <p className="text-lg text-text/70 leading-relaxed">
            As the trusted digital headquarters for SAMPA, we are building a supportive environment that recognizes the unique role of PAs in combating substance use disorders and improving patient outcomes.
          </p>
        </div>

        <div className="w-full md:w-1/2 relative">
          <div className="aspect-square bg-gradient-to-tr from-primary/10 to-accent/10 rounded-4xl overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              <img src="/SAMPA_no_bg.svg" alt="SAMPA Seal" className="w-2/3 object-contain drop-shadow-2xl" />
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-primary/5 animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
              Advancing <br />
              Addiction Medicine
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
