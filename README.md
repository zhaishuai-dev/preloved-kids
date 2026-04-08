# 🧸 Preloved Kids

A simple marketplace for quality second-hand kids items. Built with Next.js, Cloudinary, and Claude AI.

## Features

- **Browse listings** — cards with photos, pricing, condition, brand, age range
- **AI-powered listing** — upload a photo, Claude identifies the product and fills in details
- **Seller mode** — PIN-protected access to create, edit, archive listings
- **WhatsApp contact** — buyers message you directly
- **Image hosting** — Cloudinary for persistent image storage
- **JSON storage** — simple file-based database (no external DB needed)

## Setup

### 1. Clone and install
```bash
git clone <your-repo>
cd preloved-kids
npm install
```

### 2. Create `.env.local`
```bash
cp .env.local.example .env.local
```

Fill in your keys:
- **Cloudinary**: Sign up at https://console.cloudinary.com (free tier)
- **Anthropic**: Get API key from https://console.anthropic.com
- **SELLER_PIN**: Choose your own 4-digit PIN

### 3. Run locally
```bash
npm run dev
```

Open http://localhost:3000

### 4. Deploy to Vercel
```bash
npx vercel
```

Add environment variables in Vercel dashboard → Settings → Environment Variables.

> **Note**: The JSON file storage works on Vercel but resets on each deployment. For persistent storage, migrate to Notion DB or Supabase later.

## Project Structure

```
preloved-kids/
├── app/
│   ├── api/
│   │   ├── listings/route.ts   # CRUD for listings
│   │   └── upload/route.ts     # Image upload + AI
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── PrelovedApp.tsx         # Main client component
├── data/
│   └── listings.json           # Listings database
├── lib/
│   ├── ai.ts                   # Claude AI recognition
│   ├── cloudinary.ts           # Image upload
│   └── listings.ts             # JSON read/write
└── .env.local.example
```

## Seller Mode

Tap the 🧸 logo → enter PIN → unlocks:
- ✨ List Item button
- ✏️ Edit listings
- 📦 Archive/restore
- Active/Archived toggle

Public visitors only see active listings with WhatsApp contact.
