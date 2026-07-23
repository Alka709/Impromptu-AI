import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import WhySection from '../components/landing/WhySection';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#111111]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <WhySection />
      <CTA />
      <Footer />
    </main>
  );
};

export default LandingPage;
