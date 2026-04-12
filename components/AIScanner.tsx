import React, { useState, useEffect } from 'react';
import { Video } from '../services/videoService';
import { classifyVideo, autoCarryVideoToCategory } from '../services/videoClassifier';

interface AIScannerProps {
  videos: Video[];
  isScanning: boolean;
  onScanComplete: () => void;
  categoryName?: string;
}

const AIScanner: React.FC<AIScannerProps> = ({ videos, isScanning, onScanComplete, categoryName }) => {
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (!isScanning || videos.length === 0) {
      setProcessedCount(0);
      return;
    }

    const processVideos = async () => {
      setProcessedCount(0);
      // Process videos one by one with a delay to simulate "thinking"
      for (let i = 0; i < videos.length; i++) {
        // Check if scanning was stopped mid-process
        if (!isScanning) break;

        const video = videos[i];
        setCurrentVideo(video);
        setScanResult("Analyzing metadata...");

        // Artificial delay for effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
          // Add a safety timeout of 25s for the entire classification process
          const result = await Promise.race([
            classifyVideo(video),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Scan Timeout")), 25000))
          ]);
          
          if (result.category && result.match_score >= 0.9) {
            const carried = await autoCarryVideoToCategory(video, result.category);
            if (carried) {
              setScanResult(`✅ MATCH: ${result.category} (${Math.round(result.match_score * 100)}%)`);
            } else {
              setScanResult(`ℹ️ Already in ${result.category}`);
            }
          } else {
            setScanResult(`❌ REJECTED: ${result.reason || "Low match score"}`);
          }
        } catch (error) {
          setScanResult("⚠️ Error scanning video");
        }

        setProcessedCount(prev => prev + 1);
        
        // Wait before next video
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      onScanComplete();
      setCurrentVideo(null);
      setScanResult(null);
    };

    processVideos();
  }, [isScanning, videos]);

  if (!isScanning) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-black/90 border border-green-500/50 rounded-lg shadow-2xl overflow-hidden font-mono text-xs">
      <div className="bg-green-900/20 p-2 border-b border-green-500/30 flex justify-between items-center">
        <span className="text-green-400 font-bold flex items-center gap-2 truncate pr-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></span>
          {categoryName ? `SCANNING: ${categoryName.toUpperCase()}` : 'UNITY DEV STREAM SCANNING'}
        </span>
        <span className="text-green-600 shrink-0">{processedCount}/{videos.length}</span>
      </div>
      
      <div className="p-3 space-y-3">
        {currentVideo ? (
          <>
            <div className="flex gap-3">
              <img 
                src={currentVideo.thumbnail} 
                alt="Scan target" 
                className="w-16 h-9 object-cover rounded border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white truncate">{currentVideo.title}</div>
                <div className="text-gray-500 truncate">{currentVideo.channel}</div>
              </div>
            </div>
            
            <div className="h-px bg-white/10"></div>
            
            <div className={`font-bold ${
              scanResult?.includes('MATCH') ? 'text-green-400' : 
              scanResult?.includes('REJECTED') ? 'text-red-400' : 
              'text-blue-400'
            }`}>
              {scanResult}
            </div>
          </>
        ) : (
          <div className="text-gray-500 italic text-center py-2">
            Initializing neural link...
          </div>
        )}
      </div>
      
      <div className="h-1 bg-green-900/30 w-full">
        <div 
          className="h-full bg-green-500"
          style={{ 
            width: `${(processedCount / videos.length) * 100}%`,
            WebkitTransition: 'width 0.3s ease',
            MozTransition: 'width 0.3s ease',
            transition: 'width 0.3s ease',
            willChange: 'width'
          }}
        ></div>
      </div>
    </div>
  );
};

export default AIScanner;
