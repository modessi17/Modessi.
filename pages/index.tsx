import { home } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle } from 'lucide-react';

const siteUrl = 'https://modessi.ca';
const pageTitle = 'Modessi Construction Inc. — Bathrooms, Renovations & Custom Spaces';
const pageDescription =
'General contracting and renovation company serving Windsor, Lakeshore, Tecumseh, and LaSalle in Southwestern Ontario. Expert bathrooms, renovations, and custom spaces.';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={`${siteUrl}/airo-assets/images/pages/home/hero`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={`${siteUrl}/airo-assets/images/pages/home/hero`} />
        <link rel="apple-touch-icon" href="/assets/other/980bcf27339b5cfdae969329d9666219.svg" sizes="180x180" />
        <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              url: siteUrl,
              name: 'Modessi Construction Inc.'
            },
            {
              '@type': 'GeneralContractor',
              '@id': `${siteUrl}/#organization`,
              name: 'Modessi Construction Inc.',
              url: siteUrl,
              description: pageDescription,
              areaServed: ['Windsor', 'Lakeshore', 'Tecumseh', 'LaSalle'],
              sameAs: [
              'https://www.facebook.com/modessiconstruction',
              'https://www.instagram.com/modessi_inc']

            },
            {
              '@type': 'WebPage',
              '@id': `${siteUrl}/#webpage`,
              url: siteUrl,
              name: pageTitle,
              isPartOf: { '@id': `${siteUrl}/#website` },
              about: { '@id': `${siteUrl}/#organization` },
              datePublished: '2026-10-15',
              dateModified: '2026-10-15'
            }]

          }).replace(/</g, '\\u003c')}</script>
      </Helmet>

      <main>
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <img
            src="/airo-assets/images/pages/home/hero"
            alt="Luxurious modern bathroom renovation by Modessi Construction"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            width={1983}
            height={793} />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-background/20 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-32">
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="max-w-2xl">
              
              <motion.div variants={fadeUp}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-12 bg-primary" />
                  <span
                    className="text-xs tracking-widest text-primary"
                    style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>WINDSOR, ONTARIO


                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-normal text-foreground leading-tight mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                
                Modessi Construction Inc.
              </motion.h1>

              <motion.div variants={fadeUp} className="h-px w-24 bg-primary my-5" />

              <motion.p
                variants={fadeUp}
                className="text-sm tracking-widest text-foreground/70 mb-8"
                style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                
                BATHROOMS / RENOVATIONS / CUSTOM SPACES
              </motion.p>

              <motion.div variants={fadeUp}>
                <Link
                  to="/contact-us"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}>
                  
                  GET QUOTE
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* ── ABOUT ────────────────────────────────────────────── */}
        <section className="py-xxl bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
              {/* Image — square, left */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative overflow-hidden aspect-square bg-card group">
                <img
                  src="/airo-assets/images/pages/home/about-bathroom"
                  alt="Modern renovated bathroom with black fixtures"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  width={800}
                  height={800} />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-all duration-500 pointer-events-none" />
              </motion.div>

              {/* Text — right */}
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card flex flex-col justify-center px-10 lg:px-14 py-14 aspect-square">
                
                <motion.span
                  variants={fadeUp}
                  className="text-xs tracking-widest text-primary mb-4 block"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.25em' }}>
                  ABOUT US
                </motion.span>

                <motion.h2
                  variants={fadeUp}
                  className="text-2xl lg:text-3xl font-normal text-foreground mb-5 leading-snug"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  General Contracting &amp; Renovations
                </motion.h2>

                <motion.div variants={fadeUp} className="h-px w-12 bg-primary mb-6" />

                <motion.p
                  variants={fadeUp}
                  className="text-base text-foreground/70 leading-relaxed mb-8 font-serif">
                  Currently serving: Windsor, Lakeshore, Tecumseh, LaSalle in Southwestern Ontario, Canada.
                </motion.p>

                <motion.div variants={fadeUp}>
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>
                    SERVICES
                    <ArrowRight size={12} />
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── BENTO GRID ───────────────────────────────────────── */}
        <section className="py-xxl bg-muted/30">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            {/* Section label */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-12">
              
              <div className="h-px w-12 bg-primary" />
              <span
                className="text-xs tracking-widest text-primary"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.25em' }}>
                
                WHY MODESSI
              </span>
            </motion.div>

            {/* Top row: Experience + Process */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border mb-px">
              {/* Experience Card */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card overflow-hidden">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  <div className="relative overflow-hidden min-h-[220px]">
                    <img
                      src="/airo-assets/images/pages/home/experience-bathroom"
                      alt="Luxury bathroom with marble and gold fixtures"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={400}
                      height={400} />
                    
                  </div>
                  <div className="p-8 lg:p-10 flex flex-col justify-center">
                    <span
                      className="text-xs tracking-widest text-primary mb-3 block"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.25em' }}>
                      EXPERIENCE
                    </span>
                    <h3
                      className="text-2xl lg:text-3xl font-normal text-foreground mb-4 leading-snug"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                      12+ Years in the Field
                    </h3>
                    <div className="h-px w-8 bg-primary mb-4" />
                    <p className="text-base text-foreground/70 leading-relaxed mb-6 font-serif">
                      We have been serving the area for the previous 10 years. 12+ years in the field allows for expert advice and top quality workmanship.
                    </p>
                    <Link
                      to="/gallery"
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300 self-start"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>
                      GALLERY <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Process Card */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card overflow-hidden">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  <div className="p-8 lg:p-10 flex flex-col justify-center order-2 sm:order-1">
                    <span
                      className="text-xs tracking-widest text-primary mb-3 block"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.25em' }}>
                      OUR PROCESS
                    </span>
                    <h3
                      className="text-2xl lg:text-3xl font-normal text-foreground mb-4 leading-snug"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                      How We Work
                    </h3>
                    <div className="h-px w-8 bg-primary mb-5" />
                    <ul className="space-y-3 mb-6">
                      {home.processList.map((item) =>
                      <li key={item.id} className="flex items-start gap-3 text-sm text-foreground/70 leading-relaxed font-serif">
                          <CheckCircle size={15} className="text-primary mt-0.5 shrink-0" />
                          <span>{item.text}</span>
                        </li>
                      )}
                    </ul>
                    <Link
                      to="/contact-us"
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary text-primary text-xs tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300 self-start"
                      style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}>
                      CONTACT US <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="relative overflow-hidden min-h-[220px] order-1 sm:order-2">
                    <img
                      src="/airo-assets/images/pages/home/process-shower"
                      alt="Frameless glass shower enclosure with black trim"
                      className="w-full h-full object-cover"
                      loading="lazy"
                      width={400}
                      height={400} />
                    
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom row: Education — full width */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-card overflow-hidden">
              
              <div className="grid grid-cols-1 md:grid-cols-[40fr_60fr] items-stretch">
                <div className="relative overflow-hidden min-h-[260px]">
                  <img
                    src="/airo-assets/images/pages/home/education-blueprints"
                    alt="Construction blueprints and engineering planning"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={800}
                    height={400} />
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60 pointer-events-none" />
                </div>
                <div className="px-10 lg:px-16 py-14 flex flex-col justify-center">
                  <span
                    className="text-xs tracking-widest text-primary mb-3 block"
                    style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.25em' }}>
                    EDUCATION
                  </span>
                  <h3
                    className="text-2xl lg:text-4xl font-normal text-foreground mb-4 leading-snug"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    Built on Knowledge
                  </h3>
                  <div className="h-px w-10 bg-primary mb-5" />
                  <p className="text-sm text-foreground/70 leading-relaxed max-w-lg font-serif">
                    Degree in Civil Engineering ensures proper building materials and methods. Continuous learning to stay current with building codes and using top quality product.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── FINAL CTA BAND ───────────────────────────────────── */}
        <section className="py-xxl bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              
              <div>
                <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-primary" />
                  <span
                    className="text-xs tracking-widest text-primary"
                    style={{ fontFamily: 'var(--font-sans)', letterSpacing: '0.2em' }}>
                    
                    START YOUR PROJECT
                  </span>
                </motion.div>
                <motion.h2
                  variants={fadeUp}
                  className="text-2xl lg:text-4xl font-normal text-foreground"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  
                  Ready to Transform Your Space?
                </motion.h2>
              </div>
              <motion.div variants={fadeUp} className="shrink-0">
                <Link
                  to="/contact-us"
                  className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}>
                  
                  GET A FREE QUOTE
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>);

}