export const verificationService = {
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  validateCode(input: string, actual: string, expiresAt: number): { valid: boolean; error?: string } {
    if (Date.now() > expiresAt) {
      return { valid: false, error: 'Code has expired' };
    }
    if (input !== actual) {
      return { valid: false, error: 'Invalid verification code' };
    }
    return { valid: true };
  }
};