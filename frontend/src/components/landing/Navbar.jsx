import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Why ImpromptuAI', href: '#why-impromptu' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAnchorClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-[#E7E7E7]'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav
        className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 group"
          aria-label="ImpromptuAI home"
        >
          <span className="w-7 h-7 bg-[#111111] rounded-md flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 12L7 2L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8.5H10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="text-[#111111] font-semibold text-[15px] tracking-tight">
            ImpromptuAI
          </span>
        </Link>

        {/* Center links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-sm text-[#5B5B5B] hover:text-[#111111] transition-colors duration-150 font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-[#5B5B5B] hover:text-[#111111] transition-colors duration-150 font-medium px-3 py-2"
            aria-label="Log in"
          >
            Login
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/signup')}
            className="text-sm bg-[#111827] text-white font-medium px-4 py-2 rounded-lg hover:bg-[#000000] transition-colors duration-150"
            aria-label="Get started"
          >
            Get Started
          </motion.button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#111111]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden bg-white border-b border-[#E7E7E7] px-6 py-4 flex flex-col gap-4"
            role="menu"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-sm font-medium text-[#5B5B5B] hover:text-[#111111] transition-colors"
                role="menuitem"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-[#E7E7E7]" />
            <button
              onClick={() => { setMobileOpen(false); navigate('/login'); }}
              className="text-sm font-medium text-[#5B5B5B] text-left"
            >
              Login
            </button>
            <button
              onClick={() => { setMobileOpen(false); navigate('/signup'); }}
              className="text-sm bg-[#111827] text-white font-medium px-4 py-2.5 rounded-lg w-full"
            >
              Get Started
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
