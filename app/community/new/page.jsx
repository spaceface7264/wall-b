import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Users, MapPin, Info, ArrowLeft, CheckCircle, AlertCircle, Building, ChevronDown } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import FormSkeleton from '../../components/FormSkeleton';
import GymSelectorModal from '../../components/GymSelectorModal';
import { useToast } from '../../providers/ToastProvider';

export default function CreateCommunityPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gyms, setGyms] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [showGymSelector, setShowGymSelector] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    community_type: 'gym',
    gym_id: '',
    rules: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await loadGyms();
          
          // Check if gym_id is in URL params and pre-fill the form
          const gymIdFromUrl = searchParams.get('gym_id');
          if (gymIdFromUrl) {
            setFormData(prev => ({
              ...prev,
              gym_id: gymIdFromUrl,
              community_type: 'gym'
            }));
            // Load the gym details
            const { data: gymData } = await supabase
              .from('gyms')
              .select('id, name, city, country')
              .eq('id', gymIdFromUrl)
              .single();
            if (gymData) {
              setSelectedGym(gymData);
            }
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [searchParams]);

  const loadGyms = async () => {
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, name, city, country')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading gyms:', error);
        return;
      }

      setGyms(data || []);
    } catch (error) {
      console.error('Error loading gyms:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGymSelect = async (gymId) => {
    setFormData(prev => ({
      ...prev,
      gym_id: gymId
    }));
    
    // Load gym details for display
    const { data: gymData } = await supabase
      .from('gyms')
      .select('id, name, city, country')
      .eq('id', gymId)
      .single();
    
    if (gymData) {
      setSelectedGym(gymData);
    }
    
    // Clear error if any
    if (errors.gym_id) {
      setErrors(prev => ({
        ...prev,
        gym_id: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.community_type === 'gym' && !formData.gym_id) {
      newErrors.gym_id = 'Please select a gym for gym communities';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to create a community');
      return;
    }

    if (!validateForm()) {
      showToast('error', 'Validation Error', 'Please fix the errors below');
      return;
    }

    setSubmitting(true);
    try {
      const communityData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        community_type: formData.community_type,
        rules: formData.rules.trim() || null
      };

      // Only add gym_id if it's a gym community
      if (formData.community_type === 'gym') {
        communityData.gym_id = formData.gym_id;
      }

      const { data, error } = await supabase
        .from('communities')
        .insert(communityData)
        .select()
        .single();

      if (error) {
        console.error('Error creating community:', error);
        showToast('error', 'Error', 'Failed to create community. Please try again.');
        return;
      }

      // Join the community as the creator
      const { error: joinError } = await supabase
        .from('community_members')
        .insert({
          community_id: data.id,
          user_id: user.id,
          role: 'admin'
        });

      if (joinError) {
        console.error('Error joining community:', joinError);
        // Don't fail the whole operation for this
      }

      showToast('success', 'Community Created!', 'Your community has been created successfully!');
      
      // Wait a moment for database to be ready, then navigate to the newly created community
      // This prevents race condition where community page tries to load before data is available
      setTimeout(() => {
        navigate(`/community/${data.id}`);
      }, 500);
    } catch (error) {
      console.error('Error creating community:', error);
      showToast('error', 'Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="mobile-section">
            <FormSkeleton fieldCount={5} />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (submitted) {
    return (
      <SidebarLayout currentPage="community">
        <div className="mobile-container">
          <div className="mobile-section">
            {/* Success Message */}
            <div className="mobile-card animate-fade-in">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h1 className="mobile-card-title text-2xl mb-2">Community Created!</h1>
                  <p className="mobile-text-sm text-gray-300 mb-6">
                    Your community has been created successfully. You are now the admin of this community.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/communities')}
                      className="mobile-btn-primary w-full"
                    >
                      Back to Communities
                    </button>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          description: '',
                          community_type: 'gym',
                          gym_id: '',
                          rules: ''
                        });
                        setErrors({});
                      }}
                      className="mobile-btn-secondary w-full"
                    >
                      Create Another Community
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout currentPage="community" pageTitle="Create Community">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header */}
          <div className="mobile-card animate-fade-in mb-6">
            <div className="minimal-flex-between items-center mb-4">
              <button
                onClick={() => navigate(-1)}
                className="mobile-btn-secondary minimal-flex gap-2"
              >
                <ArrowLeft className="minimal-icon" />
                Back
              </button>
            </div>
            
            <div className="text-center">
              <p className="mobile-text-sm text-gray-300">
                Start a new community for climbers to connect and share experiences
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mobile-card animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Community Type */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  Community Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`relative cursor-pointer ${formData.community_type === 'gym' ? 'border-2 border-[#087E8B]' : ''}`}>
                    <input
                      type="radio"
                      name="community_type"
                      value="gym"
                      checked={formData.community_type === 'gym'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded border transition-colors ${
                      formData.community_type === 'gym' 
                        ? 'bg-[#087E8B]/10 border-[#087E8B] text-[#087E8B]' 
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5" />
                        <div>
                          <div className="font-medium">Gym Community</div>
                          <div className="text-sm opacity-75">Connected to a specific gym</div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className={`relative cursor-pointer ${formData.community_type === 'general' ? 'border-2 border-[#087E8B]' : ''}`}>
                    <input
                      type="radio"
                      name="community_type"
                      value="general"
                      checked={formData.community_type === 'general'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded border transition-colors ${
                      formData.community_type === 'general' 
                        ? 'bg-[#087E8B]/10 border-[#087E8B] text-[#087E8B]' 
                        : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        <div>
                          <div className="font-medium">General Community</div>
                          <div className="text-sm opacity-75">Open to all climbers</div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Gym Selection (only for gym communities) */}
              {formData.community_type === 'gym' && (
                <div>
                  <label className="minimal-label flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Select Gym *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGymSelector(true)}
                    className={`minimal-input w-full text-left flex items-center justify-between ${
                      errors.gym_id ? 'border-red-500' : ''
                    } ${selectedGym ? '' : 'text-gray-500'}`}
                  >
                    <span>
                      {selectedGym 
                        ? `${selectedGym.name} - ${selectedGym.city}, ${selectedGym.country}`
                        : 'Choose a gym'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                  {errors.gym_id && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gym_id}
                    </p>
                  )}
                  {selectedGym && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGym(null);
                        setFormData(prev => ({ ...prev, gym_id: '' }));
                      }}
                      className="text-xs text-gray-400 hover:text-gray-300 mt-1"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              {/* Community Name */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" />
                  Community Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter community name"
                  className={`minimal-input w-full ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this community is about..."
                  rows={4}
                  className={`minimal-input w-full resize-none ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Community Rules */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  Community Rules
                </label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Set guidelines for community members (optional)"
                  rows={3}
                  className="minimal-input w-full resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="mobile-btn-primary w-full minimal-flex gap-2 justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="minimal-icon" />
                      Create Community
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="mobile-card-flat p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">Community Guidelines</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Be respectful and inclusive to all members</li>
                  <li>• Keep discussions relevant to climbing and the community</li>
                  <li>• No spam or self-promotion without permission</li>
                  <li>• You will be the admin and can moderate content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Selector Modal */}
      <GymSelectorModal
        isOpen={showGymSelector}
        onClose={() => setShowGymSelector(false)}
        selectedGymId={formData.gym_id}
        onSelectGym={handleGymSelect}
      />
    </SidebarLayout>
  );
}
