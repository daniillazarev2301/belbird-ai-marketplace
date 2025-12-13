import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
}

// Wildberries/Ozon requirements
export const MEDIA_REQUIREMENTS = {
  image: {
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    minWidth: 700,
    minHeight: 900,
    maxSizeMB: 10,
    maxCount: 30,
    quality: 0.65,
  },
  video: {
    formats: ['video/mp4', 'video/quicktime'],
    extensions: ['.mp4', '.mov'],
    maxSizeMB: 50,
    maxCount: 1,
  },
};

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp',
  initialQuality: 0.75,
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateMediaFile = (file: File, existingMediaCount: { images: number; videos: number }): ValidationResult => {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const fileType = file.type.toLowerCase();
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
  const isVideo = fileType.includes('video') || ['.mp4', '.mov'].includes(fileExt);
  
  if (isVideo) {
    // Video validation
    if (!MEDIA_REQUIREMENTS.video.formats.includes(fileType) && 
        !MEDIA_REQUIREMENTS.video.extensions.includes(fileExt)) {
      result.errors.push(`Формат видео не поддерживается. Используйте: MP4, MOV`);
      result.valid = false;
    }
    
    if (file.size > MEDIA_REQUIREMENTS.video.maxSizeMB * 1024 * 1024) {
      result.errors.push(`Размер видео превышает ${MEDIA_REQUIREMENTS.video.maxSizeMB} МБ`);
      result.valid = false;
    }
    
    if (existingMediaCount.videos >= MEDIA_REQUIREMENTS.video.maxCount) {
      result.errors.push(`Максимум ${MEDIA_REQUIREMENTS.video.maxCount} видео на товар`);
      result.valid = false;
    }
  } else {
    // Image validation
    if (!MEDIA_REQUIREMENTS.image.formats.includes(fileType) && 
        !MEDIA_REQUIREMENTS.image.extensions.includes(fileExt)) {
      result.errors.push(`Формат изображения не поддерживается. Используйте: JPG, PNG, WEBP`);
      result.valid = false;
    }
    
    if (file.size > MEDIA_REQUIREMENTS.image.maxSizeMB * 1024 * 1024) {
      result.errors.push(`Размер изображения превышает ${MEDIA_REQUIREMENTS.image.maxSizeMB} МБ`);
      result.valid = false;
    }
    
    if (existingMediaCount.images >= MEDIA_REQUIREMENTS.image.maxCount) {
      result.errors.push(`Максимум ${MEDIA_REQUIREMENTS.image.maxCount} фото на товар`);
      result.valid = false;
    }
  }
  
  return result;
};

export const validateImageDimensions = (file: File): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };
    
    // Skip for videos
    if (file.type.includes('video')) {
      resolve(result);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      if (img.width < MEDIA_REQUIREMENTS.image.minWidth || img.height < MEDIA_REQUIREMENTS.image.minHeight) {
        result.warnings.push(
          `Рекомендуемое разрешение от ${MEDIA_REQUIREMENTS.image.minWidth}×${MEDIA_REQUIREMENTS.image.minHeight}px. Текущее: ${img.width}×${img.height}px`
        );
      }
      
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(result);
    };
    img.src = URL.createObjectURL(file);
  });
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

export const isVideoFile = (url: string): boolean => {
  const lower = url.toLowerCase();
  return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || lower.includes('video');
};

export const countMediaTypes = (urls: string[]): { images: number; videos: number } => {
  const videos = urls.filter(isVideoFile).length;
  return { images: urls.length - videos, videos };
};
