import { RouteObject } from 'react-router';
import { lazy } from 'react';
import HomePage from './pages/index';
import ServicesPage from './pages/services';
import GalleryPage from './pages/gallery';
import ContactPage from './pages/contact-us';
import ShowerBuilderPage from './pages/design-your-shower';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/services',
    element: <ServicesPage />,
  },
  {
    path: '/gallery',
    element: <GalleryPage />,
  },
  {
    path: '/contact-us',
    element: <ContactPage />,
  },
  {
    path: '/design-your-shower',
    element: <ShowerBuilderPage />,
  },
  {
    id: 'airo-not-found',
    path: '*',
    element: <NotFoundPage />,
  },
];

export type Path = '/' | '/services' | '/gallery' | '/contact-us' | '/design-your-shower';
export type Params = Record<string, string | undefined>;
