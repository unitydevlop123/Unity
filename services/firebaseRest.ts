
import { encodeEmail } from '../utils/emailEncoder';
import { db, storage } from './firebaseConfig';
import { ref, get, child, update, push, set, remove } from 'firebase/database';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export const firebaseRest = {
  async getMessageLimit(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/messageLimit`));
      const defaultLimit = {
        messages_today: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
        total_limit: 20
      };
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const today = new Date().toISOString().split('T')[0];
        if (data.last_reset_date !== today) {
          // Reset for new day
          await this.updateMessageLimit(email, {
            messages_today: 0,
            last_reset_date: today,
            total_limit: data.total_limit || 20
          });
          return { ...defaultLimit, total_limit: data.total_limit || 20 };
        }
        return data;
      }
      
      // Initialize if it doesn't exist
      await this.updateMessageLimit(email, defaultLimit);
      return defaultLimit;
    } catch (err) {
      console.error("Firebase Get Message Limit Error:", err);
      return { messages_today: 0, last_reset_date: new Date().toISOString().split('T')[0], total_limit: 20 };
    }
  },

  async updateMessageLimit(email: string, data: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db, `users/${folderName}/messageLimit`);
      await set(dbRef, data);
    } catch (err) {
      console.error("Firebase Update Message Limit Error:", err);
    }
  },

  async incrementMessageCount(email: string) {
    try {
      const limitData = await this.getMessageLimit(email);
      limitData.messages_today += 1;
      await this.updateMessageLimit(email, limitData);
      return limitData;
    } catch (err) {
      console.error("Firebase Increment Message Count Error:", err);
      return null;
    }
  },

  async uploadProfileImage(email: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(dataUrl);
            } else {
              resolve(e.target?.result as string);
            }
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Image Processing Error:", err);
        reject(err);
      }
    });
  },

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/profile`));
      return snapshot.exists();
    } catch (err) {
      console.error("Firebase Check Error:", err);
      return false;
    }
  },

  async checkUsernameAvailability(username: string, currentEmail: string): Promise<{ available: boolean, suggestions?: string[] }> {
    try {
      const dbRef = ref(db);
      const usernameLower = username.toLowerCase();
      
      // Direct lookup for speed
      const snapshot = await get(child(dbRef, `usernames/${usernameLower}`));
      const currentFolder = encodeEmail(currentEmail);
      
      if (snapshot.exists()) {
        const ownerFolder = snapshot.val();
        if (ownerFolder === currentFolder) {
          return { available: true };
        }
        
        // If taken, we still need all usernames to generate suggestions
        // But we can do this lazily or just return taken
        return { available: false, suggestions: [] }; 
      }
      
      return { available: true };
    } catch (err) {
      console.error("Firebase Username Check Error:", err);
      return { available: false };
    }
  },

  async deleteUserAccount(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}`));
    } catch (err) {
      console.error("Firebase Delete Account Error:", err);
      throw err;
    }
  },

  async getSessions(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/sessions`));
      if (snapshot.exists()) {
        const sessions = snapshot.val();
        return Object.keys(sessions).map(key => ({
          id: key,
          ...sessions[key]
        })).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      }
      return [];
    } catch (err) {
      console.error("Firebase Get Sessions Error:", err);
      return [];
    }
  },

  async saveSession(email: string, sessionData: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db, `users/${folderName}/sessions`);
      
      // Generate a session ID based on device, browser, OS, and IP to update existing or create new
      const sessionId = btoa(`${sessionData.device}-${sessionData.browser}-${sessionData.os}-${sessionData.ip}`).replace(/=/g, '');
      
      const sessionRef = child(dbRef, sessionId);
      await set(sessionRef, {
        ...sessionData,
        lastActive: new Date().toISOString()
      });

      // Also update the user's main profile location
      if (sessionData.location) {
        const profileRef = ref(db, `users/${folderName}/profile`);
        await update(profileRef, { location: `${sessionData.location} ${sessionData.flag_emoji || ''}`.trim() });
      }

      return sessionId;
    } catch (err) {
      console.error("Firebase Save Session Error:", err);
      return null;
    }
  },

  async removeSession(email: string, sessionId: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db, `users/${folderName}/sessions/${sessionId}`);
      await remove(dbRef);
      return true;
    } catch (err) {
      console.error("Firebase Remove Session Error:", err);
      return false;
    }
  },

  async getUserProfile(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/profile`));
      if (snapshot.exists()) {
        const profile = snapshot.val();
        // Lazy indexer: Ensure username is in the usernames index for fast lookup
        if (profile.username) {
          const usernameLower = profile.username.toLowerCase();
          const indexSnap = await get(child(dbRef, `usernames/${usernameLower}`));
          if (!indexSnap.exists()) {
            await set(child(dbRef, `usernames/${usernameLower}`), folderName);
          }
        }
        return profile;
      }
      return null;
    } catch (err) {
      console.error("Firebase Get Profile Error:", err);
      return null;
    }
  },

  async getPin(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/pin`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
      console.error("Firebase Get Pin Error:", err);
      return null;
    }
  },

  async updatePassword(email: string, newPassword: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await update(child(dbRef, `users/${folderName}/profile`), {
        password: newPassword
      });
    } catch (err) {
      console.error("Firebase Update Password Error:", err);
      throw err;
    }
  },

  async updateEmail(oldEmail: string, newEmail: string) {
    try {
      const oldFolderName = encodeEmail(oldEmail);
      const newFolderName = encodeEmail(newEmail);
      const dbRef = ref(db);
      
      // 1. Get all data from old email
      const snapshot = await get(child(dbRef, `users/${oldFolderName}`));
      if (!snapshot.exists()) {
        throw new Error("User data not found");
      }
      
      const userData = snapshot.val();
      
      // 2. Update email in profile
      if (userData.profile) {
        userData.profile.email = newEmail;
      }
      
      // 3. Write data to new email folder
      await set(child(dbRef, `users/${newFolderName}`), userData);
      
      // 4. Delete old email folder
      await remove(child(dbRef, `users/${oldFolderName}`));
      
    } catch (err) {
      console.error("Firebase Update Email Error:", err);
      throw err;
    }
  },

  async updatePin(email: string, pinData: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await update(child(dbRef, `users/${folderName}/pin`), pinData);
    } catch (err) {
      console.error("Firebase Update Pin Error:", err);
    }
  },

  async setVerified(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await update(child(dbRef, `users/${folderName}/profile`), { verified: true });
    } catch (err) {
      console.error("Firebase Set Verified Error:", err);
    }
  },

  // NEW: Fetch specific conversation to ensure data consistency
  async getConversation(email: string, conversationId: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      
      // Fetch metadata and messages in parallel
      const [metaSnap, msgsSnap] = await Promise.all([
        get(child(dbRef, `users/${folderName}/conversations/${conversationId}`)),
        get(child(dbRef, `users/${folderName}/messages/${conversationId}`))
      ]);
      
      if (!metaSnap.exists()) return null;
      const data = metaSnap.val();

      let messages: any[] = [];
      // Check new structure first
      if (msgsSnap.exists()) {
        const msgsData = msgsSnap.val();
        messages = Array.isArray(msgsData) ? msgsData : Object.values(msgsData);
      } 
      // Fallback to old nested structure
      else if (data.messages) {
        messages = Array.isArray(data.messages) ? data.messages : Object.values(data.messages);
      }

      messages.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      
      return { id: conversationId, ...data, messages };
    } catch (err) {
      console.error("Firebase Get Conversation Error:", err);
      return null;
    }
  },

  async getAllConversations(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/conversations`));
      
      if (!snapshot.exists()) {
        console.log("[Firebase SDK] No conversations found");
        return [];
      }
      
      const data = snapshot.val();
      if (!data) return [];
      
      return Object.keys(data)
        .filter(key => key !== 'placeholder')
        .map(key => {
          const conv = data[key];
          let messages: any[] = [];
          if (conv.messages) {
            messages = Array.isArray(conv.messages) ? conv.messages : Object.values(conv.messages);
            messages.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
          }
          return { id: key, ...conv, messages };
        });
    } catch (err) {
      console.error("Firebase SDK Get All Conversations Error:", err);
      return [];
    }
  },

  async getConversationMessages(email: string, conversationId: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      
      const snapshot = await get(child(dbRef, `users/${folderName}/messages/${conversationId}`));
      
      if (!snapshot.exists()) {
        // Fallback: check if they are still in the conversations node (old structure)
        const fallbackSnap = await get(child(dbRef, `users/${folderName}/conversations/${conversationId}/messages`));
        if (!fallbackSnap.exists()) return [];
        const data = fallbackSnap.val();
        if (!data) return [];
        return (Array.isArray(data) ? data : Object.values(data))
          .sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
      }
      
      const data = snapshot.val();
      if (!data) return [];
      return (Array.isArray(data) ? data : Object.values(data))
        .sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
    } catch (err) {
      console.error("Firebase Get Messages Error:", err);
      return [];
    }
  },

  async saveConversation(email: string, conversation: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const { id, messages, ...metadata } = conversation;
      
      if (id) {
        // Update metadata
        await update(child(dbRef, `users/${folderName}/conversations/${id}`), metadata);
        
        // Update messages in separate node
        if (messages && messages.length > 0) {
          const messagesObj: Record<string, any> = {};
          messages.forEach((msg: any) => {
            const msgId = msg.id || Date.now().toString();
            messagesObj[msgId] = { ...msg, timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp };
          });
          await set(child(dbRef, `users/${folderName}/messages/${id}`), messagesObj);
        }
        return id;
      } else {
        // New conversation
        const newConvRef = push(child(dbRef, `users/${folderName}/conversations`));
        const newId = newConvRef.key;
        await set(newConvRef, metadata);
        
        // Save messages in separate node
        if (messages && messages.length > 0) {
          const messagesObj: Record<string, any> = {};
          messages.forEach((msg: any) => {
            const msgId = msg.id || Date.now().toString();
            messagesObj[msgId] = { ...msg, timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp };
          });
          await set(child(dbRef, `users/${folderName}/messages/${newId}`), messagesObj);
        }
        
        return newId;
      }
    } catch (err) {
      console.error("Firebase SDK Save Conversation Error:", err);
      throw err;
    }
  },

  async addMessage(email: string, conversationId: string, message: any) {
    if (!email || !conversationId || !message) return;

    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const messageId = message.id || Date.now().toString();
      const msgToSave = { ...message, timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp };
      
      // Save to the new messages node
      await set(child(dbRef, `users/${folderName}/messages/${conversationId}/${messageId}`), msgToSave);

      // Also update the conversation timestamp in metadata
      await update(child(dbRef, `users/${folderName}/conversations/${conversationId}`), {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`[Firebase SDK] Failed to add message`, error);
      throw error;
    }
  },

  async deleteConversation(email: string, id: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      
      await Promise.all([
        remove(child(dbRef, `users/${folderName}/conversations/${id}`)),
        remove(child(dbRef, `users/${folderName}/messages/${id}`))
      ]);
    } catch (err) {
      console.error("Firebase SDK Delete Conversation Error:", err);
      throw err;
    }
  },

  async updateConversation(email: string, id: string, updates: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await update(child(dbRef, `users/${folderName}/conversations/${id}`), updates);
    } catch (err) {
      console.error("Firebase SDK Update Conversation Error:", err);
      throw err;
    }
  },

  async saveSettings(email: string, settings: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await update(child(dbRef, `users/${folderName}/settings`), settings);
    } catch (err) {
      console.error("Firebase SDK Save Settings Error:", err);
      throw err;
    }
  },

  async getSettings(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/settings`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (err) {
      console.error("Firebase SDK Get Settings Error:", err);
      return null;
    }
  },

  async migrateUserEmail(oldEmail: string, newEmail: string) {
    try {
      const oldFolder = encodeEmail(oldEmail);
      const newFolder = encodeEmail(newEmail);
      
      const dbRef = ref(db);
      
      // 1. Get all data from old folder
      const snapshot = await get(child(dbRef, `users/${oldFolder}`));
      if (!snapshot.exists()) {
        throw new Error("Old account data not found");
      }
      
      const data = snapshot.val();
      
      // 2. Update the email in profile
      if (data.profile) {
        data.profile.email = newEmail.toLowerCase();
      }
      
      // 3. Save to new folder
      await set(child(dbRef, `users/${newFolder}`), data);
      
      // 4. Delete old folder
      await remove(child(dbRef, `users/${oldFolder}`));
      
      return true;
    } catch (err) {
      console.error("Firebase Migrate Email Error:", err);
      throw err;
    }
  },

  async updateProfile(email: string, profileData: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      
      // Handle username index update if username is changing
      if (profileData.username) {
        const oldProfile = await this.getUserProfile(email);
        const oldUsername = oldProfile?.username?.toLowerCase();
        const newUsername = profileData.username.toLowerCase();
        
        if (oldUsername !== newUsername) {
          const updates: any = {};
          if (oldUsername) {
            updates[`usernames/${oldUsername}`] = null;
          }
          updates[`usernames/${newUsername}`] = folderName;
          await update(ref(db), updates);
        }
      }
      
      await update(child(dbRef, `users/${folderName}/profile`), profileData);
    } catch (err) {
      console.error("Firebase Update Profile Error:", err);
      throw err;
    }
  },

  async logActivity(email: string, action: string, details: string, metadata?: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const activityRef = push(child(dbRef, `users/${folderName}/activity`));
      await set(activityRef, {
        action,
        details,
        metadata: metadata || null,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firebase Log Activity Error:", err);
    }
  },

  async getActivityLog(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/activity`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      if (!data) return [];
      return Object.values(data).sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (err) {
      console.error("Firebase Get Activity Log Error:", err);
      return [];
    }
  },

  async clearActivityLog(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/activity`));
    } catch (err) {
      console.error("Firebase Clear Activity Log Error:", err);
    }
  },

  async clearSearchHistory(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/searchHistory`));
      await this.logActivity(email, "Cleared Search History", "User cleared their search logs");
    } catch (err) {
      console.error("Firebase Clear Search History Error:", err);
    }
  },

  async resetSettings(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const defaults = {
        theme: 'green',
        darkMode: true,
        notifications: true,
        videoQuality: '1080p',
        language: 'English',
        autoplay: true,
        subtitles: false,
        activityStatus: true,
        historyTracking: true
      };
      await set(child(dbRef, `users/${folderName}/settings`), defaults);
      await this.logActivity(email, "Reset Settings", "Restored to factory defaults");
    } catch (err) {
      console.error("Firebase Reset Settings Error:", err);
    }
  },

  async logoutAllDevices(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/sessions`));
      await this.logActivity(email, "Global Logout", "Logged out from all devices");
    } catch (err) {
      console.error("Firebase Logout All Error:", err);
    }
  },

  async searchDailymotion(query: string) {
    try {
      // Placeholder: Implement actual Dailymotion API call here
      // const res = await fetch(`https://api.dailymotion.com/videos?search=${encodeURIComponent(query)}&limit=5`);
      // const data = await res.json();
      // return data.list.map((v: any) => ({ title: v.title, id: v.id }));
      return []; // Return empty list for now
    } catch (err) {
      console.error("Firebase Search Dailymotion Error:", err);
      return [];
    }
  },

  async sendFeedback(email: string, feedback: any) {
    try {
      const dbRef = ref(db);
      const feedbackRef = push(child(dbRef, `feedback`));
      await set(feedbackRef, {
        email,
        ...feedback,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firebase Send Feedback Error:", err);
      throw err;
    }
  },

  // --- VIDEO HISTORY & BINGE LIST ---
  
  async addToRecentlyWatched(email: string, video: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const historyRef = child(dbRef, `users/${folderName}/history/recentlyWatched/${video.id}`);
      await set(historyRef, { 
        ...video, 
        watchedAt: new Date().toISOString() 
      });
      // Log activity
      await this.logActivity(email, "Watched", video.title, {
        image: video.thumbnail || video.image || video.poster,
        id: video.id,
        type: 'video'
      });
    } catch (err) {
      console.error("Firebase Add Recently Watched Error:", err);
    }
  },

  async getRecentlyWatched(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/history/recentlyWatched`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      if (!data) return [];
      return Object.values(data).sort((a: any, b: any) => 
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
      );
    } catch (err) {
      console.error("Firebase Get Recently Watched Error:", err);
      return [];
    }
  },

  async removeFromRecentlyWatched(email: string, videoId: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/history/recentlyWatched/${videoId}`));
      // Log activity
      await this.logActivity(email, "Removed from History", "Video", {
        id: videoId,
        type: 'history'
      });
    } catch (err) {
      console.error("Firebase Remove Recently Watched Error:", err);
    }
  },

  async clearRecentlyWatched(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/history/recentlyWatched`));
      // Log activity
      await this.logActivity(email, "Cleared History", "Recently Watched", {
        type: 'history'
      });
      return true;
    } catch (err) {
      console.error("Firebase Clear Recently Watched Error:", err);
      return false;
    }
  },

  async addToBingeList(email: string, video: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const bingeRef = child(dbRef, `users/${folderName}/history/bingeList/${video.id}`);
      await set(bingeRef, { 
        ...video, 
        addedAt: new Date().toISOString() 
      });
      // Log activity
      await this.logActivity(email, "Added to Binge List", video.title, {
        image: video.thumbnail || video.image || video.poster,
        id: video.id,
        type: 'binge'
      });
    } catch (err) {
      console.error("Firebase Add Binge List Error:", err);
    }
  },

  async removeFromBingeList(email: string, videoId: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      // Get video title for logging before removal
      const snapshot = await get(child(dbRef, `users/${folderName}/history/bingeList/${videoId}`));
      const videoTitle = snapshot.exists() ? snapshot.val().title : "Unknown Video";
      const videoData = snapshot.exists() ? snapshot.val() : null;
      
      await remove(child(dbRef, `users/${folderName}/history/bingeList/${videoId}`));
      // Log activity
      await this.logActivity(email, "Removed from Binge List", videoTitle, {
        image: videoData?.thumbnail || videoData?.image || videoData?.poster,
        id: videoId,
        type: 'binge'
      });
    } catch (err) {
      console.error("Firebase Remove Binge List Error:", err);
    }
  },

  async clearBingeList(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/history/bingeList`));
      // Log activity
      await this.logActivity(email, "Cleared List", "Binge List", {
        type: 'binge'
      });
      return true;
    } catch (err) {
      console.error("Firebase Clear Binge List Error:", err);
      return false;
    }
  },

  async getBingeList(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/history/bingeList`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      if (!data) return [];
      return Object.values(data).sort((a: any, b: any) => 
        new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );
    } catch (err) {
      console.error("Firebase Get Binge List Error:", err);
      return [];
    }
  },

  // --- GLOBAL AI CATEGORIES ---
  async addGlobalCategoryVideo(category: string, video: any) {
    try {
      const dbRef = ref(db);
      const videoId = video.id;
      const categoryRef = child(dbRef, `global_categories/${category}/${videoId}`);
      await set(categoryRef, {
        ...video,
        addedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("Firebase Add Global Category Video Error:", err);
      return false;
    }
  },

  async getGlobalCategoryVideos(category: string) {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `global_categories/${category}`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      if (!data) return [];
      return Object.values(data).sort((a: any, b: any) => 
        new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime()
      );
    } catch (err) {
      console.error("Firebase Get Global Category Videos Error:", err);
      return [];
    }
  },

  async removeGlobalCategoryVideo(category: string, videoId: string) {
    try {
      const dbRef = ref(db);
      await remove(child(dbRef, `global_categories/${category}/${videoId}`));
      return true;
    } catch (err) {
      console.error("Firebase Remove Global Category Video Error:", err);
      return false;
    }
  },

  async getAllGlobalCategories() {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `global_categories`));
      if (!snapshot.exists()) return {};
      return snapshot.val() || {};
    } catch (err) {
      console.error("Firebase Get All Global Categories Error:", err);
      return {};
    }
  },

  async getSquadCount(email: string): Promise<number> {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/squadCount`));
      return snapshot.exists() ? snapshot.val() : 0;
    } catch (err) {
      console.error("Firebase Get Squad Count Error:", err);
      return 0;
    }
  },

  async updateSquadCount(email: string, count: number) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db, `users/${folderName}/squadCount`);
      await set(dbRef, count);
    } catch (err) {
      console.error("Firebase Update Squad Count Error:", err);
    }
  },

  async joinSquad(targetEmail: string, followerEmail: string) {
    try {
      const targetFolder = encodeEmail(targetEmail);
      const followerFolder = encodeEmail(followerEmail);
      const dbRef = ref(db);
      
      // 1. Add to target's squad members
      const squadMemberRef = child(dbRef, `users/${targetFolder}/squadMembers/${followerFolder}`);
      await set(squadMemberRef, {
        email: followerEmail,
        joinedAt: new Date().toISOString()
      });
      
      // 2. Increment target's squad count
      const currentCount = await this.getSquadCount(targetEmail);
      await this.updateSquadCount(targetEmail, currentCount + 1);
      
      // 3. Add to follower's following list
      const followingRef = child(dbRef, `users/${followerFolder}/following/${targetFolder}`);
      await set(followingRef, {
        email: targetEmail,
        followedAt: new Date().toISOString()
      });
      
      // Log activity for both
      await this.logActivity(followerEmail, "Joined Squad", `Joined ${targetEmail}'s Squad`);
      await this.logActivity(targetEmail, "New Squad Member", `${followerEmail} joined your Squad`);
      
      return true;
    } catch (err) {
      console.error("Firebase Join Squad Error:", err);
      return false;
    }
  },

  async leaveSquad(targetEmail: string, followerEmail: string) {
    try {
      const targetFolder = encodeEmail(targetEmail);
      const followerFolder = encodeEmail(followerEmail);
      const dbRef = ref(db);
      
      // 1. Remove from target's squad members
      await remove(child(dbRef, `users/${targetFolder}/squadMembers/${followerFolder}`));
      
      // 2. Decrement target's squad count
      const currentCount = await this.getSquadCount(targetEmail);
      await this.updateSquadCount(targetEmail, Math.max(0, currentCount - 1));
      
      // 3. Remove from follower's following list
      await remove(child(dbRef, `users/${followerFolder}/following/${targetFolder}`));
      
      // Log activity
      await this.logActivity(followerEmail, "Left Squad", `Left ${targetEmail}'s Squad`);
      
      return true;
    } catch (err) {
      console.error("Firebase Leave Squad Error:", err);
      return false;
    }
  },

  async isSquadMember(targetEmail: string, followerEmail: string) {
    try {
      const targetFolder = encodeEmail(targetEmail);
      const followerFolder = encodeEmail(followerEmail);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${targetFolder}/squadMembers/${followerFolder}`));
      return snapshot.exists();
    } catch (err) {
      console.error("Firebase Is Squad Member Error:", err);
      return false;
    }
  },

  // --- SUPPORT AI CHAT HISTORY ---
  async getSupportChatHistory(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `users/${folderName}/supportChat`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      if (!data) return [];
      return Object.values(data).sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (err) {
      console.error("Firebase Get Support Chat Error:", err);
      return [];
    }
  },

  async addSupportMessage(email: string, message: any) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      const messageId = message.id || Date.now().toString();
      await set(child(dbRef, `users/${folderName}/supportChat/${messageId}`), {
        ...message,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Firebase Add Support Message Error:", err);
    }
  },

  async clearSupportChatHistory(email: string) {
    try {
      const folderName = encodeEmail(email);
      const dbRef = ref(db);
      await remove(child(dbRef, `users/${folderName}/supportChat`));
      return true;
    } catch (err) {
      console.error("Firebase Clear Support Chat Error:", err);
      return false;
    }
  }
};
