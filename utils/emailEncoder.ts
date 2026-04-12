/**
 * Encode email to safe and readable Firebase key
 * Following the folder convention: demo_at_gmail_dot_com
 * We use toLowerCase() to ensure case-insensitive matching in paths.
 * We replace '.' with '_dot_' because Firebase keys cannot contain dots.
 */
export const encodeEmail = (email: string): string => {
  return email
    .replace('@', '_at_')
    .replace(/\./g, '_dot_');
};

/**
 * Decode readable Firebase key back to raw email
 */
export const decodeEmail = (key: string): string => {
  return key
    .replace('_at_', '@')
    .replace(/_dot_/g, '.');
};