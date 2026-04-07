import { useState, useEffect, useRef, useCallback } from 'react';

function VideoPlayer({ videoUrl, title }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watermarkPosition, setWatermarkPosition] = useState({ top: 10, left: 10 });
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const containerRef = useRef(null);

  // Get user info for watermark
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserInfo({
        name: parsed.name || '',
        email: parsed.email || ''
      });
    }
  }, []);

  // Dynamic watermark position - moves every 3 seconds
  useEffect(() => {
    if (loading || error) return;
    
    const positions = [
      { top: 10, left: 10 },
      { top: 10, right: 10 },
      { top: 50, left: 50 },
      { bottom: 10, left: 10 },
      { bottom: 10, right: 10 },
      { top: 30, left: 70 },
      { top: 70, left: 20 },
    ];
    
    let positionIndex = 0;
    
    const interval = setInterval(() => {
      positionIndex = (positionIndex + 1) % positions.length;
      setWatermarkPosition(positions[positionIndex]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [loading, error]);

  // Extract YouTube video ID from various YouTube URL formats
  const extractYouTubeId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/watch\?.*v=([^&\s]+)/,
      /youtu\.be\/([^&\s?]+)/,
      /youtube\.com\/embed\/([^&\s?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }
    return null;
  };

  const videoId = extractYouTubeId(videoUrl);

  // Disable right-click on video container
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  // Disable keyboard shortcuts for dev tools
  const handleKeyDown = useCallback((e) => {
    // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault();
      return false;
    }
  }, []);

  useEffect(() => {
    if (videoId) {
      setLoading(false);
    } else if (videoUrl) {
      setError('Invalid YouTube URL');
      setLoading(false);
    }
  }, [videoUrl, videoId]);

  // Add event listeners for security
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu);
    }
    
    // Add keyboard protection globally
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu);
      }
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleContextMenu, handleKeyDown]);

  if (loading) {
    return (
      <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-white">Loading video...</div>
      </div>
    );
  }

  if (error || !videoId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center p-6">
          <div className="text-4xl mb-2">🎥</div>
          <p className="text-gray-600">{error || 'No video available'}</p>
        </div>
      </div>
    );
  }

  // Secure embed URL with privacy and control parameters
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?` + 
    `rel=0&` +                    // No related videos
    `modestbranding=1&` +        // Minimal YouTube branding
    `controls=1&` +              // Show controls
    `disablekb=0&` +             // Disable keyboard controls
    `fs=1&` +                    // Allow fullscreen
    `iv_load_policy=3&` +        // Hide video annotations
    `cc_load_policy=0&` +        // Hide closed captions by default
    `playsinline=1&` +           // Play inline on mobile
    `origin=${encodeURIComponent(window.location.origin)}`; // Restrict origin

  // Calculate watermark style based on position
  const watermarkStyle = {
    position: 'absolute',
    ...watermarkPosition,
    zIndex: 40,
    pointerEvents: 'none',
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden bg-black shadow-lg select-none"
      onContextMenu={handleContextMenu}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Overlay to prevent direct iframe interaction */}
      <div className="absolute inset-0 z-10 pointer-events-none" />
      
      {/* Transparent capture layer to prevent right-click on iframe */}
      <div 
        className="absolute inset-0 z-20"
        style={{ 
          background: 'transparent',
          cursor: 'default'
        }}
        onContextMenu={handleContextMenu}
      />
      
      {/* Responsive 16:9 Aspect Ratio Container */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title || 'Course Lecture'}
          className="absolute inset-0 w-full h-full pointer-events-auto"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
      
      {/* Dynamic User Watermark */}
      <div 
        className="px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg text-white/60 text-sm font-medium transition-all duration-500 ease-in-out"
        style={watermarkStyle}
      >
        <div className="flex flex-col">
          <span className="font-semibold">{userInfo.name}</span>
          <span className="text-xs opacity-75">{userInfo.email}</span>
        </div>
      </div>
      
      {/* Security overlay message */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 pointer-events-none z-30">
        <p className="text-white/70 text-xs">
          © EduTech - Authorized viewing only
        </p>
      </div>
    </div>
  );
}

export default VideoPlayer;
