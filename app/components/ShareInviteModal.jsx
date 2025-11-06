import { useState, useEffect } from 'react';
import { Copy, X, Share2, MessageCircle, Mail, Twitter, Facebook, Link2, Check } from 'lucide-react';
import { useToast } from '../providers/ToastProvider';

export default function ShareInviteModal({ isOpen, onClose, communityId, communityName }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  
  // Generate the invite link
  const inviteLink = `${window.location.origin}/community/${communityId}?invite=true`;
  
  // Share text for messaging apps
  const shareText = `Join "${communityName}" on Send Train! ${inviteLink}`;

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      showToast('success', 'Copied!', 'Invite link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('error', 'Error', 'Failed to copy link');
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const shareViaSMS = () => {
    const url = `sms:?body=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const shareViaEmail = () => {
    const subject = `Join ${communityName} on Send Train`;
    const body = `Hi!\n\nI'd like to invite you to join "${communityName}" on Send Train.\n\n${shareText}`;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const shareViaTwitter = () => {
    const text = `Join "${communityName}" on Send Train! ${inviteLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;
    window.open(url, '_blank');
  };

  // Use Web Share API if available (mobile)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${communityName}`,
          text: shareText,
          url: inviteLink,
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copy if Web Share API not available
      copyToClipboard();
    }
  };

  if (!isOpen) return null;

  const shareOptions = [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: copied ? Check : Copy,
      onClick: copyToClipboard,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      onClick: shareViaWhatsApp,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'sms',
      label: 'Messages',
      icon: MessageCircle,
      onClick: shareViaSMS,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      onClick: shareViaEmail,
      color: 'bg-gray-700 hover:bg-gray-600'
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      onClick: shareViaTwitter,
      color: 'bg-blue-400 hover:bg-blue-500'
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      onClick: shareViaFacebook,
      color: 'bg-blue-700 hover:bg-blue-800'
    },
  ];

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4 animate-fade-in"
      style={{ animation: 'fadeInBackdrop 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUpModal 0.3s ease-out' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Share Invite Link</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Invite Link Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#087E8B] focus:border-transparent"
              />
              <button
                onClick={copyToClipboard}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300 mb-3">Share via:</p>
            
            {/* Native Share (Mobile) */}
            {navigator.share && (
              <button
                onClick={shareNative}
                className="w-full flex items-center gap-3 p-3 bg-[#087E8B] hover:bg-[#066a75] text-white rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </button>
            )}

            {/* Share Options Grid */}
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={option.onClick}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-colors text-white ${option.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Text */}
          <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400">
              Anyone with this link can join the community. Share it with climbers you'd like to invite!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

