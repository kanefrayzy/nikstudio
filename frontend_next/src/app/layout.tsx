import type { Metadata } from 'next';
import { Inter, Cabin } from 'next/font/google';
import localFont from 'next/font/local';
import { generateHomeMetadata } from '@/lib/seo-helpers';
import './globals.css';

// Подключаем Google Fonts Inter
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

// Подключаем Google Fonts Cabin с оптимизацией
const cabin = Cabin({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cabin',
  display: 'swap',
  preload: true,
});

//  Geometria
const geometria = localFont({
  src: [
    {
      path: '../../public/fonts/geometria_light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/geometria_lightitalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: '../../public/fonts/geometria_medium.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/geometria_bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/geometria_extrabold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-geometria',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  return generateHomeMetadata();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Фавиконки */}
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* DNS Prefetch для API */}
        <link rel="preconnect" href="https://nikstudio.pro" />
        <link rel="dns-prefetch" href="https://nikstudio.pro" />
      </head>
      <body className={`${inter.variable} ${cabin.variable} ${geometria.variable}`}>
        {children}
      </body>
    </html>
  );
}
