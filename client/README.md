 # GroLeadAI Client

This is the frontend application for GroLeadAI, built with React, TypeScript, and Vite.

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   ├── pages/         # Page components
│   ├── App.tsx        # Main application component
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles
└── index.html         # HTML entry point
```

## Key Features

- **Authentication**: Secure user authentication and session management
- **Dashboard**: Real-time analytics and lead scoring visualization
- **Lead Management**: Comprehensive lead tracking and scoring system
- **AI Integration**: AI-powered lead scoring and message suggestions
- **WhatsApp Integration**: Direct messaging through WhatsApp Business API
- **Reports**: Detailed analytics and performance metrics

## Technology Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query for server state
- **UI Components**: Custom components with Tailwind CSS
- **Charts**: Recharts for data visualization
- **API Integration**: Supabase for backend services

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the client directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

## Component Structure

### Pages
- `dashboard.tsx`: Main dashboard with analytics
- `leads.tsx`: Lead management interface
- `engage-leads.tsx`: Lead engagement tools
- `settings.tsx`: Application settings
- `reports.tsx`: Detailed reports and analytics

### Components
- **Dashboard**: Stats cards, charts, and analytics components
- **Leads**: Lead list, filters, and management tools
- **Engage**: Message composer and template management
- **Settings**: User preferences and configuration
- **Reports**: Various chart and data visualization components

## Development Guidelines

1. **Component Structure**:
   - Use functional components with TypeScript
   - Implement proper prop typing
   - Follow the established folder structure

2. **State Management**:
   - Use React Query for server state
   - Use React hooks for local state
   - Implement proper error handling

3. **Styling**:
   - Use Tailwind CSS for styling
   - Follow the established design system
   - Maintain responsive design

4. **Code Quality**:
   - Follow TypeScript best practices
   - Implement proper error boundaries
   - Write meaningful component documentation

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request
4. Ensure all tests pass
5. Update documentation as needed
