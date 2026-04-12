import { dashboardService, UserProfile } from '../services/dashboardService';

export const banUser = async (email: string) => {
  try {
    const success = await dashboardService.updateUser(email, { status: 'Banned' } as Partial<UserProfile>);
    if (success) {
      console.log(`✅ User ${email} banned successfully`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Error banning user ${email}:`, err);
    return false;
  }
};

export const verifyUser = async (email: string) => {
  try {
    const success = await dashboardService.updateUser(email, { role: 'Moderator' } as Partial<UserProfile>);
    if (success) {
      console.log(`✅ User ${email} verified/promoted successfully`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Error verifying user ${email}:`, err);
    return false;
  }
};

export const logoutUser = async () => {
  try {
    // In a real app, we'd also clear auth tokens
    console.log("✅ Admin logged out");
    return true;
  } catch (err) {
    console.error("❌ Error logging out:", err);
    return false;
  }
};

export const deleteUser = async (email: string) => {
  try {
    const success = await dashboardService.deleteUser(email);
    if (success) {
      console.log(`✅ User ${email} deleted successfully`);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`❌ Error deleting user ${email}:`, err);
    return false;
  }
};
