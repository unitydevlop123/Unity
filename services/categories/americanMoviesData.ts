import { Video } from '../videoService';
import { fetchAndFilterVideos } from '../apiHelper';
import { firebaseRest } from '../firebaseRest';

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
    stream: true
  }
};

export const getAmericanMoviesVideos = async (page: number = 1): Promise<Video[]> => {
  try {
        let apiVideos: Video[] = [];
    let aiVideos: Video[] = [];
    
    try {
      const [apiRes, aiRes] = await Promise.all([
        fetchAndFilterVideos(
          'Hollywood full movie action USA -trailer -clip -bollywood -nollywood -chinese -korean -indian',
          page,
          300,
          (title) => {
            const lowerTitle = title.toLowerCase();
            const isAmerican = lowerTitle.includes('hollywood') || lowerTitle.includes('american') || lowerTitle.includes('usa') || lowerTitle.includes('holly wood') || lowerTitle.includes('movie');
            
            // STRICT EXCLUSIONS
            const isExcluded = 
              // Countries / Regions
              lowerTitle.includes('nigeria') || lowerTitle.includes('nollywood') || 
              lowerTitle.includes('korean') || lowerTitle.includes('chinese') || 
              lowerTitle.includes('indian') || lowerTitle.includes('bollywood') || lowerTitle.includes('hindi') ||
              // Animation / Superheroes
              lowerTitle.includes('anime') || lowerTitle.includes('donghua') || lowerTitle.includes('hero') || lowerTitle.includes('marvel') || lowerTitle.includes('dc') ||
              // Short content
              lowerTitle.includes('trailer') || lowerTitle.includes('clip') || lowerTitle.includes('preview') || lowerTitle.includes('teaser') ||
              // Music
              lowerTitle.includes('music') || lowerTitle.includes('song');
              
            return isAmerican && !isExcluded;
          }
        ).catch(() => []),
        firebaseRest.getGlobalCategoryVideos('american_movies').catch(() => [])
      ]);
      
      // STRICT RULE: Only movies from the last 2 years
      const twoYearsAgo = Date.now() / 1000 - (2 * 365 * 24 * 60 * 60);
      apiVideos = (apiRes as Video[]).filter(v => (v.createdTime || 0) >= twoYearsAgo);
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
    console.error("Error fetching American Movies videos:", error);
    return [];
  }
};

export const americanMoviesVideos: Video[] = [];
