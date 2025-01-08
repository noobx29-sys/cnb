import { Dimensions, Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';

export const getWindowDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const isDesktop = () => {
  return isWeb && getWindowDimensions().width >= 768;
};

export const getContentWidth = () => {
  const { width } = getWindowDimensions();
  if (isDesktop()) {
    return Math.min(1200, width * 0.8); // 80% of screen width up to 1200px
  }
  return width;
};

export const getCarouselWidth = () => {
  const contentWidth = getContentWidth();
  if (isDesktop()) {
    return contentWidth * 0.6; // 60% of content width on desktop
  }
  return contentWidth - 32; // Full width minus padding on mobile
};

export const getProductGridWidth = () => {
  const contentWidth = getContentWidth();
  if (isDesktop()) {
    return Math.floor((contentWidth - 32) / 4) - 16; // 4 items per row on desktop
  }
  return (contentWidth - 32) / 2 - 8; // 2 items per row on mobile
}; 