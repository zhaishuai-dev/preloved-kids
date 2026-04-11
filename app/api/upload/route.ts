import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;
import { uploadImage } from '@/lib/cloudinary';
import { recognizeProduct } from '@/lib/ai';

// POST /api/upload
// Body: { image: base64string, mediaType: "image/jpeg", analyze?: boolean }
export async function POST(req: NextRequest) {
  const pin = req.headers.get('x-seller-pin');
  if (pin !== process.env.SELLER_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { image, mediaType, analyze } = body;

    if (!image || !mediaType) {
      return NextResponse.json({ error: 'Missing image or mediaType' }, { status: 400 });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadImage(image, mediaType);

    // Optionally run AI recognition
    let aiResult = null;
    if (analyze) {
      aiResult = await recognizeProduct(image, mediaType);
    }

    return NextResponse.json({
      imageUrl,
      aiResult,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
