export const optimizeImage = (src, width, height) => {
  if (!src) return '';
  
  // Replace with CDN optimized version if available
  const cdnBaseUrl = process.env.VITE_CDN_URL || '';
  return `${cdnBaseUrl}/images/${width}x${height}/${src}`;
};

export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
};