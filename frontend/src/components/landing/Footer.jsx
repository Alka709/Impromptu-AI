import React from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'GitHub', href: 'https://github.com', external: true },
  { label: 'Contact', href: 'mailto:hello@impromptu.app', external: true },
];

const Footer = () => (
  <footer className="border-t border-[#E7E7E7] bg-white" role="contentinfo">
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2"
        aria-label="ImpromptuAI home"
      >
        <span className="w-6 h-6 bg-[#111111] rounded-md flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 12L7 2L12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 8.5H10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </span>
        <span className="text-[#111111] font-semibold text-[14px] tracking-tight">ImpromptuAI</span>
      </Link>

      {/* Links */}
      <nav aria-label="Footer navigation">
        <ul className="flex flex-wrap items-center gap-6" role="list">
          {LINKS.map((link) => (
            <li key={link.label}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#5B5B5B] hover:text-[#111111] transition-colors duration-150 font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.href}
                  className="text-xs text-[#5B5B5B] hover:text-[#111111] transition-colors duration-150 font-medium"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Copyright */}
      <p className="text-xs text-[#ABABAB]">
        © {new Date().getFullYear()} ImpromptuAI
      </p>
    </div>
  </footer>
);

export default Footer;
