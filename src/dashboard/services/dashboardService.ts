const API_URL = window.location.origin;

export interface UserProfile {
  user_email: string;
  display_name: string;
  bio: string;
  role?: string;
  status?: string;
  joined_at?: string;
  ip_location?: string;
  watch_time?: string;
  watch_count?: number;
  bing_list_count?: number;
  is_banned?: boolean;
  ban_reason?: string;
  last_active?: string;
  neural_link_id?: string;
  avatar_url?: string;
  bing_list?: { title: string; added_at: string }[];
  watch_history?: { title: string; watched_at: string }[];
  password?: string;
  security_key?: string;
  subscription?: string;
  device_info?: string;
}

export interface Message {
  conversation_id: string;
  message_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  channel: string;
  category?: string;
}

const DEMO_USERS: UserProfile[] = [
  {
    user_email: "alex.mercer@example.com",
    display_name: "Alex Mercer",
    bio: "Tech enthusiast and developer.",
    role: "Super Admin",
    status: "Active",
    joined_at: "2024-01-15T08:30:00Z",
    ip_location: "San Francisco, CA (US)",
    watch_time: "124h 30m",
    watch_count: 342,
    bing_list_count: 42,
    is_banned: false,
    last_active: "2 mins ago",
    neural_link_id: "NL-8932-XF",
    avatar_url: "https://i.pravatar.cc/150?u=alex.mercer@example.com",
    bing_list: [
      { title: "The Matrix Resurrections", added_at: "2024-03-20" },
      { title: "Inception", added_at: "2024-03-18" }
    ],
    watch_history: [
      { title: "Blade Runner 2049", watched_at: "2024-03-27" },
      { title: "Dune: Part Two", watched_at: "2024-03-25" }
    ],
    password: "hashed_password_8932",
    security_key: "8932",
    subscription: "Enterprise",
    device_info: "MacBook Pro M3 Max"
  },
  {
    user_email: "sarah.connor@example.com",
    display_name: "Sarah Connor",
    bio: "Security researcher.",
    role: "Moderator",
    status: "Active",
    joined_at: "2024-02-20T14:15:00Z",
    ip_location: "London, UK (GB)",
    watch_time: "89h 15m",
    watch_count: 156,
    bing_list_count: 15,
    is_banned: false,
    last_active: "1 hour ago",
    neural_link_id: "NL-4419-QR",
    avatar_url: "https://i.pravatar.cc/150?u=sarah.connor@example.com",
    bing_list: [
      { title: "Terminator 2", added_at: "2024-02-25" }
    ],
    watch_history: [
      { title: "Cyberpunk: Edgerunners", watched_at: "2024-03-26" }
    ],
    password: "hashed_password_4419",
    security_key: "4419",
    subscription: "Pro",
    device_info: "Windows PC (Custom Build)"
  },
  {
    user_email: "john.doe@example.com",
    display_name: "John Doe",
    bio: "Regular user.",
    role: "User",
    status: "Banned",
    joined_at: "2024-03-10T09:45:00Z",
    ip_location: "Moscow, RU",
    watch_time: "12h 05m",
    watch_count: 24,
    bing_list_count: 3,
    is_banned: true,
    ban_reason: "Violation of TOS: Spamming",
    last_active: "3 days ago",
    neural_link_id: "NL-1029-ZZ",
    avatar_url: "https://i.pravatar.cc/150?u=john.doe@example.com",
    bing_list: [],
    watch_history: [
      { title: "Spam Bot Tutorial", watched_at: "2024-03-24" }
    ],
    password: "hashed_password_1029",
    security_key: "1029",
    subscription: "Free",
    device_info: "Android Phone"
  },
  {
    user_email: "emily.chen@example.com",
    display_name: "Emily Chen",
    bio: "Content creator.",
    role: "User",
    status: "Active",
    joined_at: "2024-03-15T16:20:00Z",
    ip_location: "Tokyo, JP",
    watch_time: "310h 45m",
    watch_count: 892,
    bing_list_count: 128,
    is_banned: false,
    last_active: "Just now",
    neural_link_id: "NL-7731-JP",
    avatar_url: "https://i.pravatar.cc/150?u=emily.chen@example.com",
    bing_list: [
      { title: "Neon Genesis Evangelion", added_at: "2024-03-21" },
      { title: "Akira", added_at: "2024-03-22" },
      { title: "Ghost in the Shell", added_at: "2024-03-23" }
    ],
    watch_history: [
      { title: "Your Name", watched_at: "2024-03-28" },
      { title: "Spirited Away", watched_at: "2024-03-27" }
    ],
    password: "hashed_password_7731",
    security_key: "7731",
    subscription: "Pro",
    device_info: "iPhone 15 Pro Max"
  },
  {
    user_email: "michael.smith@example.com",
    display_name: "Michael Smith",
    bio: "Just browsing.",
    role: "User",
    status: "Active",
    joined_at: "2024-03-25T11:10:00Z",
    ip_location: "Sydney, AU",
    watch_time: "45h 20m",
    watch_count: 85,
    bing_list_count: 22,
    is_banned: false,
    last_active: "5 hours ago",
    neural_link_id: "NL-5590-AU",
    avatar_url: "https://i.pravatar.cc/150?u=michael.smith@example.com",
    bing_list: [
      { title: "Mad Max: Fury Road", added_at: "2024-03-26" }
    ],
    watch_history: [
      { title: "The Lord of the Rings", watched_at: "2024-03-27" }
    ],
    password: "hashed_password_5590",
    security_key: "5590",
    subscription: "Free",
    device_info: "iPad Pro"
  },
  {
    user_email: "hacker.man@example.com",
    display_name: "Zero Cool",
    bio: "Mess with the best, die like the rest.",
    role: "User",
    status: "Banned",
    joined_at: "2024-03-28T01:00:00Z",
    ip_location: "Unknown Proxy",
    watch_time: "0h 15m",
    watch_count: 2,
    bing_list_count: 0,
    is_banned: true,
    ban_reason: "Suspicious API activity detected",
    last_active: "12 hours ago",
    neural_link_id: "NL-0000-XX",
    avatar_url: "https://i.pravatar.cc/150?u=hacker.man@example.com",
    bing_list: [],
    watch_history: [
      { title: "Hackers (1995)", watched_at: "2024-03-28" }
    ],
    password: "hashed_password_0000",
    security_key: "0000",
    subscription: "Free",
    device_info: "Unknown Device"
  }
];

