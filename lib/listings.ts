import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

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

function pageToListing(page: any): Listing {
  const props = page.properties;
  return {
    id: page.id,
    title: props['Title']?.title?.[0]?.plain_text || '',
    brand: props['Brand']?.rich_text?.[0]?.plain_text || '',
    category: props['Category']?.select?.name || 'Others',
    condition: props['Condition']?.select?.name || 'Good',
    ageRange: props['Age Range']?.select?.name || '3-6y',
    price: props['Price']?.number || 0,
    pricingType: props['Pricing Type']?.select?.name || 'fixed',
    description: props['Description']?.rich_text?.[0]?.plain_text || '',
    originalImage: props['Original Image']?.rich_text?.[0]?.plain_text || '',
    photos: (props['Photos']?.rich_text?.[0]?.plain_text || '').split(',').filter(Boolean),
    seller: 'Seller',
    location: props['Location']?.rich_text?.[0]?.plain_text || '',
    whatsapp: props['WhatsApp']?.rich_text?.[0]?.plain_text || '6591152527',
    archived: props['Archived']?.checkbox || false,
    createdAt: page.created_time,
  };
}

export async function getListings(): Promise<Listing[]> {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
  });
  return response.results.map(pageToListing);
}

export async function addListing(listing: Omit<Listing, 'id' | 'createdAt'>): Promise<Listing> {
  const page = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties: {
      'Title': { title: [{ text: { content: listing.title } }] },
      'Brand': { rich_text: [{ text: { content: listing.brand || '' } }] },
      'Category': { select: { name: listing.category } },
      'Condition': { select: { name: listing.condition } },
      'Age Range': { select: { name: listing.ageRange } },
      'Price': { number: listing.price },
      'Pricing Type': { select: { name: listing.pricingType } },
      'Description': { rich_text: [{ text: { content: listing.description || '' } }] },
      'Photos': { rich_text: [{ text: { content: listing.photos.join(',') } }] },
      'Original Image': { rich_text: [{ text: { content: listing.originalImage || '' } }] },
      'Location': { rich_text: [{ text: { content: listing.location || '' } }] },
      'WhatsApp': { rich_text: [{ text: { content: listing.whatsapp || '6591152527' } }] },
      'Archived': { checkbox: false },
    },
  });
  return pageToListing(page);
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  const properties: any = {};
  if (updates.title !== undefined) properties['Title'] = { title: [{ text: { content: updates.title } }] };
  if (updates.brand !== undefined) properties['Brand'] = { rich_text: [{ text: { content: updates.brand } }] };
  if (updates.category !== undefined) properties['Category'] = { select: { name: updates.category } };
  if (updates.condition !== undefined) properties['Condition'] = { select: { name: updates.condition } };
  if (updates.ageRange !== undefined) properties['Age Range'] = { select: { name: updates.ageRange } };
  if (updates.price !== undefined) properties['Price'] = { number: updates.price };
  if (updates.pricingType !== undefined) properties['Pricing Type'] = { select: { name: updates.pricingType } };
  if (updates.description !== undefined) properties['Description'] = { rich_text: [{ text: { content: updates.description } }] };
  if (updates.photos !== undefined) properties['Photos'] = { rich_text: [{ text: { content: updates.photos.join(',') } }] };
  if (updates.originalImage !== undefined) properties['Original Image'] = { rich_text: [{ text: { content: updates.originalImage } }] };
  if (updates.location !== undefined) properties['Location'] = { rich_text: [{ text: { content: updates.location } }] };

  const page = await notion.pages.update({ page_id: id, properties });
  return pageToListing(page);
}

export async function archiveListing(id: string): Promise<Listing | null> {
  const page = await notion.pages.retrieve({ page_id: id }) as any;
  const currentArchived = page.properties['Archived']?.checkbox || false;
  const updated = await notion.pages.update({
    page_id: id,
    properties: { 'Archived': { checkbox: !currentArchived } },
  });
  return pageToListing(updated);
}
