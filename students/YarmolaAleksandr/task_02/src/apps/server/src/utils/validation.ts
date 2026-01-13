// Утилиты для валидации входных данных
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
};

export const validateTitle = (title: string): { valid: boolean; message?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: 'Title is required' };
  }
  if (title.length > 200) {
    return { valid: false, message: 'Title must be less than 200 characters' };
  }
  return { valid: true };
};

export const validateContent = (content: string): { valid: boolean; message?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: 'Content is required' };
  }
  return { valid: true };
};

export const validateTagName = (name: string): { valid: boolean; message?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Tag name is required' };
  }
  if (name.length > 50) {
    return { valid: false, message: 'Tag name must be less than 50 characters' };
  }
  return { valid: true };
};

export const validatePagination = (page?: string, limit?: string) => {
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '10', 10);
  
  return {
    page: isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
    limit: isNaN(limitNum) || limitNum < 1 || limitNum > 100 ? 10 : limitNum,
    skip: (pageNum - 1) * limitNum,
  };
};
