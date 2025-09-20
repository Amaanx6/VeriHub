'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Github, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Demo', href: '/demo' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Download', href: '/download' },
    { name: 'About', href: '/about' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-dark-surface/90 backdrop-blur-md border-b border-veri-purple/20'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="relative">
                <Shield className="h-8 w-8 text-veri-purple" />
                <div className="absolute inset-0 bg-veri-purple/20 rounded-full blur-md group-hover:bg-veri-purple/40 transition-colors" />
              </div>
              <span className="text-xl font-bold gradient-text">VeriHub</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative text-sm font-medium transition-colors hover:text-veri-purple',
                  pathname === item.href
                    ? 'text-veri-purple'
                    : 'text-veri-gray-light hover:text-white'
                )}
              >
                {item.name}
                {pathname === item.href && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-veri-purple rounded-full"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="https://github.com/verihub/extension"
              className="flex items-center space-x-2 text-veri-gray-light hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
              <span className="text-sm">Star</span>
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/download"
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Get Extension</span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-veri-gray-light hover:text-white transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-dark-surface/95 backdrop-blur-md border-b border-veri-purple/20"
          >
            <div className="px-4 py-4 space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={toggleMenu}
                  className={cn(
                    'block text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'text-veri-purple'
                      : 'text-veri-gray-light hover:text-white'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col space-y-3 pt-4 border-t border-veri-purple/20">
                <Link
                  href="https://github.com/verihub/extension"
                  className="flex items-center space-x-2 text-veri-gray-light hover:text-white transition-colors"
                  onClick={toggleMenu}
                >
                  <Github className="h-5 w-5" />
                  <span>Star on GitHub</span>
                </Link>
                <Link
                  href="/download"
                  className="btn-primary flex items-center space-x-2 justify-center"
                  onClick={toggleMenu}
                >
                  <Download className="h-4 w-4" />
                  <span>Get Extension Free</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}