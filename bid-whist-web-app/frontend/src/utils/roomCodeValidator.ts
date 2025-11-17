/**
 * Sanitizes and validates room codes
 * Room codes are alphanumeric, 4-8 characters
 */

const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,8}$/;
const MAX_CODE_LENGTH = 8;

export const sanitizeRoomCode = (input: string): string => {
  if (!input) return '';
  
  // Remove all non-alphanumeric characters
  const sanitized = input.replace(/[^A-Za-z0-9]/g, '');
  
  // Convert to uppercase
  const uppercase = sanitized.toUpperCase();
  
  // Limit to max length
  return uppercase.slice(0, MAX_CODE_LENGTH);
};

export const isValidRoomCode = (code: string): boolean => {
  return ROOM_CODE_PATTERN.test(code);
};

export const validateRoomCode = (input: string): { valid: boolean; error?: string; code?: string } => {
  if (!input) {
    return { valid: false, error: 'Room code is required' };
  }
  
  const sanitized = sanitizeRoomCode(input);
  
  if (sanitized.length < 4) {
    return { valid: false, error: 'Room code must be at least 4 characters' };
  }
  
  if (!isValidRoomCode(sanitized)) {
    return { valid: false, error: 'Room code must contain only letters and numbers' };
  }
  
  return { valid: true, code: sanitized };
};
