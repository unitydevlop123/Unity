import { Video } from '../videoService';
import { fetchAndFilterVideos } from '../apiHelper';
import { firebaseRest } from '../firebaseRest';

export const getGamesVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];
    
    try {
      const [apiRes, aiRes] = await Promise.all([
        fetchAndFilterVideos(
          'indie games retro gaming gameplay walkthrough',
          page,
          300,
          (title) => {
            const isGame = title.includes('gameplay') || title.includes('walkthrough') || title.includes('indie game') || title.includes('retro game') || title.includes('playthrough');
            const isExcluded = title.includes('esport') || title.includes('tournament') || title.includes('movie') || title.includes('music') || title.includes('song') || title.includes('trailer');
            return isGame && !isExcluded;
          }
        ).catch(() => []),
        firebaseRest.getGlobalCategoryVideos('games').catch(() => [])
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
    console.error("Error fetching Games videos:", error);
    return [];
  }
};
