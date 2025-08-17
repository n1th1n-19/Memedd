import React from 'react';
import { View, Text, Image, Dimensions, ActivityIndicator, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { useMemes } from '../hooks/useMemes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function MemeSwiper() {
  const { memes, loading, error, hasMore, loadMoreMemes, refreshMemes, preloadNext } = useMemes();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [imageLoading, setImageLoading] = React.useState(true);

  // Animated values for swipe gestures using React Native Animated
  const pan = React.useRef(new Animated.ValueXY()).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  const goToNextMeme = React.useCallback(() => {
    setCurrentIndex(prev => {
      const newIndex = prev + 1;

      // Preload next batch when getting close to end
      preloadNext(newIndex);

      return newIndex;
    });
    setImageLoading(true);

    // Reset animation values
    pan.setValue({ x: 0, y: 0 });
    opacity.setValue(1);
    scale.setValue(1);
  }, [preloadNext, pan, opacity, scale]);

  const goToPrevMeme = React.useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setImageLoading(true);

      // Reset animation values
      pan.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
      scale.setValue(1);
    }
  }, [currentIndex, pan, opacity, scale]);

  // Pan responder for swipe gestures
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });

        // Scale and opacity effects based on swipe distance
        const swipeDistance = Math.abs(gestureState.dx);
        const progress = Math.min(swipeDistance / (screenWidth * 0.3), 1);

        scale.setValue(1 - progress * 0.1);
        opacity.setValue(1 - progress * 0.3);
      },
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();

        const threshold = screenWidth * 0.25;
        const velocityThreshold = 500;

        const isSwipeRight = gestureState.dx > threshold || gestureState.vx > velocityThreshold;
        const isSwipeLeft = gestureState.dx < -threshold || gestureState.vx < -velocityThreshold;

        if (isSwipeRight && currentIndex > 0) {
          // Swipe right - go to previous meme
          Animated.parallel([
            Animated.timing(pan.x, { toValue: screenWidth, duration: 300, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
          ]).start(() => {
            goToPrevMeme();
          });
        } else if (isSwipeLeft) {
          // Swipe left - go to next meme
          Animated.parallel([
            Animated.timing(pan.x, { toValue: -screenWidth, duration: 300, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
          ]).start(() => {
            goToNextMeme();
          });
        } else {
          // Snap back to center
          Animated.parallel([
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: false }),
            Animated.spring(opacity, { toValue: 1, useNativeDriver: false }),
          ]).start();
        }
      },
    })
  ).current;

  // Keyboard navigation (web only)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.addEventListener) return;

    const handleKeyPress = (event) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        goToNextMeme();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevMeme();
      } else if (event.key === 'r') {
        event.preventDefault();
        refreshMemes();
        setCurrentIndex(0);
      }
    };

    try {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    } catch (error) {
      console.log('Keyboard navigation not available on this platform');
    }
  }, [currentIndex, memes.length, hasMore, loading]);

  // Preload next few images for better performance
  React.useEffect(() => {
    const preloadImages = async () => {
      // Preload next 3 images
      for (let i = 1; i <= 3; i++) {
        const nextMeme = memes[currentIndex + i];
        if (nextMeme?.url) {
          try {
            // Try React Native Image.prefetch first
            const { Image: RNImage } = require('react-native');
            if (RNImage && RNImage.prefetch) {
              await RNImage.prefetch(nextMeme.url).catch(() => { });
            } else if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              // Fallback to web preloading
              const img = document.createElement('img');
              img.src = nextMeme.url;
            }
          } catch (error) {
            // Silent fail - preloading is optional
          }
        }
      }
    };

    if (memes.length > 0) {
      preloadImages();
    }
  }, [currentIndex, memes]);

  if (loading && memes.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: 'white', marginTop: 10, fontSize: 16 }}>You are MEMED...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          Error: {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            refreshMemes();
            setCurrentIndex(0);
          }}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMeme = memes[currentIndex];

  if (!currentMeme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white', fontSize: 18, marginBottom: 20 }}>You are COOKED</Text>
        <TouchableOpacity
          onPress={() => {
            refreshMemes();
            setCurrentIndex(0);
          }}
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Meme More</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* Main content with swipe gestures */}
      <Animated.View
        style={[
          {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
              {
                rotate: pan.x.interpolate({
                  inputRange: [-screenWidth, 0, screenWidth],
                  outputRange: ['-30deg', '0deg', '30deg'],
                })
              },
            ],
            opacity: opacity,
          }
        ]}
        {...panResponder.panHandlers}
      >
        {/* Image with loading indicator */}
        <View style={{ position: 'relative' }}>
          {imageLoading && (
            <View style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -15 }, { translateY: -15 }],
              zIndex: 1
            }}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
          <Image
            source={{ uri: currentMeme.url }}
            style={{
              width: screenWidth * 0.9,
              height: screenHeight * 0.65,
              resizeMode: 'contain',
              opacity: imageLoading ? 0.3 : 1
            }}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </View>

        {/* Meme info */}
        <View style={{
          position: 'absolute',
          bottom: 60,
          left: 20,
          right: 20,
          alignItems: 'flex-start'
        }}>
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'left',
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3
          }}>
            r/{currentMeme.subreddit} • {currentMeme.ups} ↑
          </Text>
          <Text style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 14,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2
          }}>
            {currentMeme.title}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}