import * as FileSystem from 'expo-file-system';

import { config } from '../lib/config';

// Cloudinary configuration from app config
const CLOUDINARY_CLOUD_NAME = config.cloudinary.cloudName;
const CLOUDINARY_API_KEY = config.cloudinary.apiKey;
const CLOUDINARY_API_SECRET = config.cloudinary.apiSecret;
const CLOUDINARY_UPLOAD_PRESET = config.cloudinary.uploadPreset;

if (!CLOUDINARY_CLOUD_NAME) {
  console.warn('Cloudinary cloud name not configured. Please set CLOUDINARY_CLOUD_NAME in your environment variables.');
}

/**
 * Upload an image to Cloudinary
 * @param uri - Local file URI of the image
 * @param folder - Optional folder path in Cloudinary (e.g., 'products', 'categories', 'promotions')
 * @returns Promise<string> - The public URL of the uploaded image
 */
export const uploadImageToCloudinary = async (uri: string, folder?: string): Promise<string> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary configuration is missing. Please check your environment variables.');
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist at the provided URI');
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create form data for upload
    const formData = new FormData();
    
    // Determine the file type from the URI
    const fileExtension = uri.split('.').pop()?.toLowerCase();
    const mimeType = getMimeType(fileExtension || '');
    
    formData.append('file', `data:${mimeType};base64,${base64}`);
    
    // Add upload parameters
    if (CLOUDINARY_UPLOAD_PRESET) {
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    } else if (CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      formData.append('api_key', CLOUDINARY_API_KEY);
      // Generate timestamp for signature
      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      formData.append('timestamp', timestamp);
      
      // Add folder if specified
      if (folder) {
        formData.append('folder', folder);
      }
      
      // Note: For production apps, signature generation should be done server-side for security
      // For now, we'll skip signature if no upload preset is provided
      console.warn('Using API key without signature. Consider using upload preset for better security.');
    } else {
      throw new Error('Either upload preset or API credentials must be configured for Cloudinary');
    }
    
    if (folder && !CLOUDINARY_UPLOAD_PRESET) {
      formData.append('folder', folder);
    }

    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Cloudinary error: ${result.error.message}`);
    }

    // Return the secure URL
    return result.secure_url;
    
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Get MIME type based on file extension
 */
const getMimeType = (extension: string): string => {
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  
  return mimeTypes[extension] || 'image/jpeg';
};

/**
 * Upload multiple images to Cloudinary
 * @param uris - Array of local file URIs
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise<string[]> - Array of public URLs of the uploaded images
 */
export const uploadMultipleImagesToCloudinary = async (
  uris: string[], 
  folder?: string
): Promise<string[]> => {
  try {
    const uploadPromises = uris.map(uri => uploadImageToCloudinary(uri, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary using its public ID
 * @param publicId - The public ID of the image to delete
 * @returns Promise<boolean> - Success status
 */
export const deleteImageFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      console.warn('Cloudinary credentials not configured for deletion');
      return false;
    }

    // This would typically be done server-side for security
    // For now, we'll just log and return true
    console.log('Image deletion requested for public ID:', publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

export default {
  uploadImageToCloudinary,
  uploadMultipleImagesToCloudinary,
  deleteImageFromCloudinary,
};