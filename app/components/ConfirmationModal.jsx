import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  icon: Icon = null,
  variant = 'default' // 'default', 'danger', 'warning'
}) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/20',
          iconColor: 'text-red-500',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-500/20',
          iconColor: 'text-yellow-500',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: 'text-white'
        };
      default:
        return {
          iconBg: 'bg-[#087E8B]/20',
          iconColor: 'text-[#087E8B]',
          confirmBg: 'bg-[#087E8B] hover:bg-[#066a75]',
          confirmText: 'text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="confirmation-modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="confirmation-modal">
        {/* Icon */}
        {Icon && (
          <div className={`confirmation-modal-icon ${styles.iconBg} ${styles.iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        
        {/* Title */}
        <div className="confirmation-modal-title">
          {title}
        </div>
        
        {/* Message */}
        <div className="confirmation-modal-message">
          {typeof message === 'string' ? message : String(message)}
        </div>
        
        {/* Buttons */}
        <div className="confirmation-modal-actions">
          <button
            onClick={onClose}
            className="confirmation-modal-btn-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`confirmation-modal-btn-confirm ${styles.confirmBg} ${styles.confirmText}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

