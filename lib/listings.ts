import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'listings.json');

export interface Listing {
  id: string;
  title: string;
  brand: string;
  category: string;
  condition: string;
  ageRange: string;
  price: number;
  pricingType: string;
  description: string;
  originalImage: string;
  photos: string[];
  seller: string;
  location: string;
  whatsapp: string;
  archived: boolean;
  createdAt: string;
}

interface ListingsData {
  listings: Listing[];
}

export function getListings(): Listing[] {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const data: ListingsData = JSON.parse(raw);
  return data.listings;
}

export function saveListings(listings: Listing[]): void {
  const data: ListingsData = { listings };
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function addListing(listing: Listing): Listing {
  const listings = getListings();
  listings.unshift(listing);
  saveListings(listings);
  return listing;
}

export function updateListing(id: string, updates: Partial<Listing>): Listing | null {
  const listings = getListings();
  const idx = listings.findIndex(l => l.id === id);
  if (idx === -1) return null;
  listings[idx] = { ...listings[idx], ...updates };
  saveListings(listings);
  return listings[idx];
}

export function archiveListing(id: string): Listing | null {
  const listings = getListings();
  const idx = listings.findIndex(l => l.id === id);
  if (idx === -1) return null;
  listings[idx].archived = !listings[idx].archived;
  saveListings(listings);
  return listings[idx];
}
