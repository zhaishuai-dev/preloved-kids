import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Preloved Kids — Quality Second-Hand Treasures',
  description: 'Browse quality preloved kids items — toys, books, clothes, and more. Singapore.',
  openGraph: {
    title: 'Preloved Kids 🧸',
    description: 'Quality second-hand treasures for little ones',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
