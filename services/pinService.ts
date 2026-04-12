export const pinService = {
  generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },

  isExpired(expiresAt: string): boolean {
    return new Date().getTime() > new Date(expiresAt).getTime();
  },

  isBlocked(lastAttempt: string | null, attempts: number): boolean {
    if (!lastAttempt || attempts < 3) return false;
    const blockTime = 5 * 60 * 1000; // 5 minutes
    return new Date().getTime() - new Date(lastAttempt).getTime() < blockTime;
  }
};