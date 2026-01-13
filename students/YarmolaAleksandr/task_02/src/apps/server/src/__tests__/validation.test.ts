import {
  validateEmail,
  validatePassword,
  validateTitle,
  validateContent,
  validateTagName,
  validatePagination
} from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
    });

    it('should reject short password', () => {
      const result = validatePassword('123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('6 characters');
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTitle', () => {
    it('should accept valid title', () => {
      const result = validateTitle('Valid Title');
      expect(result.valid).toBe(true);
    });

    it('should reject empty title', () => {
      const result = validateTitle('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should reject whitespace-only title', () => {
      const result = validateTitle('   ');
      expect(result.valid).toBe(false);
    });

    it('should reject too long title', () => {
      const longTitle = 'a'.repeat(201);
      const result = validateTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('200 characters');
    });

    it('should accept title at max length', () => {
      const maxTitle = 'a'.repeat(200);
      const result = validateTitle(maxTitle);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateContent', () => {
    it('should accept valid content', () => {
      const result = validateContent('Valid content text');
      expect(result.valid).toBe(true);
    });

    it('should reject empty content', () => {
      const result = validateContent('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should reject whitespace-only content', () => {
      const result = validateContent('   \n  \t  ');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTagName', () => {
    it('should accept valid tag name', () => {
      const result = validateTagName('JavaScript');
      expect(result.valid).toBe(true);
    });

    it('should reject empty tag name', () => {
      const result = validateTagName('');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('required');
    });

    it('should reject too long tag name', () => {
      const longTag = 'a'.repeat(51);
      const result = validateTagName(longTag);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('50 characters');
    });
  });

  describe('validatePagination', () => {
    it('should return defaults when no params provided', () => {
      const result = validatePagination();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(0);
    });

    it('should parse valid page and limit', () => {
      const result = validatePagination('2', '20');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20);
    });

    it('should handle invalid page number', () => {
      const result = validatePagination('invalid', '10');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle negative page', () => {
      const result = validatePagination('-1', '10');
      expect(result.page).toBe(1);
    });

    it('should cap limit at 100', () => {
      const result = validatePagination('1', '999');
      expect(result.limit).toBe(10);
    });

    it('should calculate skip correctly', () => {
      const result1 = validatePagination('1', '10');
      expect(result1.skip).toBe(0);

      const result2 = validatePagination('3', '15');
      expect(result2.skip).toBe(30);
    });
  });
});
