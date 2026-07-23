import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section
      className="py-24 px-6 bg-[#FAFAF8]"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#0F172A] rounded-3xl px-8 py-16 md:px-16 flex flex-col items-center text-center gap-8"
        >
          <div className="space-y-4 max-w-xl">
            <h2
              id="cta-heading"
              className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight"
            >
              Ready to improve your
              <br />
              communication?
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed">
              Start your first AI-powered practice session today. No credit card required.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: '#EBEBEB' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-white text-[#0F172A] font-semibold px-8 py-4 rounded-xl text-sm transition-colors duration-150"
            aria-label="Get started for free"
          >
            Get Started — it's free
            <ArrowRight size={15} aria-hidden="true" />
          </motion.button>

          <p className="text-xs text-white/40">Start practicing with ImpromptuAI today</p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
