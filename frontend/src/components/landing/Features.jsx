import React from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart2, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'AI Speech Analysis',
    description:
      'Real-time feedback on clarity, pacing, confidence, and delivery. Understand exactly where to improve after every session.',
  },
  {
    icon: BarChart2,
    title: 'Practice History',
    description:
      'Every session is recorded and scored. Track long-term improvement across weeks and months with a clear visual timeline.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Insights',
    description:
      'Visual reports highlighting your strengths, identifying weaknesses, and charting measurable progress over time.',
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FeatureCard = ({ icon: Icon, title, description, index }) => (
  <motion.article
    custom={index}
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.09)' }}
    transition={{ duration: 0.2 }}
    className="group bg-white border border-[#E7E7E7] rounded-2xl p-7 flex flex-col gap-4 cursor-default"
    aria-label={title}
  >
    <div className="w-10 h-10 rounded-xl border border-[#E7E7E7] bg-[#FAFAF8] flex items-center justify-center group-hover:border-[#D0D0D0] transition-colors duration-200">
      <Icon size={18} className="text-[#111111]" aria-hidden="true" />
    </div>
    <div>
      <h3 className="text-[15px] font-semibold text-[#111111] mb-1.5">{title}</h3>
      <p className="text-sm text-[#5B5B5B] leading-relaxed">{description}</p>
    </div>
  </motion.article>
);

const Features = () => (
  <section
    id="features"
    className="py-24 px-6 bg-[#F5F5F4]"
    aria-labelledby="features-heading"
  >
    <div className="max-w-6xl mx-auto">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="mb-14"
      >
        <p className="text-xs font-semibold text-[#5B5B5B] uppercase tracking-widest mb-3">Features</p>
        <h2
          id="features-heading"
          className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight leading-tight max-w-xl"
        >
          Everything you need to
          <br />
          become a confident speaker.
        </h2>
      </motion.div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-5" role="list">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default Features;
