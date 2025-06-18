# GroLeadAI

A full-stack web application built with React, Express, and TypeScript for managing and automating business communications.

## 📖 Overview

### What is Gromo?
Gromo is a fintech distribution platform that enables individuals to earn by selling financial products like insurance, loans, and investment plans—without needing to be financial experts. Think of it as a "Shopify for financial agents."

Gromo empowers agents (called "advisors") with tools to:
- Discover and compare financial products
- Share and recommend offerings to customers
- Track earnings and performance
- Learn and upskill with training resources

### What is Grolead AI?
Grolead AI is an intelligent, no-auth, frontend-only system built to supercharge lead management for Gromo advisors. It uses AI to score, analyze, and recommend actions for each lead—making follow-ups smarter and faster.

## 🎯 Problem & Solution

### Challenges Faced by Advisors
- Hundreds of unstructured leads
- Uncertainty over whom to follow up with first
- Lack of personalization in outreach
- Wasted time on low-quality leads

### How Grolead AI Solves These Issues
- Automatically scoring leads
- Providing clear reasons for each score
- Suggesting personalized follow-up actions
- Highlighting risks and conversion probabilities

## ✨ Key Features

### Lead Scoring & Analysis
- Instant AI Scoring (0-100)
- Priority Labels: "High", "Medium", "Low", or "Very Low"
- Clear Explanation of Scores
- Conversion Probability Prediction
- Risk Flag Identification

### Smart Communication
- Action Recommendations
- Best Contact Time Prediction
- Smart Message Templates
- WhatsApp Integration
- Custom Follow-up Scripts

### Lead Insights
- Enriched Lead Data
- Inferred Demographics
- Behavior Tags
- Response Probability

## 🛠️ Technical Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Radix UI Components
- React Query
- Wouter for routing
- Framer Motion for animations

### Backend
- Express.js
- TypeScript
- Drizzle ORM
- Supabase
- WebSocket support
- Passport.js for authentication

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn
- PostgreSQL database
- Supabase account
- WhatsApp Business API access

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd GroLeadAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
# === OPENAI GPT-4 mini ===
OPENAI_API_KEY=
OPENAI_MODEL=

# === ultramsg.com WhatsApp Messaging API ===
WHATSAPP_API_URL=
WHATSAPP_INSRANCE_ID=
WHATSAPP_API_TOKEN=

# === Supabase for Authentication & User Management ===
SUPABASE_ANON_KEY=
SUPABASE_URL=
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database migrations

## 📁 Project Structure

```
├── client/             # Frontend React application
│   ├── src/           # Source files
│   └── index.html     # Entry HTML file
├── server/            # Backend Express application
│   ├── migrations/    # Database migrations
│   ├── ai.ts         # AI-related functionality
│   ├── routes.ts     # API routes
│   └── schema.ts     # Database schema
├── shared/           # Shared types and utilities
├── drizzle/         # Drizzle ORM configuration
└── package.json     # Project dependencies and scripts
```

## 🔒 Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL database connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `WHATSAPP_API_KEY`: ultramsg.com WhatsApp API key

## 📼Prototype Demo Video

```
https://drive.google.com/file/d/1_SfGJmUOtptUEieUH48drQ8EIc1aXre3/view?usp=sharing
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- Shashank N & Shabarish H C

## 🙏 Acknowledgments

- Special thanks to the open-source community for the amazing tools and libraries 
