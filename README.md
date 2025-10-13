# Climbing Community App

A modern community platform for climbers built with Next.js and Supabase.

## Features

- 🏘️ **Communities**: Join and participate in climbing communities
- 📝 **Posts**: Create and share posts with media support
- 💬 **Comments**: Engage in discussions with threaded comments
- 📅 **Events**: Create and RSVP to climbing events
- 🏋️ **Gyms**: Discover and review climbing gyms
- 💬 **Chat**: Real-time messaging system
- 👤 **Profiles**: Extended user profiles with climbing stats

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Styling**: Custom mobile-first design system
- **Icons**: Lucide React

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

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
   Navigate to `http://localhost:3000`

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details