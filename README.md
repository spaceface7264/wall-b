# Climbing Community App

A modern community platform for climbers built with Vite, React, and Supabase.

## Features

- 🏘️ **Communities**: Join and participate in climbing communities
- 📝 **Posts**: Create and share posts with media support
- 💬 **Comments**: Engage in discussions with threaded comments
- 📅 **Events**: Create and RSVP to climbing events
- 🏋️ **Gyms**: Discover and review climbing gyms
- 💬 **Chat**: Real-time messaging system
- 👤 **Profiles**: Extended user profiles with climbing stats

## Tech Stack

- **Frontend**: Vite, React, React Router, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Styling**: Custom mobile-first design system
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env` or `.env.local` with your Supabase credentials and Google Places API key:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```
   
   See `.env.example` for all available environment variables.

3. **Set up database**:
   Run the SQL scripts in `sql-scripts/` folder in your Supabase SQL Editor:
   - `enhanced-community-schema.sql` - Main database schema
   - `profiles-schema.sql` - User profiles
   - `storage-setup.sql` - File storage setup
   - `direct-messages-schema.sql` - Messaging system
   - `notifications-schema.sql` - Notification system

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   The app will automatically open at `http://localhost:3000`

## Development & Deployment

📚 **For detailed setup instructions, see [DEPLOYMENT_SETUP.md](./DEPLOYMENT_SETUP.md)**

### Quick Start

**Local Development:**
```bash
npm run dev              # Start dev server (localhost:3000)
npm run dev:host         # Start dev server accessible on network
npm run build            # Build for production
npm run preview          # Preview production build locally
```

**Netlify Deployment:**
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploys automatically on git push

## Project Structure

```
app/
├── components/          # Reusable UI components
├── community/           # Community pages
├── gyms/               # Gym listing and details
├── profile/            # User profile management
├── chat/               # Messaging system
└── dashboard/          # Main dashboard

lib/                    # Utility functions and schemas
sql-scripts/           # Database setup scripts
types/                 # TypeScript type definitions
```

## Key Components

- **SidebarLayout**: Main app layout with navigation
- **CommunityCard**: Community listing cards
- **PostCard**: Individual post display
- **CommentThread**: Nested comment system
- **EventCard**: Event display and RSVP
- **CreatePostModal**: Post creation interface
- **CreateEventModal**: Event creation interface

## Database Schema

The app uses a comprehensive PostgreSQL schema with:
- User authentication and profiles
- Community management
- Posts and comments with threading
- Events and RSVPs
- Gym listings and reviews
- Direct messaging
- Notifications system
- File storage for media

## Gym Population System

The app includes a scraping system to populate gyms using Google Places API.

### Setup

1. **Get Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select existing one
   - Enable the following APIs:
     - Places API
     - Places API (New)
     - Geocoding API (optional, for address geocoding)
   - Create credentials (API Key)
   - Add the key to your `.env` file as `VITE_GOOGLE_PLACES_API_KEY`

2. **Run the Scraper**:
   ```bash
   node lib/scrape-danish-gyms.js
   ```
   
   This will:
   - Search for climbing gyms in Denmark using Google Places API
   - Create gym requests with status 'pending'
   - Skip duplicates (checks existing gyms and requests)

3. **Review and Approve**:
   - Go to Admin Panel → Requests tab
   - Review scraped gym requests
   - Use bulk approve to approve multiple requests at once
   - Or approve/reject individually

### Scraping Configuration

Edit `lib/config-scraper.js` to:
- Change cities to search
- Modify search queries
- Adjust rate limiting settings

### Rate Limits

Google Places API limits:
- 10 requests per second
- 40,000 requests per day (on free tier)

The scraper automatically implements rate limiting with delays between requests.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details