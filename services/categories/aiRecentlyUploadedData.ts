import { Video } from '../videoService';
import { formatDuration, formatViews, formatTime } from '../utils';
import { firebaseRest } from '../firebaseRest';

export const getAiRecentlyUploadedVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    // 1. Fetch from API (Recent uploads)
    const params = new URLSearchParams({
      fields: 'id,title,thumbnail_360_url,owner.screenname,owner.avatar_60_url,views_total,duration,created_time',
      sort: 'recent',
      limit: '100',
      page: page.toString()
    });

    const apiUrl = `https://api.dailymotion.com/videos?${params.toString()}`;
    
    let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];

    try {
      const [response, aiRes] = await Promise.all([
        fetch(apiUrl).catch(() => null),
        firebaseRest.getGlobalCategoryVideos('ai_recently_uploaded').catch(() => [])
      ]);

      aiVideos = aiRes as Video[];

      if (response && response.ok) {
        const data = await response.json();
        if (data && data.list) {
          apiVideos = data.list
            .filter((v: any) => {
              if (v.duration < 300) return false;
              const twoYearsAgo = Math.floor(Date.now() / 1000) - (2 * 365 * 24 * 60 * 60);
              if (v.created_time < twoYearsAgo) return false;
              return true;
            })
            .map((v: any) => ({
              id: v.id,
              title: v.title || 'Untitled Video',
              thumbnail: v.thumbnail_360_url || "https://picsum.photos/seed/video/640/360",
              avatar: v['owner.avatar_60_url'] || v.owner?.avatar_60_url || "https://picsum.photos/seed/avatar/100/100",
              channel: v['owner.screenname'] || v.owner?.screenname || "Unknown Channel",
              views: `${formatViews(v.views_total || 0)} views`,
              time: formatTime(v.created_time || 0),
              duration: formatDuration(v.duration || 0),
              createdTime: v.created_time || 0,
              isVerified: (v.views_total || 0) > 20000
            }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch videos in parallel");
    }

    // 3. Merge and Deduplicate
    const allVideos = [...aiVideos, ...apiVideos];
    const uniqueVideos = Array.from(new Map(allVideos.map(item => [item.id, item])).values());

    // 4. Sort by newest first
    uniqueVideos.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));

    return uniqueVideos;

  } catch (error) {
    console.error("Error fetching AI Recently Uploaded videos:", error);
    return [];
  }
};
