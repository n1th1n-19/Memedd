import { useState, useEffect, useCallback, useRef } from 'react';
import MemeApiService from '../services/memeApi';

export const useMemes = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const loadingRef = useRef(false);
  const retryCount = useRef(0);

  const loadInitialMemes = useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      // Start with smaller batch for faster initial load
      const response = await MemeApiService.fetchMemes(15);
      setMemes(response.items);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      retryCount.current = 0;

      // Load more in background after initial load
      setTimeout(() => {
        if (response.items.length < 20) {
          loadMoreMemes();
        }
      }, 1000);
      
    } catch (err) {
      setError(err.message);
      retryCount.current++;
      
      // Auto-retry with exponential backoff
      if (retryCount.current < 3) {
        setTimeout(() => {
          loadInitialMemes();
        }, Math.pow(2, retryCount.current) * 1000);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadMoreMemes = useCallback(async () => {
    if (!hasMore || loading || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await MemeApiService.fetchMemes(20, nextCursor);
      setMemes(prev => {
        // Remove duplicates by URL
        const existingUrls = new Set(prev.map(meme => meme.url));
        const newMemes = response.items.filter(meme => !existingUrls.has(meme.url));
        return [...prev, ...newMemes];
      });
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, loading, nextCursor]);

  const refreshMemes = useCallback(() => {
    MemeApiService.clearCache();
    setMemes([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    retryCount.current = 0;
    loadInitialMemes();
  }, [loadInitialMemes]);

  // Preload next batch when getting close to end
  const preloadNext = useCallback((currentIndex) => {
    if (currentIndex >= memes.length - 3 && hasMore && !loading && !loadingRef.current) {
      loadMoreMemes();
    }
  }, [memes.length, hasMore, loading, loadMoreMemes]);

  useEffect(() => {
    loadInitialMemes();
  }, [loadInitialMemes]);

  return {
    memes,
    loading,
    error,
    hasMore,
    loadMoreMemes,
    refreshMemes,
    preloadNext
  };
};