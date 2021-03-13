const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate unique char-numberic string
 * @param length - length of generated id
 */
export const generageId = (length: number): string => {
  length = Math.max(1, Math.min(100, length));
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
};
