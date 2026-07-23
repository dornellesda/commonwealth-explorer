import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

export default function PlyrVideoPlayer({ videoItem, autoplay = true }) {
  const videoRef = useRef(null);
  const plyrInstanceRef = useRef(null);
  const hlsInstanceRef = useRef(null);

  const directUrl = videoItem.r2Url || videoItem.videoUrl || videoItem.mp4Url || 
    (videoItem.sourceUrl && (videoItem.sourceUrl.includes('.mp4') || videoItem.sourceUrl.includes('.m3u8') || videoItem.sourceUrl.includes('r2.dev') || videoItem.sourceUrl.includes('cloudflare')) ? videoItem.sourceUrl : null) ||
    (videoItem.url && (videoItem.url.includes('.mp4') || videoItem.url.includes('.m3u8') || videoItem.url.includes('r2.dev') || videoItem.url.includes('cloudflare')) ? videoItem.url : null);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoEl = videoRef.current;
    let hls = null;

    // Initialize Hls.js for .m3u8 or Cloudflare Adaptive Streams
    if (directUrl && directUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30
        });
        hls.loadSource(directUrl);
        hls.attachMedia(videoEl);
        hlsInstanceRef.current = hls;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = directUrl;
      }
    }

    try {
      const instance = new Plyr(videoEl, {
        autoplay: autoplay,
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'fullscreen'
        ],
        ratio: '16:9',
        resetOnEnd: true,
        loadSprite: false, // Prevents external SVG sprite network fetch overhead
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
        clickToPlay: true
      });

      plyrInstanceRef.current = instance;

      if (autoplay) {
        instance.on('ready', () => {
          const playPromise = instance.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              // Fallback to muted playback if browser autoplay policy blocks unmuted audio
              console.log('Autoplay unmuted blocked, trying muted play:', err);
              instance.muted = true;
              instance.play().catch(() => {});
            });
          }
        });
      }
    } catch (err) {
      console.error('Error initializing Plyr video player:', err);
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (plyrInstanceRef.current) {
        plyrInstanceRef.current.destroy();
        plyrInstanceRef.current = null;
      }
    };
  }, [videoItem.id, videoItem.videoId, directUrl, autoplay]);

  if (directUrl) {
    // Cloudflare R2 / HLS / Direct MP4 video with GPU hardware acceleration & immediate auto-preloading
    return (
      <div
        className="plyr-wrapper"
        style={{
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#000000',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <video
          ref={videoRef}
          playsInline
          crossOrigin="anonymous"
          preload="auto"
          controls
          poster={videoItem.thumbnailUrl || videoItem.poster || videoItem.imageUrl}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '20px',
            objectFit: 'contain'
          }}
        >
          {!directUrl.includes('.m3u8') && <source src={directUrl} type="video/mp4" />}
          Your browser does not support HTML5 video playback.
        </video>
      </div>
    );
  }

  // YouTube / Plyr embed fallback
  return (
    <div
      className="plyr-wrapper"
      style={{
        width: '100%',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#000000',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      <div
        ref={videoRef}
        className="plyr__video-embed"
        data-plyr-provider="youtube"
        data-plyr-embed-id={videoItem.videoId || videoItem.url}
      />
    </div>
  );
}
