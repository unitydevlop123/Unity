import { Video } from '../videoService';
import { fetchAndFilterVideos } from '../apiHelper';
import { firebaseRest } from '../firebaseRest';
import { categoryFilters } from '../categoryFilters';
import { formatDuration, formatViews, formatTime } from '../utils';

// 🚨 AI MODEL CONFIGURATION (COPIED FROM SETTINGS)
// Model: UnityDev Pro
// DO NOT CONNECT YET
export const AI_MODEL_CONFIG = {
  id: 'llama-3.3-70b-versatile',
  name: 'UnityDev Pro (Best for complex tasks)',
  settings: {
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 0.9,
    stream: true,
    systemInstruction: "MUST BE ANIMATED (DONGHUA, CULTIVATION). STRICTLY REJECT ANY LIVE-ACTION CHINESE DRAMAS OR REAL ACTORS."
  }
};

const DONGHUA_CHANNELS = [
  'donghuapage',
  'Anim.Donghua',
  'Donghua.pro',
  'DonghuaZone.com',
  'animecube.live',
  'LUCIFER_DONGHUA',
  'Animezone0603',
  'vip110.vip-11',
  'asyaanime06',
  'allkeys'
];

const fetchChannelVideos = async (channel: string, page: number): Promise<Video[]> => {
  try {
    const params = new URLSearchParams({
      fields: 'id,title,thumbnail_360_url,owner.screenname,owner.avatar_60_url,views_total,duration,created_time',
      sort: 'recent',
      limit: '15',
      page: page.toString()
    });
    
    const response = await fetch(`https://api.dailymotion.com/user/${channel}/videos?${params.toString()}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (data && data.list) {
      return data.list
        .filter((v: any) => v.duration >= 300) // At least 5 mins
        .map((v: any) => ({
          id: v.id,
          title: v.title || 'Untitled Video',
          thumbnail: v.thumbnail_360_url || "https://picsum.photos/seed/video/640/360",
          avatar: v['owner.avatar_60_url'] || v.owner?.avatar_60_url || "https://picsum.photos/seed/avatar/100/100",
          channel: v['owner.screenname'] || v.owner?.screenname || channel,
          views: `${formatViews(v.views_total || 0)} views`,
          time: formatTime(v.created_time || 0),
          duration: formatDuration(v.duration || 0),
          createdTime: v.created_time || 0,
          isVerified: (v.views_total || 0) > 20000
        }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const getChineseAnimeVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];
    
    try {
      // Fetch from all specific channels in parallel
      const channelPromises = DONGHUA_CHANNELS.map(channel => fetchChannelVideos(channel, page));
      
      const [channelResults, aiRes] = await Promise.all([
        Promise.all(channelPromises),
        firebaseRest.getGlobalCategoryVideos('chinese_anime').catch(() => [])
      ]);
      
      apiVideos = channelResults.flat();
      aiVideos = aiRes as Video[];
    } catch (e) {
      console.warn("Failed to load videos in parallel", e);
    }

    // 3. Merge and Deduplicate
    const allVideos = [...aiVideos, ...apiVideos];
    const uniqueVideos = Array.from(new Map(allVideos.map(item => [item.id, item])).values());

    // 4. Sort by newest first
    uniqueVideos.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));

    return uniqueVideos;
  } catch (error) {
    console.error("Error fetching Chinese Anime videos:", error);
    return [];
  }
};

export const chineseAnimeVideos: Video[] = [];
