import React, { useEffect, useRef, useMemo } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';

// Resolves the best direct video URL from the videoItem, memoized to avoid
// recomputation on every render (which would otherwise trigger the effect to
// destroy and re-create Plyr + HLS unnecessarily).
function resolveDirectUrl(videoItem) {
  if (!videoItem) return null;
  
  // Primary fields
  const url = videoItem.r2Url || videoItem.videoUrl || videoItem.mp4Url;
  if (url) return url;

  // Secondary fields with content-type heuristics
  if (videoItem.sourceUrl) {
    const s = videoItem.sourceUrl;
    if (s.includes('.mp4') || s.includes('.m3u8') || s.includes('r2.dev') || s.includes('cloudflare')) {
      return s;
    }
  }

  if (videoItem.url) {
    const u = videoItem.url;
    if (u.includes('.mp4') || u.includes('.m3u8') || u.includes('r2.dev') || u.includes('cloudflare')) {
      return u;
    }
  }

  return null;
}

export default function PlyrVideoPlayer({ videoItem, autoplay = true }) {
  const videoRef = useRef(null);
  const plyrInstanceRef = useRef(null);
  const hlsInstanceRef = useRef(null);
  
  // Stable key so the effect only re-runs when the actual target video changes,
  // NOT when a new videoItem object reference with identical content arrives.
  const stableKey = videoItem?.id || videoItem?.videoId || '';
  const directUrl = useMemo(() => resolveDirectUrl(videoItem), [stableKey, videoItem?.r2Url, videoItem?.videoUrl, videoItem?.mp4Url, videoItem?.sourceUrl, videoItem?.url]);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoEl = videoRef.current;
    
    // Reset any stale src before (re)initialising
    videoEl.removeAttribute('src');
    videoEl.innerHTML = '';

    let hls = null;

    // Initialize Hls.js for .m3u8 or Cloudflare Adaptive Streams
    const isHls = directUrl && directUrl.includes('.m3u8');
    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        // ── Buffer tuning ──────────────────────────────────────────────
        // Smooth playback is the priority over ultra-low latency:
        maxBufferLength: 30,            // 30s forward buffer (good for stability)
        maxMaxBufferLength: 60,         // hard ceiling at 60s
        maxBufferSize: 60 * 1000 * 1000, // 60 MB max memory for buffered data
        backBufferLength: 10,           // keep only 10s behind current time (was 30 — wasted memory)
        liveSyncDurationCount: 3,       // sync to live edge within ~3 segments

        // ── Quality / ABR ─────────────────────────────────────────────
        startLevel: -1,                 // auto-select best starting quality
        capLevelToPlayerSize: true,     // don't download 4K for a 720p window
        abrEwmaFastLive: 2.5,          // faster ABR ramp-up (was 5s default)
        abrEwmaSlowLive: 4.0,          // slower ABR ramp-down (less over-reactive)
        maxLoadingDelay: 2,            // max 2s before switching quality on stall
        maxFragLookUpTolerance: 0.25,  // tighter fragment lookup

        // ── Performance ───────────────────────────────────────────────
        enableWorker: true,
        lowLatencyMode: false,          // KEY FIX: was true — causes aggressive buffering trades
        autoStartLoad: true,
        startFragPrefetch: true,        // prefetch next fragment for smoother transitions
        testBandwidth: true,            // measure actual bandwidth, not just segment size
        progressive: true,              // parse progressive segments faster

        // ── Resilience ────────────────────────────────────────────────
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,     // retry manifest load up to 3 times
        manifestLoadingRetryDelay: 1000,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 500,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
      });

      // Attach error recovery so transient network hiccups don't permanently stall playback
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[PlyrVideoPlayer] HLS fatal network error — attempting recovery');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[PlyrVideoPlayer] HLS fatal media error — attempting recovery');
              hls.recoverMediaError();
              break;
            default:
              console.error('[PlyrVideoPlayer] HLS unrecoverable error — destroying');
              hls.destroy();
              break;
          }
        }
      });

      hls.loadSource(directUrl);
      hls.attachMedia(videoEl);
      hlsInstanceRef.current = hls;
    } else if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      videoEl.src = directUrl;
    }

    // ── Initialise Plyr ──────────────────────────────────────────────
    let instance;
    try {
      instance = new Plyr(videoEl, {
        autoplay: autoplay,
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'duration',
          'mute',
          'volume',
          'fullscreen',
        ],
        ratio: '16:9',
        resetOnEnd: true,
        loadSprite: false,
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: false },
        clickToPlay: true,
        // Prevent Plyr from injecting a <source> that would conflict with HLS.js
        disableContextMenu: false,
        quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] },
        storage: { enabled: false },   // no localStorage reads (faster init)
      });

      plyrInstanceRef.current = instance;

      if (autoplay) {
        instance.on('ready', () => {
          const playPromise = instance.play();
          if (playPromise !== undefined) {
            playPromise.catch((_err) => {
              // Browser autoplay policy may block unmuted audio
              try {
                instance.muted = true;
                instance.play().catch(() => {});
              } catch (_ignored) {
                // silent
              }
            });
          }
        });
      }
    } catch (err) {
      console.error('[PlyrVideoPlayer] Error initialising Plyr:', err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, directUrl, autoplay]);

  if (directUrl) {
    // Cloudflare R2 / HLS / Direct MP4 video with GPU hardware acceleration
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
          backfaceVisibility: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          disableRemotePlayback
          disablePictureInPicture
          crossOrigin="anonymous"
          preload="metadata"
          poster={videoItem.thumbnailUrl || videoItem.poster || videoItem.imageUrl}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '20px',
            objectFit: 'contain',
          }}
        />
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
        transform: 'translateZ(0)',
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
