import { Link } from 'react-router';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact Us', href: '/contact-us' },
];

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-card border-t border-primary/30">
      {/* Thin gold rule */}
      <div className="h-px bg-primary/60 w-full" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Col 1: Logo + tagline */}
          <div className="flex flex-col gap-4">
            <Link to="/">
              <img
                src="/airo-assets/images/logo/horizontal"
                alt="Modessi Construction Inc."
                className="block h-auto max-h-14 w-auto max-w-[180px] object-contain"
              />
            </Link>
            <p
              className="text-xs tracking-widest text-muted-foreground mt-2"
              style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
            >
              BATHROOMS / RENOVATIONS / CUSTOM SPACES
            </p>
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h3
              className="text-xs tracking-widest text-primary mb-5"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
            >
              QUICK LINKS
            </h3>
            <nav aria-label="Footer links" className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-foreground/60 hover:text-primary transition-colors duration-200"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3: Social */}
          <div>
            <h3
              className="text-xs tracking-widest text-primary mb-5"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
            >
              FOLLOW US
            </h3>
            <div className="flex gap-4">
              <a
                href="https://www.facebook.com/modessiconstruction"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Modessi Construction on Facebook"
                className="w-10 h-10 border border-border flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary transition-all duration-200"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/modessi_inc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Modessi Construction on Instagram"
                className="w-10 h-10 border border-border flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary transition-all duration-200"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs text-foreground/40"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Copyright &copy; 2026 Modessi Construction Inc. — All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy-policy"
              className="text-xs text-foreground/40 hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-foreground/40 hover:text-primary transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
