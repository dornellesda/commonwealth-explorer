import React, { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export default function PlyrVideoPlayer({ videoItem, autoplay = true }) {
  const videoRef = useRef(null);
  const plyrInstanceRef = useRef(null);

  const directUrl = videoItem.r2Url || videoItem.videoUrl || videoItem.mp4Url || (videoItem.sourceUrl && (videoItem.sourceUrl.includes('.mp4') || videoItem.sourceUrl.includes('r2.dev') || videoItem.sourceUrl.includes('cloudflare')) ? videoItem.sourceUrl : null);

  useEffect(() => {
    if (!videoRef.current) return;

    try {
      const instance = new Plyr(videoRef.current, {
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
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
      });

      plyrInstanceRef.current = instance;

      if (autoplay) {
        instance.on('ready', () => {
          instance.play().catch(() => {});
        });
      }
    } catch (err) {
      console.error('Error initializing Plyr video player:', err);
    }

    return () => {
      if (plyrInstanceRef.current) {
        plyrInstanceRef.current.destroy();
        plyrInstanceRef.current = null;
      }
    };
  }, [videoItem.id, videoItem.videoId, directUrl]);

  if (directUrl) {
    // Cloudflare R2 or direct MP4 video
    return (
      <div className="plyr-wrapper" style={{ width: '100%', borderRadius: '20px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          playsInline
          controls
          poster={videoItem.thumbnailUrl}
          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '20px' }}
        >
          <source src={directUrl} type="video/mp4" />
          Your browser does not support HTML5 video playback.
        </video>
      </div>
    );
  }

  // YouTube / Plyr embed fallback
  return (
    <div className="plyr-wrapper" style={{ width: '100%', borderRadius: '20px', overflow: 'hidden' }}>
      <div
        ref={videoRef}
        className="plyr__video-embed"
        data-plyr-provider="youtube"
        data-plyr-embed-id={videoItem.videoId}
      />
    </div>
  );
}
