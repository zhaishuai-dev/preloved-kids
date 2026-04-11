import { getListings } from '@/lib/listings';
import PrelovedApp from '@/components/PrelovedApp';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const listings = await getListings();
  const activeListings = listings.filter(l => !l.archived);
  return <PrelovedApp initialListings={activeListings} />;
}
