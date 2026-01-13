export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Пароль должен быть не менее 6 символов' };
  }
  return { valid: true };
};

export const validateTitle = (title: string): { valid: boolean; message?: string } => {
  if (!title || title.trim().length === 0) {
    return { valid: false, message: 'Заголовок обязателен' };
  }
  if (title.length > 200) {
    return { valid: false, message: 'Заголовок не должен превышать 200 символов' };
  }
  return { valid: true };
};

export const validateContent = (content: string): { valid: boolean; message?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, message: 'Содержание обязательно' };
  }
  return { valid: true };
};
