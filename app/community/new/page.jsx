'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Users, MapPin, Info, ArrowLeft, CheckCircle, AlertCircle, Building } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import { useToast } from '../../providers/ToastProvider';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateCommunityPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gyms, setGyms] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
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
          loadGyms();
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

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

      setSubmitted(true);
      showToast('success', 'Community Created!', 'Your community has been created successfully!');
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
            <div className="mobile-card animate-fade-in">
              <div className="minimal-flex-center py-8">
                <div className="minimal-spinner"></div>
                <p className="minimal-text ml-3">Loading...</p>
              </div>
            </div>
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
            <div className="mobile-card animate-fade-in mb-6">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h1 className="mobile-card-title text-2xl mb-2">Community Created!</h1>
                  <p className="mobile-text-sm text-gray-300 mb-6">
                    Your community has been created successfully. You are now the admin of this community.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/community')}
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
    <SidebarLayout currentPage="community">
      <div className="mobile-container">
        <div className="mobile-section">
          {/* Header */}
          <div className="mobile-card animate-fade-in mb-6">
            <div className="minimal-flex-between items-center mb-4">
              <button
                onClick={() => router.back()}
                className="mobile-btn-secondary minimal-flex gap-2"
              >
                <ArrowLeft className="minimal-icon" />
                Back
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="mobile-card-title text-2xl mb-2">Create Community</h1>
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
                  <label className={`relative cursor-pointer ${formData.community_type === 'gym' ? 'ring-2 ring-indigo-500' : ''}`}>
                    <input
                      type="radio"
                      name="community_type"
                      value="gym"
                      checked={formData.community_type === 'gym'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border transition-colors ${
                      formData.community_type === 'gym' 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' 
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

                  <label className={`relative cursor-pointer ${formData.community_type === 'general' ? 'ring-2 ring-indigo-500' : ''}`}>
                    <input
                      type="radio"
                      name="community_type"
                      value="general"
                      checked={formData.community_type === 'general'}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border transition-colors ${
                      formData.community_type === 'general' 
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' 
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
                  <select
                    name="gym_id"
                    value={formData.gym_id}
                    onChange={handleInputChange}
                    className={`minimal-input w-full ${errors.gym_id ? 'border-red-500' : ''}`}
                  >
                    <option value="">Choose a gym</option>
                    {gyms.map(gym => (
                      <option key={gym.id} value={gym.id}>
                        {gym.name} - {gym.city}, {gym.country}
                      </option>
                    ))}
                  </select>
                  {errors.gym_id && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.gym_id}
                    </p>
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
    </SidebarLayout>
  );
}
