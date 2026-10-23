import { services } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

const siteUrl = 'https://modessi.ca';
const pageTitle = 'Services — Modessi Construction Inc.';
const pageDescription =
  'Bathroom renovations, general contracting, and custom spaces in Windsor, Lakeshore, Tecumseh, and LaSalle, Ontario.';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// One photo per service card, in content order
const servicePhotos = [
  { src: '/airo-assets/images/imported/image-1792039752024',    alt: 'Modern white bathroom with glass shower enclosure' },
  { src: '/airo-assets/images/imported/image-1792039956390',    alt: 'Modern bathroom shower enclosure with black frame' },
  { src: '/airo-assets/images/imported/image-1792039876715',    alt: 'Wooden deck with evergreen trees backdrop' },
  { src: '/airo-assets/images/pages/gallery/photo-7',           alt: 'Modern bathroom vanity with marble countertop' },
  { src: '/airo-assets/images/pages/gallery/photo-6',           alt: 'Architect reviewing blueprints on site' },
  { src: '/airo-assets/images/pages/home/education-blueprints', alt: 'Construction blueprints and engineering planning' },
];

export default function ServicesPage() {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/services`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/services`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/services#webpage`,
          name: pageTitle,
          url: `${siteUrl}/services`,
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
                  WHAT WE OFFER
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-normal text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Our Services
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Services Grid — 2 cols × 3 rows, photo above title */}
        <section className="py-xxl bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14"
            >
              {services.services.map((service, i) => {
                const photo = servicePhotos[i] ?? servicePhotos[0];
                return (
                  <motion.article
                    key={service.id}
                    variants={fadeUp}
                    className="flex flex-col group"
                  >
                    {/* Photo */}
                    <div className="relative overflow-hidden aspect-[4/3] bg-card mb-7">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        width={800}
                        height={600}
                      />
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-all duration-500 pointer-events-none" />
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-4 px-1">
                      <div className="h-px w-8 bg-primary" />
                      <h2
                        className="text-xl lg:text-2xl font-normal text-foreground leading-snug"
                        style={{ fontFamily: 'var(--font-heading)' }}
                      >
                        {service.title}
                      </h2>
                      <p className="text-sm text-foreground/60 leading-relaxed font-serif">
                        {service.description}
                      </p>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>

            {/* CTA */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-16 flex items-center"
            >
              <Link
                to="/contact-us"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-xs tracking-widest hover:bg-primary/90 transition-all duration-300"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.2em' }}
              >
                GET A FREE QUOTE <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
