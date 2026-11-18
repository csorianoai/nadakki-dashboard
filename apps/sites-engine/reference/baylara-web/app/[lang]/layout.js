import localFont from 'next/font/local';
import '../globals.css';
import Analytics from '../../components/Analytics';
import { LANGS } from '../../lib/routes';
import { getSite } from '../../lib/content';

const serif = localFont({
  src: '../fonts/cormorant-garamond-latin-500-normal.woff2',
  weight: '500',
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman'
});
const sans = localFont({
  src: '../fonts/manrope-latin-wght-normal.woff2',
  weight: '400 700',
  variable: '--font-sans',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial'
});

export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export const viewport = { themeColor: '#0e2236', width: 'device-width', initialScale: 1 };

export async function generateMetadata() {
  const site = getSite();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || site.siteUrl),
    icons: { icon: '/icon.svg' }
  };
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  return (
    <html lang={lang} className={`${serif.variable} ${sans.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
