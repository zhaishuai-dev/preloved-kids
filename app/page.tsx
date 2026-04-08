import { getListings } from '@/lib/listings';
import PrelovedApp from '@/components/PrelovedApp';

export const dynamic = 'force-dynamic';

export default function Home() {
  const listings = getListings();
  return <PrelovedApp initialListings={listings} />;
}
