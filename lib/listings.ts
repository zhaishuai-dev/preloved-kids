import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  views: number;
  createdAt: string;
}

function rowToListing(row: any): Listing {
  return {
    id: row.id,
    title: row.title || '',
    brand: row.brand || '',
    category: row.category || 'Others',
    condition: row.condition || 'Good',
    ageRange: row.age_range || '3-6y',
    price: row.price || 0,
    pricingType: row.pricing_type || 'fixed',
    description: row.description || '',
    originalImage: row.original_image || '',
    photos: row.photos ? row.photos.split(',').filter(Boolean) : [],
    seller: row.seller || 'Seller',
    location: row.location || '',
    whatsapp: row.whatsapp || '6591152527',
    archived: row.archived || false,
    views: row.views || 0,
    createdAt: row.created_at,
  };
}

export async function getListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToListing);
}

export async function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      title: listing.title,
      brand: listing.brand,
      category: listing.category,
      condition: listing.condition,
      age_range: listing.ageRange,
      price: listing.price,
      pricing_type: listing.pricingType,
      description: listing.description,
      original_image: listing.originalImage,
      photos: listing.photos.join(','),
      seller: listing.seller,
      location: listing.location,
      whatsapp: listing.whatsapp,
      archived: false,
      views: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToListing(data);
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  const row: any = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.brand !== undefined) row.brand = updates.brand;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.condition !== undefined) row.condition = updates.condition;
  if (updates.ageRange !== undefined) row.age_range = updates.ageRange;
  if (updates.price !== undefined) row.price = updates.price;
  if (updates.pricingType !== undefined) row.pricing_type = updates.pricingType;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.originalImage !== undefined) row.original_image = updates.originalImage;
  if (updates.photos !== undefined) row.photos = updates.photos.join(',');
  if (updates.location !== undefined) row.location = updates.location;

  const { data, error } = await supabase
    .from('listings')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToListing(data);
}

export async function incrementViews(id: string): Promise<void> {
  const { data: current } = await supabase
    .from('listings')
    .select('views')
    .eq('id', id)
    .single();
  await supabase
    .from('listings')
    .update({ views: (current?.views || 0) + 1 })
    .eq('id', id);
}

export async function archiveListing(id: string): Promise<Listing | null> {
  const { data: current, error: fetchError } = await supabase
    .from('listings')
    .select('archived')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('listings')
    .update({ archived: !current.archived })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToListing(data);
}
