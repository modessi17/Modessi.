import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Design Your Bathroom', href: '/design-your-shower' },
  { label: 'Contact Us', href: '/contact-us' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <img
            src="/airo-assets/images/logo/horizontal"
            alt="Modessi Construction Inc."
            className="block h-auto max-h-12 w-auto max-w-full object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm tracking-widest transition-colors duration-200 font-sans ${
                location.pathname === link.href
                  ? 'text-primary'
                  : 'text-foreground/70 hover:text-primary'
              }`}
              style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.12em' }}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center">
          <Link
            to="/contact-us"
            className="px-5 py-2 text-xs tracking-widest border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
          >
            GET QUOTE
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-md border-t border-border px-6 py-6 flex flex-col gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm tracking-widest transition-colors ${
                location.pathname === link.href ? 'text-primary' : 'text-foreground/70'
              }`}
              style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.12em' }}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
          <Link
            to="/contact-us"
            className="mt-2 px-5 py-3 text-xs tracking-widest border border-primary text-primary text-center hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
          >
            GET QUOTE
          </Link>
        </div>
      )}
    </header>
  );
}
