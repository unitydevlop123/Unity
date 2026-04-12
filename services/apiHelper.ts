import { Video } from './videoService';
import { formatDuration, formatViews, formatTime } from './utils';

export const fetchAndFilterVideos = async (
  searchQuery: string,
  page: number,
  minDuration: number,
  titleFilter: (title: string, channel: string) => boolean
): Promise<Video[]> => {
  const paramsRecent = new URLSearchParams({
    fields: 'id,title,thumbnail_360_url,owner.screenname,owner.avatar_60_url,views_total,duration,created_time',
    sort: 'recent',
    limit: '100',
    page: page.toString(),
    search: searchQuery
  });

  const paramsRelevance = new URLSearchParams({
    fields: 'id,title,thumbnail_360_url,owner.screenname,owner.avatar_60_url,views_total,duration,created_time',
    sort: 'relevance',
    limit: '100',
    page: page.toString(),
    search: searchQuery
  });

  try {
    const [resRecent, resRelevance] = await Promise.all([
      fetch(`https://api.dailymotion.com/videos?${paramsRecent.toString()}`),
      fetch(`https://api.dailymotion.com/videos?${paramsRelevance.toString()}`)
    ]);

    const processResponse = async (response: Response) => {
      if (response.ok) {
        const data = await response.json();
        if (data && data.list) {
          return data.list
            .filter((v: any) => {
              if (v.duration < minDuration) return false;
              const title = (v.title || '').toLowerCase();
              const channel = (v['owner.screenname'] || '').toLowerCase();
              return titleFilter(title, channel);
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
      return [];
    };

    const [recentVideos, relevantVideos] = await Promise.all([
      processResponse(resRecent),
      processResponse(resRelevance)
    ]);

    const combined = [...recentVideos, ...relevantVideos];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    // Sort by newest first
    unique.sort((a, b) => (b.createdTime || 0) - (a.createdTime || 0));
    
    return unique;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};
