import { Video } from '../videoService';
import { fetchAndFilterVideos } from '../apiHelper';
import { firebaseRest } from '../firebaseRest';
import { categoryFilters } from '../categoryFilters';

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
    systemInstruction: "STRICTLY REJECT ANY CHINESE ANIME, DONGHUA like 'Shrouding the Heavens', OR CULTIVATION CARTOONS. ONLY MARVEL, DC, AND WESTERN SUPERHEROES ALLOWED."
  }
};

export const getSuperHeroVideos = async (page: number = 1): Promise<Video[]> => {
  try {
    let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];
    
    try {
      const [apiRes, aiRes] = await Promise.all([
        fetchAndFilterVideos(
          'Marvel DC superhero movie avengers justice league',
          page,
          300,
          categoryFilters.superhero
        ).catch(() => []),
        firebaseRest.getGlobalCategoryVideos('superhero').catch(() => [])
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
    console.error("Error fetching Super Hero videos:", error);
    return [];
  }
};

export const superHeroVideos: Video[] = [];
