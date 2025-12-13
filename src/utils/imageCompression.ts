import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // Skip compression for videos and GIFs
  const fileType = file.type.toLowerCase();
  if (
    fileType.includes('video') ||
    fileType === 'image/gif' ||
    file.name.toLowerCase().endsWith('.gif')
  ) {
    return file;
  }

  // Skip if file is already small enough
  const maxSize = (options.maxSizeMB || defaultOptions.maxSizeMB!) * 1024 * 1024;
  if (file.size <= maxSize) {
    console.log(`Image ${file.name} is already small (${(file.size / 1024).toFixed(1)}KB), skipping compression`);
    return file;
  }

  const compressionOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    console.log(`Compressing ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    const savedPercent = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    console.log(
      `Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (saved ${savedPercent}%)`
    );

    // Create new file with original name but potentially new extension
    const newExtension = compressionOptions.fileType?.split('/')[1] || 'webp';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}.${newExtension}`;

    return new File([compressedFile], newFileName, {
      type: compressionOptions.fileType || compressedFile.type,
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Return original file if compression fails
  }
};

export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<File[]> => {
  const compressedFiles: File[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImage(files[i], options);
    compressedFiles.push(compressed);
    onProgress?.(i + 1, files.length);
  }
  
  return compressedFiles;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};
