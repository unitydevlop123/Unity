import { storage } from '../../services/firebaseConfig';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

export interface StorageFile {
  name: string;
  fullPath: string;
  url: string;
  size: number;
  contentType: string;
  updated: string;
}

export const listStorageFiles = async (path: string = ''): Promise<StorageFile[]> => {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  
  const files = await Promise.all(
    result.items.map(async (item) => {
      const url = await getDownloadURL(item);
      const metadata = await getMetadata(item);
      return {
        name: item.name,
        fullPath: item.fullPath,
        url,
        size: metadata.size,
        contentType: metadata.contentType || 'unknown',
        updated: metadata.updated,
      };
    })
  );
  
  return files;
};
