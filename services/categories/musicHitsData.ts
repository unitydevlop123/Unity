import { Video } from '../videoService';
import { fetchAndFilterVideos } from '../apiHelper';
import { firebaseRest } from '../firebaseRest';

export const getMusicHitsVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];
    
    try {
      const [apiRes, aiRes] = await Promise.all([
        fetchAndFilterVideos(
          'top music hits 2024 2025',
          page,
          180,
          (title) => {
            const isHit = title.includes('hit') || title.includes('top') || title.includes('billboard') || title.includes('chart') || title.includes('pop');
            const isMusic = title.includes('music') || title.includes('song') || title.includes('video');
            const isExcluded = title.includes('movie') || title.includes('gameplay') || title.includes('drama') || title.includes('trailer');
            return isHit && isMusic && !isExcluded;
          }
        ).catch(() => []),
        firebaseRest.getGlobalCategoryVideos('music_hits').catch(() => [])
      ]);
      apiVideos = apiRes as Video[];
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
    console.error("Error fetching Music Hits videos:", error);
    return [];
  }
};
