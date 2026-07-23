import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Mic, FileText } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Lightbulb,
    title: 'Choose a topic',
    description: 'Select from curated prompts or bring your own. Every great speech starts with a clear subject.',
  },
  {
    number: '02',
    icon: Mic,
    title: 'Deliver your speech',
    description: 'Record your session in a distraction-free environment. Speak naturally — ImpromptuAI listens.',
  },
  {
    number: '03',
    icon: FileText,
    title: 'Receive AI feedback',
    description: 'Get a detailed report on clarity, pacing, filler words, and confidence moments right away.',
  },
];

const HowItWorks = () => (
  <section
    id="how-it-works"
    className="py-24 px-6 bg-[#FAFAF8]"
    aria-labelledby="how-heading"
  >
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-16"
      >
        <p className="text-xs font-semibold text-[#5B5B5B] uppercase tracking-widest mb-3">How it Works</p>
        <h2
          id="how-heading"
          className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight"
        >
          From prompt to progress
          <br />
          in three steps.
        </h2>
      </motion.div>

      {/* Steps */}
      <div className="relative">
        {/* Connecting line — desktop only */}
        <div
          className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-[#E7E7E7]"
          aria-hidden="true"
        />

        <div className="grid md:grid-cols-3 gap-10 relative z-10">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-start gap-5"
              >
                {/* Step icon + number */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-white" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-bold text-[#CCCCCC] tracking-widest">{step.number}</span>
                </div>

                <div>
                  <h3 className="text-[15px] font-semibold text-[#111111] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#5B5B5B] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorks;
