import { formatDuration, formatViews, formatTime } from './utils';

// Import Category Fetch Engines
import { getMartialArtsVideos } from './categories/martialArtsData';
import { getAmericanMoviesVideos } from './categories/americanMoviesData';
import { getSuperHeroVideos } from './categories/superHeroData';
import { getNigerianDramaVideos } from './categories/nigerianDramaData';
import { getKoreanDramaVideos } from './categories/koreanDramaData';
import { getGamingVideos } from './categories/gamingData';
import { getMusicVideos } from './categories/musicData';
import { getChineseAnimeVideos } from './categories/chineseAnimeData';
import { getAiPicksVideos } from './categories/aiPicksData';
import { getAiRecentlyUploadedVideos } from './categories/aiRecentlyUploadedData';
import { getGamesVideos } from './categories/gamesData';
import { getMusicHitsVideos } from './categories/musicHitsData';

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  avatar: string;
  channel: string;
  views: string;
  time: string;
  duration: string;
  createdTime?: number;
  isLive?: boolean;
  isVerified?: boolean;
}

export const getPublicVideos = async (page: number = 1, searchQuery: string = "", category: string = "", limit: number = 50): Promise<Video[]> => {
  try {
    // 1. Handle Static Categories (Hard-Coded Lists with Fetch Engines)
    if (category && category !== 'Explore' && category !== 'All' && category !== 'AI Recently Uploaded' && !searchQuery) {
      
      if (category === 'Chinese Martial Art Drama') {
        return await getMartialArtsVideos(page);
      } else if (category === 'Chinese animie movies 4k') {
        return await getChineseAnimeVideos(page);
      } else if (category === 'Korean Drama') {
        return await getKoreanDramaVideos(page);
      } else if (category === 'American Movies') {
        return await getAmericanMoviesVideos(page);
      } else if (category === 'Super Hero Movies') {
        return await getSuperHeroVideos(page);
      } else if (category === 'Gaming') {
        return await getGamingVideos(page);
      } else if (category === 'Games') {
        return await getGamesVideos(page);
      } else if (category === 'Music') {
        return await getMusicVideos(page);
      } else if (category === 'Music Hits') {
        return await getMusicHitsVideos(page);
      } else if (category === 'AI PICKS') {
        return await getAiPicksVideos(page);
      } else if (category === 'AI Recently Uploaded') {
        return await getAiRecentlyUploadedVideos(page);
      }
      
      return [];
    }

    // 2. Build API Request for 'Explore', 'All', or Search
    const isDataSaver = localStorage.getItem('unity_data_saver') === 'true';
    
    // Attempt to read video quality setting from any logged-in user's cached settings
    let videoQuality = 'auto';
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('unitydev_settings_')) {
          const settings = JSON.parse(localStorage.getItem(key) || '{}');
          if (settings.videoQuality) {
            videoQuality = settings.videoQuality;
            break;
          }
        }
      }
    } catch (e) {}

    let thumbnailField = 'thumbnail_360_url';
    let fallbackField = 'thumbnail_240_url';
    
    if (isDataSaver || videoQuality === '480p') {
      thumbnailField = 'thumbnail_240_url';
      fallbackField = 'thumbnail_120_url';
    } else if (videoQuality === '720p') {
      thumbnailField = 'thumbnail_480_url';
      fallbackField = 'thumbnail_360_url';
    } else if (videoQuality === '1080p' || videoQuality === '4k' || videoQuality === '4k-hdr') {
      thumbnailField = 'thumbnail_720_url';
      fallbackField = 'thumbnail_480_url';
    }

    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      fields: `id,title,${thumbnailField},${fallbackField},owner.screenname,owner.avatar_60_url,views_total,duration,created_time`
    });

    if (category === 'channel_recent' && searchQuery) {
      if (searchQuery.startsWith('owner:')) {
        params.append('owner', searchQuery.replace('owner:', ''));
      } else {
        params.append('search', searchQuery);
      }
      params.append('sort', 'recent');
    } else if (searchQuery) {
      if (searchQuery.startsWith('owner:')) {
        params.append('owner', searchQuery.replace('owner:', ''));
        params.append('sort', 'recent');
      } else {
        params.append('search', searchQuery);
        params.append('sort', 'recent'); // Changed from relevance to recent
      }
    } else if (category === 'AI Recently Uploaded' || category === 'Explore' || category === 'All') {
      params.append('sort', 'recent');
    } else {
      params.append('sort', 'trending');
    }
    
    const apiUrl = `https://api.dailymotion.com/videos?${params.toString()}`;
    
    const videoController = new AbortController();
    const videoTimeoutId = setTimeout(() => videoController.abort(), 25000); 
    
    const videoResponse = await fetch(apiUrl, { signal: videoController.signal });
    clearTimeout(videoTimeoutId);
    
    if (!videoResponse.ok) {
      return [];
    }
    
    const data = await videoResponse.json();
    
    // Safety check for data structure
    if (!data || !data.list || !Array.isArray(data.list)) {
      return [];
    }
    
    console.log(`Total videos from API: ${data.list.length}`);
    
    // 3. Map and Filter Data
    const filteredVideos = data.list
      .filter((v: any) => {
        // Basic validation
        if (!v || !v.id || !v.title) return false;
        
        // Duration filter
        const duration = v.duration || 0;
        
        // Strict 5 min (300s) filter for 'AI Recently Uploaded', 'All', and 'Explore'
        if (category === 'AI Recently Uploaded' || category === 'All' || category === 'Explore') {
          if (duration < 300) return false;
        } 
        // 8 min (480s) filter for Video Player 'Up Next' (channel_recent)
        else if (category === 'channel_recent') {
          if (duration < 480) return false;
        }
        else {
          // Default 1 min for others
          if (duration < 60) return false;
        }
        
        return true;
      })
      .map((v: any) => ({
        id: v.id,
        title: v.title || 'Untitled Video',
        thumbnail: v[thumbnailField] || v[fallbackField] || v.thumbnail_360_url || v.thumbnail_240_url || v.thumbnail_120_url || "https://picsum.photos/seed/video/640/360",
        avatar: v['owner.avatar_60_url'] || v.owner?.avatar_60_url || "https://picsum.photos/seed/avatar/100/100",
        channel: v['owner.screenname'] || v.owner?.screenname || "Unknown Channel",
        views: `${formatViews(v.views_total || 0)} views`,
        time: formatTime(v.created_time || 0),
        duration: formatDuration(v.duration || 0),
        createdTime: v.created_time || 0,
        isVerified: (v.views_total || 0) > 20000
      }));
    console.log(`Videos after filtering: ${filteredVideos.length}`);
    return filteredVideos;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your internet.');
    }
    throw new Error('Failed to load videos from UnityDev Stream.');
  }
};

