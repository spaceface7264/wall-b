# 🧗‍♀️ Wall-B

**Wall-B** is a modern, mobile-first web application for the bouldering community featuring real-time chat, community posts, gym database, and user profiles.

*Your bouldering community hub* 🎯

## ✨ Features

### 🏠 **Dashboard**
- Clean, mobile-optimized interface
- Quick access to all features
- User authentication with Supabase

### 💬 **Real-time Chat**
- Live messaging with other users
- Real-time updates using Supabase
- Mobile-optimized chat interface

### 👥 **Community**
- Create and share posts with titles and content
- Like and comment system
- Real-time updates
- Mobile-first design

### 🏢 **Gyms Database**
- Comprehensive database of bouldering gyms
- Search and filter by country/city
- Detailed gym information including:
  - Contact details and websites
  - Opening hours
  - Facilities and amenities
  - Price ranges and difficulty levels
  - Wall heights and boulder counts

### 👤 **User Profiles**
- Avatar upload with Supabase Storage
- Profile information management
- Persistent user data

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.4, React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Styling**: Tailwind CSS with custom mobile-first design
- **Icons**: Lucide React
- **TypeScript**: Type checking and better development experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd proj
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase database**
   - Run the community schema: `lib/community-schema.sql`
   - Run the gyms schema: `lib/gyms-schema.sql`
   - Enable real-time for all tables
   - Create a public `avatars` storage bucket

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Mobile-First Design

The app is designed with mobile users in mind:
- Touch-friendly interface
- Optimized for small screens
- Bottom navigation for easy thumb access
- Responsive design that works on all devices

## 🗄️ Database Schema

### Community Tables
- `posts` - Community posts with likes and comments
- `comments` - Comments on posts
- `likes` - Likes on posts and comments

### Gyms Tables
- `gyms` - Gym information and details
- `gym_images` - Multiple images per gym
- `gym_reviews` - User reviews and ratings

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
proj/
├── app/
│   ├── components/
│   │   └── SidebarLayout.jsx    # Main layout component
│   ├── chat/
│   │   └── page.jsx             # Real-time chat
│   ├── community/
│   │   └── page.jsx             # Community posts
│   ├── gyms/
│   │   └── page.jsx             # Gyms database
│   ├── profile/
│   │   └── page.jsx             # User profile
│   ├── dashboard/
│   │   └── page.jsx             # Main dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/
│   ├── community-schema.sql     # Community database schema
│   └── gyms-schema.sql          # Gyms database schema
├── types/
│   └── supabase.ts              # TypeScript types
└── README.md
```

## 🎨 Design System

The app uses a custom design system optimized for mobile:
- **Colors**: Dark theme with indigo accents
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent mobile-friendly spacing
- **Components**: Reusable, touch-friendly components

## 🔐 Authentication

- Supabase Auth integration
- Email/password authentication
- Protected routes
- User session management

## 📊 Real-time Features

- Live chat messaging
- Real-time post updates
- Live like and comment counts
- Real-time user presence

## 🚀 Deployment

The app is ready for deployment on:
- Vercel (recommended)
- Netlify
- Any Node.js hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first styling
- Lucide for the beautiful icons

---

**Happy Climbing! 🧗‍♀️🧗‍♂️**
