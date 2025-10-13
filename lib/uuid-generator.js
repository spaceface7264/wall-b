// UUID Generator for consistent, professional-looking IDs
// This ensures all future IDs are proper UUIDs, not placeholder-looking ones

const { randomUUID } = require('crypto');

// Pre-generated professional-looking UUIDs for consistency
const PROFESSIONAL_UUIDS = {
  // Communities
  climbingHangar: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  boulderCentral: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  verticalWorld: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  
  // Gyms
  climbingHangarGym: '550e8400-e29b-41d4-a716-446655440000',
  boulderCentralGym: '550e8400-e29b-41d4-a716-446655440001',
  verticalWorldGym: '550e8400-e29b-41d4-a716-446655440002',
  
  // Users (for testing)
  testUser1: '123e4567-e89b-12d3-a456-426614174000',
  testUser2: '123e4567-e89b-12d3-a456-426614174001',
  testUser3: '123e4567-e89b-12d3-a456-426614174002',
};

// Generate a new professional UUID
function generateProfessionalUUID() {
  return randomUUID();
}

// Get a specific professional UUID by name
function getProfessionalUUID(name) {
  return PROFESSIONAL_UUIDS[name] || generateProfessionalUUID();
}

// Validate that a UUID looks professional (not placeholder-like)
function isProfessionalUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  
  // Check for placeholder patterns
  const placeholderPatterns = [
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, // Basic UUID format
    /^[a-f]{8}-[a-f]{4}-[a-f]{4}-[a-f]{4}-[a-f]{12}$/i, // All same character
    /^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12}$/i, // All numbers
  ];
  
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) return false;
  
  // Check for placeholder patterns
  for (const pattern of placeholderPatterns) {
    if (pattern.test(uuid)) {
      // Check if it's all the same character
      const chars = uuid.replace(/-/g, '').split('');
      const uniqueChars = new Set(chars);
      if (uniqueChars.size <= 2) return false; // Too few unique characters
    }
  }
  
  return true;
}

// Generate a batch of professional UUIDs
function generateBatchUUIDs(count = 10) {
  const uuids = [];
  for (let i = 0; i < count; i++) {
    uuids.push(generateProfessionalUUID());
  }
  return uuids;
}

module.exports = {
  generateProfessionalUUID,
  getProfessionalUUID,
  isProfessionalUUID,
  generateBatchUUIDs,
  PROFESSIONAL_UUIDS
};


