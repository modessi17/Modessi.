import { Helmet } from '@dr.pogodin/react-helmet';
import Header from './parts/Header';
import Footer from './parts/Footer';
import ScrollToTop from '@/components/ScrollToTop';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <ScrollToTop />
      <Helmet>
        <title>Modessi Construction Inc. — Bathrooms, Renovations &amp; Custom Spaces</title>
        <meta
          name="description"
          content="General contracting and renovation company serving Windsor, Lakeshore, Tecumseh, and LaSalle in Southwestern Ontario. Expert bathrooms, renovations, and custom spaces."
        />
        <meta name="theme-color" content="#0A0A0A" />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </>
  );
}
