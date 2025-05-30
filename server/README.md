# GroLeadAI Server

This is the backend server for GroLeadAI, built with Express.js and TypeScript, providing API endpoints for lead management, AI scoring, and WhatsApp integration.

## Project Structure

```
server/
├── migrations/        # Database migration files
├── ai.ts             # AI scoring and analysis logic
├── index.ts          # Server entry point
├── routes.ts         # API route definitions
├── schema.ts         # Database schema definitions
├── supabase.ts       # Supabase client configuration
├── vite.ts           # Vite development server configuration
└── whatsapp.ts       # WhatsApp Business API integration
```

## Key Features

- **AI Lead Scoring**: Intelligent lead analysis and scoring
- **WhatsApp Integration**: Direct messaging through WhatsApp Business API
- **Database Management**: Supabase integration for data persistence
- **API Endpoints**: RESTful API for client-server communication
- **Analytics**: Data processing for reporting and insights

## Technology Stack

- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI API
- **Messaging**: WhatsApp Business API
- **Authentication**: Supabase Auth

## API Endpoints

### WhatsApp
- `POST /api/whatsapp/send`: Send WhatsApp messages
- `POST /api/whatsapp/template`: Send WhatsApp template messages
- `GET /api/whatsapp/status/:messageId`: Check message status

### AI
- `POST /api/ai/suggest-template`: Get AI-suggested message templates
- `POST /api/ai/score-leads-batch`: Batch process lead scoring

### Analytics
- `GET /api/analytics`: Get analytics data for reports

## Database Schema

### Tables
- `leads`: Lead information and tracking
- `ai_scoring_results`: AI analysis results
- `message_templates`: Saved message templates
- `users`: User account information

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   OPENAI_API_KEY=your_openai_api_key
   WHATSAPP_TOKEN=your_whatsapp_token
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run migrate`: Run database migrations
- `npm run type-check`: Run TypeScript type checking

## Development Guidelines

1. **API Design**:
   - Follow RESTful principles
   - Implement proper error handling
   - Use TypeScript types for request/response

2. **Database**:
   - Use migrations for schema changes
   - Follow naming conventions
   - Implement proper indexing

3. **Security**:
   - Validate all input
   - Implement rate limiting
   - Use proper authentication
   - Secure sensitive data

4. **Error Handling**:
   - Use try-catch blocks
   - Log errors appropriately
   - Return meaningful error messages

## AI Integration

The server uses OpenAI's API for:
- Lead scoring and analysis
- Message template suggestions
- Best contact time predictions
- Action recommendations

## WhatsApp Integration

Features:
- Direct message sending
- Template message support
- Message status tracking
- Media attachment handling

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation as needed
