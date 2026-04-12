import { getListings, type Listing } from '@/lib/listings';
import PrelovedApp from '@/components/PrelovedApp';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function Home() {
  // Force fresh data on every request
  headers();

  let listings: Listing[] = [];
  try {
    listings = await getListings();
  } catch (error) {
    console.error('Failed to fetch listings:', error);
  }
  const activeListings = listings.filter(l => !l.archived);
  return <PrelovedApp initialListings={activeListings} />;
}
