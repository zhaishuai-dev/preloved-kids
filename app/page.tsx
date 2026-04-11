import { getListings } from '@/lib/listings';
import PrelovedApp from '@/components/PrelovedApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  const listings = getListings().filter(l => !l.archived);
  return <PrelovedApp initialListings={listings} />;
}
