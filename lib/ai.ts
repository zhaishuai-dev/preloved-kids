import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AIProductResult {
  title: string;
  brand: string;
  category: string;
  condition: string;
  ageRange: string;
  description: string;
  suggestedPrice: number;
}

export async function recognizeProduct(
  imageUrl: string,
): Promise<AIProductResult | null> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: `You are a product listing assistant for a kids' second-hand marketplace in Singapore. Analyze this photo and return ONLY a JSON object (no markdown, no backticks, no preamble):
{
  "title": "Product name with brand if identifiable",
  "brand": "Brand name if identifiable, empty string if not sure",
  "category": one of "Toys", "Books", "Clothes", "Gear", "Others",
  "condition": estimate from photo, one of "Like New", "Good", "Fair",
  "ageRange": one of "0-1y", "1-3y", "3-6y", "6-9y", "9-12y",
  "description": "2-3 sentence description noting brand, key features, and visible condition. Be honest about wear.",
  "suggestedPrice": number in SGD (0 if should be free, otherwise fair second-hand price)
}
Be specific with product identification. If you can identify the exact product/model, include it.`,
            },
          ],
        },
      ],
    });

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as AIProductResult;
  } catch (err) {
    console.error('AI recognition error:', err);
    return null;
  }
}