class DashboardService {
  // Users
  async fetchUsers(): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${API_URL}/api/admin/users`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      if (data && data.length > 0) {
        return data;
      }
      // Fallback to demo users if DB is empty
      return DEMO_USERS;
    } catch (err) {
      console.error("DashboardService Error (fetchUsers):", err);
      return DEMO_USERS; // Return demo users on error
    }
  }

  async deleteUser(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${email}`, {
        method: "DELETE"
      });
      return response.ok;
    } catch (err) {
      console.error("DashboardService Error (deleteUser):", err);
      return false;
    }
  }

  async updateUser(email: string, data: Partial<UserProfile>): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch (err) {
      console.error("DashboardService Error (updateUser):", err);
      return false;
    }
  }

  // Messages / Logs
  async fetchMessages(): Promise<Message[]> {
    try {
      const response = await fetch(`${API_URL}/api/admin/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return await response.json();
    } catch (err) {
      console.error("DashboardService Error (fetchMessages):", err);
      return [];
    }
  }

  // Videos
  async fetchVideos(): Promise<Video[]> {
    try {
      const response = await fetch(`${API_URL}/api/admin/videos`);
      if (!response.ok) throw new Error("Failed to fetch videos");
      return await response.json();
    } catch (err) {
      console.error("DashboardService Error (fetchVideos):", err);
      return [];
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/admin/videos/${id}`, {
        method: "DELETE"
      });
      return response.ok;
    } catch (err) {
      console.error("DashboardService Error (deleteVideo):", err);
      return false;
    }
  }

  // System Stats (Mocking real feel)
  async fetchSystemStats() {
    // In a real app, this would be an API call
    return {
      activeNodes: Math.floor(Math.random() * 500) + 1000,
      cpuLoad: (Math.random() * 30 + 10).toFixed(1) + "%",
      throughput: (Math.random() * 200 + 700).toFixed(0) + " GB",
      securityLevel: "MAX"
    };
  }
}

export const dashboardService = new DashboardService();
