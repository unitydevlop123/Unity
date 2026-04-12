
import { firebaseRest } from './firebaseRest';
import { categoryExclusions } from './categoryFilters';

export const autoCleanerService = {
  async cleanAllCategories() {
    console.log("[AutoCleaner] Starting cleanup...");
    const allData = await firebaseRest.getAllGlobalCategories();
    const categories = Object.keys(allData);
    
    let totalRemoved = 0;
    let totalMoved = 0;

    for (const category of categories) {
      const videosObj = allData[category];
      if (!videosObj) continue;

      const videoIds = Object.keys(videosObj);
      for (const videoId of videoIds) {
        const video = videosObj[videoId];
        const title = video.title || "";
        const channel = video.channelTitle || video.channel || "";

        // 1. Check if it belongs in the CURRENT category by checking exclusions
        const exclusionCheck = categoryExclusions[category];
        const isExcluded = exclusionCheck ? exclusionCheck(title, channel) : false;

        if (isExcluded) {
          console.log(`[AutoCleaner] Video "${title}" is explicitly excluded from ${category}. Removing...`);
          await firebaseRest.removeGlobalCategoryVideo(category, videoId);
          totalRemoved++;

          // 2. We could try to move it, but since it was excluded, it's safer to just remove it
          // or we can let the AI re-classify it later. For now, we just remove it to keep categories clean.
        }
      }
    }

    console.log(`[AutoCleaner] Cleanup finished. Removed: ${totalRemoved}, Moved: ${totalMoved}`);
    return { totalRemoved, totalMoved };
  }
};
