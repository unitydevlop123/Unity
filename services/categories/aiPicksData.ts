import { Video } from '../videoService';
import { formatDuration, formatViews, formatTime } from '../utils';
import { firebaseRest } from '../firebaseRest';

export const getAiPicksVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    // AI PICKS are primarily sourced from the AI's discovered hidden gems
    let aiVideos: Video[] = [];
    try {
      aiVideos = await firebaseRest.getGlobalCategoryVideos('ai_picks') as Video[];
    } catch (e) {
      console.warn("Failed to load AI Picks");
    }

    // If no AI picks yet, fallback to some high-rated trending content
    if (aiVideos.length === 0) {
        const params = new URLSearchParams({
            fields: 'id,title,thumbnail_360_url,owner.screenname,owner.avatar_60_url,views_total,duration,created_time',
            sort: 'trending',
            limit: '20',
            page: page.toString()
        });
        const response = await fetch(`https://api.dailymotion.com/videos?${params.toString()}`);
        if (response.ok) {
            const data = await response.json();
            const videos = data.list.map((v: any) => ({
                id: v.id,
                title: v.title || 'Untitled Video',
                thumbnail: v.thumbnail_360_url || "https://picsum.photos/seed/video/640/360",
                avatar: v['owner.avatar_60_url'] || v.owner?.avatar_60_url || "https://picsum.photos/seed/avatar/100/100",
                channel: v['owner.screenname'] || v.owner?.screenname || "Unknown Channel",
                views: `${formatViews(v.views_total || 0)} views`,
                time: formatTime(v.created_time || 0),
                duration: formatDuration(v.duration || 0),
                createdTime: v.created_time || 0,
                isVerified: true
            }));
            videos.sort((a: any, b: any) => (b.createdTime || 0) - (a.createdTime || 0));
            return videos;
        }
    }

    aiVideos.sort((a: any, b: any) => (b.createdTime || 0) - (a.createdTime || 0));
    return aiVideos;
  } catch (error) {
    console.error("Error fetching AI Picks:", error);
    return [];
  }
};
