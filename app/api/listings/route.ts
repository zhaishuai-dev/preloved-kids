import { NextRequest, NextResponse } from 'next/server';
import { getListings, addListing, updateListing, archiveListing } from '@/lib/listings';

export const maxDuration = 30;

// GET /api/listings?archived=false
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get('archived') === 'true';
  const pin = req.headers.get('x-seller-pin');
  const isAuthed = pin === process.env.SELLER_PIN;

  let listings = await getListings();
  if (!showArchived || !isAuthed) {
    listings = listings.filter((l) => !l.archived);
  }

  return NextResponse.json({ listings }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}

// POST /api/listings - create new listing
export async function POST(req: NextRequest) {
  const pin = req.headers.get('x-seller-pin');
  if (pin !== process.env.SELLER_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const listing = await addListing({
    title: body.title || '',
    brand: body.brand || '',
    category: body.category || 'Others',
    condition: body.condition || 'Good',
    ageRange: body.ageRange || '3-6y',
    price: Number(body.price) || 0,
    pricingType: body.pricingType || 'fixed',
    description: body.description || '',
    originalImage: body.originalImage || '',
    photos: body.photos || [],
    seller: 'Seller',
    location: body.location || '',
    whatsapp: body.whatsapp || '6591152527',
    archived: false,
  });

  return NextResponse.json({ listing }, { status: 201 });
}

// PATCH /api/listings - update or archive
export async function PATCH(req: NextRequest) {
  const pin = req.headers.get('x-seller-pin');
  if (pin !== process.env.SELLER_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, action, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  let listing;
  if (action === 'archive') {
    listing = await archiveListing(id);
  } else {
    listing = await updateListing(id, updates);
  }

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ listing });
}
