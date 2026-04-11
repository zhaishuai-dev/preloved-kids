import { getListings, type Listing } from '@/lib/listings';
import PrelovedApp from '@/components/PrelovedApp';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let listings: Listing[] = [];
  try {
    listings = await getListings();
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    // Continue with empty listings, data will load client-side
  }
  const activeListings = listings.filter(l => !l.archived);
  return <PrelovedApp initialListings={activeListings} />;
}
