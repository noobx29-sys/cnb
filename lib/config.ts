import Constants from 'expo-constants';

// Helper to get environment variables from Expo Constants
// This works properly in React Native/Expo apps
const getEnvVar = (key: string): string | undefined => {
  // First try to get from Constants.expoConfig.extra (works in development and production)
  const extraConfig = Constants.expoConfig?.extra;
  if (extraConfig && extraConfig[key]) {
    return extraConfig[key];
  }
  
  // Fallback to Constants.executionEnvironment for legacy support
  // In newer Expo versions, try Constants.expoConfig first
  return undefined;
};

// Configuration object with all environment variables
export const config = {
  // Database configuration
  databaseUrl: getEnvVar('databaseUrl'),
  
  // JWT configuration
  jwtSecret: getEnvVar('jwtSecret') || 'your-jwt-secret-key-change-in-production',
  
  // Cloudinary configuration
  cloudinary: {
    cloudName: getEnvVar('cloudinaryCloudName'),
    uploadPreset: getEnvVar('cloudinaryUploadPreset'),
    apiKey: getEnvVar('cloudinaryApiKey'),
    apiSecret: getEnvVar('cloudinaryApiSecret'),
  },
  
  // App configuration
  isDevelopment: __DEV__,
  version: Constants.expoConfig?.version || '1.0.0',
};

// Validation function to check required environment variables
export const validateConfig = (): void => {
  const required = ['databaseUrl'];
  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.log('Available config:', config);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

export default config;