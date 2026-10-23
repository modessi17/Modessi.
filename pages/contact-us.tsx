import { contact } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const siteUrl = 'https://modessi.ca';
const pageTitle = 'Contact Us — Modessi Construction Inc.';
const pageDescription =
  'Request a free quote for your bathroom renovation or custom space project in Windsor, Lakeshore, Tecumseh, or LaSalle, Ontario.';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSubmitError('');
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Your request could not be sent. Please try again or call us.');
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Your request could not be sent. Please try again or call us.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/contact-us`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/contact-us`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          '@id': `${siteUrl}/contact-us#webpage`,
          name: pageTitle,
          url: `${siteUrl}/contact-us`,
          isPartOf: { '@id': `${siteUrl}/#website` },
          about: { '@id': `${siteUrl}/#organization` },
        }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        {/* Page Header */}
        <section className="pt-40 pb-20 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10 bg-primary" />
                <span
                  className="text-xs tracking-widest text-primary"
                  style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}
                >
                  GET IN TOUCH
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-normal text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {contact.heading}
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-xxl bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] gap-16 items-start">

              {/* Info */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="lg:sticky lg:top-32"
              >
                <h2
                  className="text-2xl font-normal text-foreground mb-4"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {contact.subheading}
                </h2>
                <div className="h-px w-10 bg-primary mb-6" />
                <p className="text-sm text-foreground/60 leading-relaxed mb-8 font-serif">
                  {contact.description}
                </p>
                <div className="space-y-4">
                  {contact.benefits.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm text-foreground/60 font-serif">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Email Us + Form */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Email Us heading */}
                <h3
                  className="text-sm tracking-widest text-primary mb-4"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                >
                  EMAIL US
                </h3>
                <div className="h-px w-8 bg-primary mb-8" />

                {submitted ? (
                  <div className="bg-card border border-primary/30 p-12 text-center">
                    <div className="h-px w-12 bg-primary mx-auto mb-6" />
                    <h3
                      className="text-xl font-normal text-foreground mb-3"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {contact.successHeading}
                    </h3>
                    <p className="text-sm text-foreground/60 font-serif">
                      {contact.successMessage}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                        >
                          FULL NAME *
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors font-serif"
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-xs tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                        >
                          EMAIL ADDRESS *
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors font-serif"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                        >
                          PHONE NUMBER
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors font-serif"
                          placeholder="(519) 000-0000"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="city"
                          className="block text-xs tracking-widest text-foreground/50 mb-2"
                          style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                        >
                          CITY
                        </label>
                        <select
                          id="city"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-serif"
                        >
                          <option value="">Select your city</option>
                          <option value="Windsor">Windsor</option>
                          <option value="Lakeshore">Lakeshore</option>
                          <option value="Tecumseh">Tecumseh</option>
                          <option value="LaSalle">LaSalle</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs tracking-widest text-foreground/50 mb-2"
                        style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.15em' }}
                      >
                        PROJECT DETAILS *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        className="w-full bg-card border border-border px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none font-serif"
                        placeholder="Tell us about your project..."
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground/70">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300 disabled:cursor-wait disabled:opacity-60"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
                    >
                      {sending ? 'SENDING…' : 'SEND REQUEST'} {!sending && <ArrowRight size={14} />}
                    </button>
                  </form>
                )}
              </motion.div>
            </div>

            {/* Hours & Phone — bottom row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-20 pt-16 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-12"
            >
              {/* Business Hours */}
              <div>
                <h3
                  className="text-sm tracking-widest text-primary mb-4"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                >
                  {contact.hoursHeading}
                </h3>
                <div className="h-px w-8 bg-primary mb-5" />
                <div className="space-y-3">
                  {contact.hours.map((row) => (
                    <div key={row.id} className="flex justify-between items-center gap-4 max-w-xs">
                      <span
                        className="text-sm text-foreground/70 uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                      >{row.day}</span>
                      <span
                        className="text-sm text-foreground/50 uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.12em' }}
                      >{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <h3
                  className="text-sm tracking-widest text-primary mb-4"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                >
                  CALL US
                </h3>
                <div className="h-px w-8 bg-primary mb-5" />
                <a
                  href={`tel:${contact.phone}`}
                  className="text-base uppercase tracking-widest text-foreground/70 hover:text-primary transition-colors"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
                >
                  {contact.phone}
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
