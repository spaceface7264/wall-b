'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { MapPin, Phone, Mail, Globe, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import SidebarLayout from '../../components/SidebarLayout';
import { useToast } from '../../providers/ToastProvider';

const countries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Spain', 'Italy',
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria', 'Belgium',
  'Poland', 'Czech Republic', 'Hungary', 'Portugal', 'Greece', 'Ireland', 'New Zealand', 'Japan',
  'South Korea', 'Singapore', 'Hong Kong', 'Other'
];

export default function GymRequestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    gym_name: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, []);

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

    if (!formData.gym_name.trim()) {
      newErrors.gym_name = 'Gym name is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      showToast('error', 'Login Required', 'Please log in to submit a gym request');
      return;
    }

    if (!validateForm()) {
      showToast('error', 'Validation Error', 'Please fix the errors below');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('gym_requests')
        .insert({
          user_id: user.id,
          gym_name: formData.gym_name.trim(),
          country: formData.country,
          city: formData.city.trim(),
          address: formData.address.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          description: formData.description.trim() || null
        });

      if (error) {
        console.error('Error submitting gym request:', error);
        showToast('error', 'Error', 'Failed to submit gym request. Please try again.');
        return;
      }

      setSubmitted(true);
      showToast('success', 'Request Submitted!', 'We\'ll review your request and add the gym soon!');
    } catch (error) {
      console.error('Error submitting gym request:', error);
      showToast('error', 'Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout currentPage="gyms">
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
      <SidebarLayout currentPage="gyms">
        <div className="mobile-container">
          <div className="mobile-section">
            {/* Success Message */}
            <div className="mobile-card animate-fade-in mb-6">
              <div className="minimal-flex-center py-8">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h1 className="mobile-card-title text-2xl mb-2">Request Submitted!</h1>
                  <p className="mobile-text-sm text-gray-300 mb-6">
                    Thank you for your submission. We'll review your gym request and add it to our database soon.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/gyms')}
                      className="mobile-btn-primary w-full"
                    >
                      Back to Gyms
                    </button>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          gym_name: '',
                          country: '',
                          city: '',
                          address: '',
                          phone: '',
                          email: '',
                          website: '',
                          description: ''
                        });
                        setErrors({});
                      }}
                      className="mobile-btn-secondary w-full"
                    >
                      Submit Another Request
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
    <SidebarLayout currentPage="gyms">
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
              <h1 className="mobile-card-title text-2xl mb-2">Request a Gym</h1>
              <p className="mobile-text-sm text-gray-300">
                Is your gym missing from our database? Let us know and we'll add it!
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mobile-card animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Gym Name */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Gym Name *
                </label>
                <input
                  type="text"
                  name="gym_name"
                  value={formData.gym_name}
                  onChange={handleInputChange}
                  placeholder="Enter the gym name"
                  className={`minimal-input w-full ${errors.gym_name ? 'border-red-500' : ''}`}
                />
                {errors.gym_name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.gym_name}
                  </p>
                )}
              </div>

              {/* Country and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="minimal-label flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`minimal-input w-full ${errors.country ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.country}
                    </p>
                  )}
                </div>

                <div>
                  <label className="minimal-label flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter the city"
                    className={`minimal-input w-full ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.city}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter the full address (optional)"
                  className="minimal-input w-full"
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="minimal-label flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number (optional)"
                    className="minimal-input w-full"
                  />
                </div>

                <div>
                  <label className="minimal-label flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address (optional)"
                    className={`minimal-input w-full ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com (optional)"
                  className={`minimal-input w-full ${errors.website ? 'border-red-500' : ''}`}
                />
                {errors.website && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.website}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="minimal-label flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about this gym - facilities, specialties, etc. (optional)"
                  rows={4}
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="minimal-icon" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="mobile-card-flat p-4 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-white mb-1">What happens next?</h4>
                <p className="text-sm text-gray-300">
                  We'll review your request and add the gym to our database if it meets our criteria. 
                  You'll be notified once it's been added!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
