import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Users, MapPin, Info, ArrowLeft, CheckCircle, AlertCircle, Building, ChevronDown, Lock, Globe } from 'lucide-react';
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
    rules: '',
    is_private: false
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
        rules: formData.rules.trim() || null,
        is_private: formData.is_private
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
                          rules: '',
                          is_private: false
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
          <div className="mb-6">
            <div className="text-center mb-2">
              <h1 className="minimal-heading text-2xl mb-2">Create Community</h1>
              <p className="mobile-text-sm text-gray-400">
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
                  <label className="relative cursor-pointer group">
                    <input
                      type="radio"
                      name="community_type"
                      value="gym"
                      checked={formData.community_type === 'gym'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.community_type === 'gym' 
                        ? 'bg-[#00d4ff]/15 border-[#00d4ff] shadow-lg shadow-[#00d4ff]/20' 
                        : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60 active:scale-[0.98]'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Building className={`w-5 h-5 transition-colors duration-200 ${
                          formData.community_type === 'gym' ? 'text-[#00d4ff]' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 transition-colors duration-200 ${
                            formData.community_type === 'gym' ? 'text-white' : 'text-gray-300'
                          }`}>
                            Gym Community
                          </div>
                          <div className={`text-xs transition-colors duration-200 ${
                            formData.community_type === 'gym' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Connected to a specific gym
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative cursor-pointer group">
                    <input
                      type="radio"
                      name="community_type"
                      value="general"
                      checked={formData.community_type === 'general'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.community_type === 'general' 
                        ? 'bg-[#00d4ff]/15 border-[#00d4ff] shadow-lg shadow-[#00d4ff]/20' 
                        : 'bg-gray-800/40 border-gray-700/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60 active:scale-[0.98]'
                    }`}>
                      <div className="flex items-center gap-3">
                        <Users className={`w-5 h-5 transition-colors duration-200 ${
                          formData.community_type === 'general' ? 'text-[#00d4ff]' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 transition-colors duration-200 ${
                            formData.community_type === 'general' ? 'text-white' : 'text-gray-300'
                          }`}>
                            General Community
                          </div>
                          <div className={`text-xs transition-colors duration-200 ${
                            formData.community_type === 'general' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Not connected to a specific gym
                          </div>
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
                    className={`minimal-input w-full text-left flex items-center justify-between transition-all duration-200 hover:border-gray-600 ${
                      errors.gym_id ? 'border-red-500' : ''
                    } ${selectedGym ? 'text-white' : 'text-gray-500'}`}
                  >
                    <span className="truncate flex-1 mr-2">
                      {selectedGym 
                        ? `${selectedGym.name} - ${selectedGym.city}, ${selectedGym.country}`
                        : 'Choose a gym'}
                    </span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      showGymSelector ? 'rotate-180' : ''
                    } ${errors.gym_id ? 'text-red-400' : 'text-gray-400'}`} />
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
                      className="text-xs text-gray-400 hover:text-gray-300 mt-2 transition-colors duration-200"
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
                  placeholder="Name your community"
                  maxLength={50}
                  className={`minimal-input w-full transition-all duration-200 ${
                    errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-[#00d4ff]'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.name ? (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Choose a clear, descriptive name
                    </p>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {formData.name.length}/50
                  </span>
                </div>
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
                  placeholder="Describe what this community is about and why you're here"
                  rows={5}
                  maxLength={500}
                  className={`minimal-input w-full resize-none transition-all duration-200 ${
                    errors.description ? 'border-red-500 focus:border-red-500' : 'focus:border-[#00d4ff]'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.description ? (
                    <p className="text-red-400 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">

                    </p>
                  )}
                  <span className="text-xs text-gray-500 ml-auto">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Community Rules */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  Community Rules <span className="text-gray-500 text-xs font-normal">(optional)</span>
                </label>
                <textarea
                  name="rules"
                  value={formData.rules}
                  onChange={handleInputChange}
                  placeholder="Set guidelines for community members."
                  rows={4}
                  maxLength={1000}
                  className="minimal-input w-full resize-none transition-all duration-200 focus:border-[#00d4ff]"
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">

                  </p>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formData.rules.length}/1000
                  </span>
                </div>
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4" />
                  Privacy Setting
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:border-gray-600 bg-gray-800/40 border-gray-700/50">
                    <input
                      type="radio"
                      name="is_private"
                      checked={!formData.is_private}
                      onChange={() => setFormData(prev => ({ ...prev, is_private: false }))}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg transition-colors duration-200 ${
                      !formData.is_private ? 'bg-[#00d4ff]/20' : 'bg-gray-700/50'
                    }`}>
                      <Globe className={`w-5 h-5 transition-colors duration-200 ${
                        !formData.is_private ? 'text-[#00d4ff]' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold mb-1 transition-colors duration-200 ${
                        !formData.is_private ? 'text-white' : 'text-gray-300'
                      }`}>
                        Public Community
                      </div>
                      <div className={`text-xs transition-colors duration-200 ${
                        !formData.is_private ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Anyone can find and join this community
                      </div>
                    </div>
                    {!formData.is_private && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-[#00d4ff] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:border-gray-600 bg-gray-800/40 border-gray-700/50">
                    <input
                      type="radio"
                      name="is_private"
                      checked={formData.is_private}
                      onChange={() => setFormData(prev => ({ ...prev, is_private: true }))}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg transition-colors duration-200 ${
                      formData.is_private ? 'bg-[#00d4ff]/20' : 'bg-gray-700/50'
                    }`}>
                      <Lock className={`w-5 h-5 transition-colors duration-200 ${
                        formData.is_private ? 'text-[#00d4ff]' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold mb-1 transition-colors duration-200 ${
                        formData.is_private ? 'text-white' : 'text-gray-300'
                      }`}>
                        Private Community
                      </div>
                      <div className={`text-xs transition-colors duration-200 ${
                        formData.is_private ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Only members can see and access this community. You can invite members manually.
                      </div>
                    </div>
                    {formData.is_private && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-[#00d4ff] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </label>
                </div>
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
          <div className="mobile-card p-5 mt-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#00d4ff]/20 flex-shrink-0">
                <Info className="w-5 h-5 text-[#00d4ff]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-2">Tips for Creating a Great Community</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00d4ff] mt-0.5">•</span>
                    <span>Choose a clear, descriptive name that reflects your community's purpose</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00d4ff] mt-0.5">•</span>
                    <span>Write a detailed description to help members understand what to expect</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00d4ff] mt-0.5">•</span>
                    <span>Set clear rules to maintain a positive environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00d4ff] mt-0.5">•</span>
                    <span>As the admin, you can moderate content and manage members</span>
                  </li>
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
