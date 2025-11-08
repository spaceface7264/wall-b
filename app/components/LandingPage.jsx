import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Image, 
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import StarfieldBackground from './StarfieldBackground';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in, redirect to home page
        navigate('/home');
      }
    };
    checkSession();
  }, [navigate]);

  const features = [
    {
      icon: Users,
      title: 'Join Communities',
      description: 'Connect with climbers at your gym or join general climbing communities'
    },
    {
      icon: MessageSquare,
      title: 'Share & Discuss',
      description: 'Post beta, share training tips, and engage in meaningful conversations'
    },
    {
      icon: Calendar,
      title: 'Events & RSVPs',
      description: 'Create and join climbing events, meetups, and training sessions'
    },
    {
      icon: MapPin,
      title: 'Discover Gyms',
      description: 'Find and review climbing gyms near you'
    },
    {
      icon: Image,
      title: 'Rich Media',
      description: 'Share photos and videos of your sends and projects'
    },
    {
      icon: Sparkles,
      title: 'Real-time Chat',
      description: 'Message other climbers and stay connected'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <StarfieldBackground />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Send Train
            </h1>
            <p className="text-xl md:text-2xl font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
              Bouldering Community
            </p>
            <p className="text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
              Connect. Climb. Send.
            </p>
          </div>

          {/* Main CTA */}
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <p className="text-lg md:text-xl mb-8" style={{ color: 'var(--text-secondary)' }}>
              Join a community of climbers sharing beta, organizing events, and pushing limits together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/login')}
                className="mobile-btn-primary text-lg px-8 py-4 flex items-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/communities')}
                className="mobile-btn-secondary text-lg px-8 py-4 flex items-center gap-2"
              >
                Explore Communities
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything You Need
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              A complete platform built for the climbing community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="mobile-card animate-slide-up"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: 'var(--accent-primary-lighter)',
                        color: 'var(--accent-primary)'
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mobile-subheading mb-2" style={{ color: 'var(--text-primary)' }}>
                        {feature.title}
                      </h3>
                      <p className="mobile-text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mobile-card text-center p-8 md:p-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Ready to Start Climbing?
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of climbers sharing their journey, discovering new routes, and building lasting connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="mobile-btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2 group"
              >
                Create Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/communities')}
                className="mobile-btn-secondary text-lg px-8 py-4"
              >
                Browse Without Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t" style={{ borderColor: 'var(--divider-color)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="mobile-text-sm" style={{ color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Send Train. Built for climbers, by climbers.
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => navigate('/terms')}
                className="mobile-text-sm hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                Terms & Conditions
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

