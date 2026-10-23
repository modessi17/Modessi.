import { gallery } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';

const siteUrl = 'https://modessi.ca';
const pageTitle = 'Gallery — Modessi Construction Inc.';
const pageDescription =
  'Browse our portfolio of bathroom renovations and custom spaces in Windsor, Lakeshore, Tecumseh, and LaSalle, Ontario.';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function GalleryPage() {
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`${siteUrl}/gallery`} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`${siteUrl}/gallery`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${siteUrl}/gallery#webpage`,
          name: pageTitle,
          url: `${siteUrl}/gallery`,
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
                  OUR WORK
                </span>
              </div>
              <h1
                className="text-4xl lg:text-5xl font-normal text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Project Gallery
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="py-xxl bg-background">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {[...gallery.galleryImages].reverse().map((img, i) => (
                <motion.figure
                  key={img.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="relative overflow-hidden bg-card aspect-square group"
                >
                  <img
                    src={img.slot}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    width={800}
                    height={800}
                  />
                  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-all duration-500 pointer-events-none" />
                </motion.figure>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
