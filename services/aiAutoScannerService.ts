import { getPublicVideos, Video } from './videoService';
import { classifyVideo, autoCarryVideoToCategory, Category } from './videoClassifier';

const SCAN_CATEGORIES = [
  'Chinese Martial Art Drama',
  'Chinese animie movies 4k',
  'Korean Drama',
  'American Movies',
  'Super Hero Movies',
  'Gaming',
  'Games',
  'Music',
  'Music Hits',
  'AI Recently Uploaded'
];

class AIAutoScannerService {
  private currentCategoryIndex: number = 0;
  private processedInCategory: number = 0;
  private readonly MAX_PER_CATEGORY = 15;
  private isRunning: boolean = false;

  // Get the next batch of videos to scan based on round-robin logic
  public async getNextScanBatch(): Promise<{ categoryName: string; videos: Video[] }> {
    const categoryName = SCAN_CATEGORIES[this.currentCategoryIndex];
    
    try {
      console.log(`[AI-SCANNER] Checking category: ${categoryName} (Models rotate every 60s to prevent 429 errors)`);
      const videos = await getPublicVideos(1, "", categoryName, 50);
      
      if (videos.length === 0) {
        console.log(`[AI-SCANNER] No videos found in ${categoryName}, skipping...`);
        this.moveToNextCategory();
        return this.getNextScanBatch();
      }

      // Pick 4 videos that haven't been processed yet (or just the first 4 for simplicity in this demo)
      // In a real app, we'd check if they are already in the global DB
      const batch = videos.slice(0, this.MAX_PER_CATEGORY);
      
      // Move to next category for the NEXT call
      this.moveToNextCategory();
      
      return { categoryName, videos: batch };
    } catch (error) {
      console.error(`[AI-SCANNER] Error fetching ${categoryName}:`, error);
      this.moveToNextCategory();
      return { categoryName: "Error", videos: [] };
    }
  }

  private moveToNextCategory() {
    this.currentCategoryIndex = (this.currentCategoryIndex + 1) % SCAN_CATEGORIES.length;
    this.processedInCategory = 0;
  }

  public getCurrentCategory() {
    return SCAN_CATEGORIES[this.currentCategoryIndex];
  }
}

export const aiAutoScannerService = new AIAutoScannerService();
