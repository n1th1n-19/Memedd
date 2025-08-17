import { API_CONFIG } from '../config/api';

class MemeApiService {
  constructor() {
    this.cache = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  async fetchMemes(count = API_CONFIG.DEFAULT_MEME_COUNT, cursor = null) {
    try {
      // Check cache first
      const cacheKey = `memes_${count}`;
      if (this.cache.has(cacheKey)) {
        console.log('Returning cached memes');
        return this.cache.get(cacheKey);
      }

      // meme-api.com supports /gimme/{count} format
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MEMES}/${count}`;
      
      console.log('Fetching memes from:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // meme-api.com returns { count: number, memes: [...] }
      const items = data.memes || [data]; // Single meme or array of memes
      
      // Filter out invalid memes and ensure image URLs work
      const validMemes = Array.isArray(items) ? items.filter(meme => 
        meme && meme.url && meme.title && !meme.nsfw
      ) : [items].filter(meme => 
        meme && meme.url && meme.title && !meme.nsfw
      );
      
      console.log('Valid memes loaded:', validMemes.length);
      
      const result = {
        items: validMemes,
        hasMore: true, // Always true for meme-api.com since it's unlimited
        nextCursor: null // No pagination needed
      };

      // Cache the result for 5 minutes
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);

      // Start preloading images
      this.preloadImages(validMemes.slice(0, 5)); // Preload first 5 images

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      console.error('Error fetching memes:', error);
      throw error;
    }
  }

  preloadImages(memes) {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('Preloading', memes.length, 'images...');

    // Use React Native's Image.prefetch for mobile/native environments
    const { Image } = require('react-native');
    
    memes.forEach((meme, index) => {
      if (meme?.url) {
        setTimeout(() => {
          try {
            if (Image && Image.prefetch) {
              // React Native environment
              Image.prefetch(meme.url).catch(() => {});
            } else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              // Web environment
              const img = document.createElement('img');
              img.src = meme.url;
            }
          } catch (e) {
            // Silent fail - preloading is optional
          }
        }, index * 50); // Faster stagger
      }
    });

    setTimeout(() => { this.isPreloading = false; }, 1000);
  }

  async checkHealth() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      const data = await response.json();
      return { status: 'ok', data };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

export default new MemeApiService();