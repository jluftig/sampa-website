import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  const heroRef = useRef(null);
  const text1Ref = useRef(null);
  const text2Ref = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.5 });
    tl.fromTo(text1Ref.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
      .fromTo(text2Ref.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.4");
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex text-center justify-center items-center px-4 pt-24 overflow-hidden">
      {/* Background soft gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#e6f4f1] to-[#f4e6f4] z-0"></div>

      {/* Subtle background circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[80px] -z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-accent/5 rounded-full blur-[100px] -z-0"></div>

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary-text text-xs font-semibold mb-8 font-data tracking-wider uppercase">
          A nonprofit pending 501(c)(3) status
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-tight leading-tight mb-6">
          <span ref={text1Ref} className="block text-primary font-bold mb-4 xl:mb-6">SAMPA is</span>
          <span ref={text2Ref} className="block font-drama text-accent text-5xl md:text-7xl lg:text-8xl leading-tight pb-4">
            advancing addiction medicine for PAs.
          </span>
        </h1>

        <p className="mt-6 md:mt-8 max-w-2xl mx-auto text-lg md:text-xl text-text/70 leading-relaxed font-medium">
          The Society of Addiction Medicine Physician Associates is building a supportive national network, elevating patient care, and increasing access to evidence-based education for physician associates.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <a href="#membership" className="btn-magnetic bg-primary-text text-white text-lg px-8 py-4 rounded-full shadow-xl shadow-primary/20 group flex items-center justify-center">
            <span>Join as a Founding Member</span>
            <ArrowRight className="ml-2 w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#about" className="px-8 py-4 rounded-full text-text/80 hover:text-primary-text font-semibold transition-colors">
            Our Mission
          </a>
        </div>
      </div>
    </section>
  );
}
