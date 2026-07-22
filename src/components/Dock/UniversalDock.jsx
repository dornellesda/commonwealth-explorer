import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

// Apple Liquid Glass Motion Easing Curves
const APPLE_SMOOTH_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const APPLE_SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const APPLE_GENTLE_EASE = "cubic-bezier(0.2, 0.85, 0.24, 1)";
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Elevated bottom margins placing dock in comfortable reach zone near active map area
const PORTRAIT_DOCK_BOTTOM = "max(7.5rem, 12vh)";
const LANDSCAPE_DOCK_BOTTOM = "max(3rem, 6vh)";

function buildIndex(countries) {
  const index = {};
  countries.forEach((c, i) => {
    const l = c.name[0].toUpperCase();
    if (!(l in index)) index[l] = i;
  });
  return index;
}

function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth || window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth || window.matchMedia('(max-width: 768px)').matches);
    };
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return isPortrait;
}

function UniversalDock({
  isMenuOpen,
  isDockTransitioning,
  markDockInteraction,
  searchResults = [],
  selectedCountryIndex,
  isDockExpanding,
  handleSelectCountry,
  handleCountryHover,
}) {
  const cardsRef = useRef(null);
  const scrubberRef = useRef(null);
  const [activeLetter, setActiveLetter] = useState('A');
  const [hoveredCardIdx, setHoveredCardIdx] = useState(null);
  const [dockPage, setDockPage] = useState(0);
  const swipeRef = useRef({ startX: 0, startY: 0, dragging: false });
  const isDragging = useRef(false);
  const isPortrait = useIsPortrait();

  const visibleCountries = searchResults.filter((country) => country.name !== 'United Kingdom');
  const selectedCountryName = searchResults[selectedCountryIndex]?.name || null;

  const alphaIndex = buildIndex(visibleCountries);
  const available = new Set(Object.keys(alphaIndex));

  // Reset page pagination when dock opens
  useEffect(() => {
    setDockPage(0);
  }, [isMenuOpen, visibleCountries.length]);

  // ── Landscape Scroll Sync ────────────────────────────────────────────────
  const handleCardsScroll = useCallback(() => {
    if (!cardsRef.current) return;
    const scrollLeft = cardsRef.current.scrollLeft;
    const cards = cardsRef.current.querySelectorAll('[data-card]');
    let firstVisibleLetter = 'A';
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.offsetLeft + card.clientWidth / 2 > scrollLeft) {
        const countryName = visibleCountries[i]?.name;
        if (countryName) firstVisibleLetter = countryName[0].toUpperCase();
        break;
      }
    }
    setActiveLetter(firstVisibleLetter);
  }, [visibleCountries]);

  useEffect(() => {
    const el = cardsRef.current;
    if (el) {
      el.addEventListener('scroll', handleCardsScroll);
      return () => el.removeEventListener('scroll', handleCardsScroll);
    }
  }, [isMenuOpen, handleCardsScroll]);

  const scrollToLetter = useCallback((letter) => {
    if (!available.has(letter) || !cardsRef.current) return;
    const idx = alphaIndex[letter];
    if (idx == null) return;
    const cards = cardsRef.current.querySelectorAll('[data-card]');
    cards[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveLetter(letter);
  }, [alphaIndex, available]);

  const getLetterFromPointer = useCallback((clientX) => {
    if (!scrubberRef.current) return null;
    const rect = scrubberRef.current.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const idx = Math.floor(rel * ALPHABET.length);
    const clamped = Math.max(0, Math.min(ALPHABET.length - 1, idx));
    return ALPHABET[clamped];
  }, []);

  const onPointerDownScrubber = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    scrubberRef.current?.setPointerCapture(e.pointerId);
    const letter = getLetterFromPointer(e.clientX);
    if (letter) scrollToLetter(letter);
  }, [getLetterFromPointer, scrollToLetter]);

  const onPointerMoveScrubber = useCallback((e) => {
    if (!isDragging.current) return;
    const letter = getLetterFromPointer(e.clientX);
    if (letter) scrollToLetter(letter);
  }, [getLetterFromPointer, scrollToLetter]);

  const onPointerUpScrubber = useCallback(() => { isDragging.current = false; }, []);

  if (!isMenuOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // PORTRAIT — 4 × 3 Paginated Touch Grid with Apple Page Control at Bottom
  // ─────────────────────────────────────────────────────────────────────────
  if (isPortrait) {
    const COLS = 4;
    const ROWS = 3;
    const PAGE_SIZE = COLS * ROWS;
    const totalPages = Math.max(1, Math.ceil(visibleCountries.length / PAGE_SIZE));
    const safePage = Math.min(dockPage, Math.max(0, totalPages - 1));
    const pageCountries = visibleCountries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    const navigateTo = (newPage) => {
      setDockPage(newPage);
      if (markDockInteraction) markDockInteraction();
    };

    return (
      <div
        className="dock-expand-container"
        onPointerDown={markDockInteraction}
        style={{
          position: "fixed",
          bottom: PORTRAIT_DOCK_BOTTOM,
          left: "50%",
          transform: isDockTransitioning
            ? "translateX(-50%) translateY(40px) scale(0.94)"
            : "translateX(-50%) translateY(0) scale(1)",
          width: "min(640px, 92vw)",
          zIndex: 900,
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          // Ultra-luminous Apple Liquid Glass Material
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.28) 100%)",
          backdropFilter: "blur(50px) saturate(220%) brightness(1.05)",
          WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(1.05)",
          border: "1px solid rgba(255, 255, 255, 0.65)",
          borderRadius: "32px",
          boxShadow: [
            "0 28px 60px -12px rgba(0, 0, 0, 0.32)",
            "0 8px 20px -4px rgba(0, 0, 0, 0.16)",
            "inset 0 1.5px 0 0 rgba(255, 255, 255, 0.7)",
            "inset 0 -1px 0 0 rgba(0, 0, 0, 0.06)",
          ].join(", "),
          opacity: isDockTransitioning ? 0 : 1,
          transition: `opacity 400ms ${APPLE_GENTLE_EASE}, transform 500ms ${APPLE_SPRING_EASE}`,
          boxSizing: "border-box",
          isolation: "isolate",
          overflow: "hidden",
        }}
      >
        {/* Specular gloss sheen overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%)",
            borderRadius: "32px 32px 0 0",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Grid Container */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            onPointerDown={(e) => {
              swipeRef.current = { startX: e.clientX, startY: e.clientY, dragging: true };
            }}
            onPointerUp={(e) => {
              if (!swipeRef.current.dragging) return;
              swipeRef.current.dragging = false;
              const dx = e.clientX - swipeRef.current.startX;
              const dy = Math.abs(e.clientY - swipeRef.current.startY);
              if (Math.abs(dx) > 32 && dy < 65) {
                if (dx < 0 && safePage < totalPages - 1) navigateTo(safePage + 1);
                else if (dx > 0 && safePage > 0) navigateTo(safePage - 1);
              }
            }}
            onPointerCancel={() => { swipeRef.current.dragging = false; }}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: "8px",
              touchAction: "pan-y",
              userSelect: "none",
            }}
          >
            {pageCountries.map((country, index) => {
              const isSel = selectedCountryName === country.name;
              const globalIndex = safePage * PAGE_SIZE + index;
              const isHov = hoveredCardIdx === globalIndex;
              const col = index % COLS;
              const row = Math.floor(index / COLS);
              const staggerDelay = col * 24 + row * 12;

              return (
                <button
                  key={country.name}
                  data-card
                  onClick={() => {
                    if (markDockInteraction) markDockInteraction();
                    if (handleSelectCountry) handleSelectCountry(country.name || country);
                  }}
                  onPointerEnter={() => {
                    setHoveredCardIdx(globalIndex);
                    if (handleCountryHover) handleCountryHover(country.name);
                  }}
                  onPointerLeave={() => {
                    setHoveredCardIdx(null);
                    if (handleCountryHover) handleCountryHover(null);
                  }}
                  onPointerCancel={() => {
                    setHoveredCardIdx(null);
                    if (handleCountryHover) handleCountryHover(null);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px 4px 8px",
                    background: isSel
                      ? "linear-gradient(160deg, rgba(135,185,64,0.32) 0%, rgba(135,185,64,0.14) 100%)"
                      : isHov
                        ? "linear-gradient(160deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.32) 100%)"
                        : "linear-gradient(160deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.18) 100%)",
                    border: "1px solid " + (isSel
                      ? "rgba(135,185,64,0.6)"
                      : isHov
                        ? "rgba(255,255,255,0.85)"
                        : "rgba(255,255,255,0.5)"),
                    borderRadius: "18px",
                    cursor: "pointer",
                    transition: `all 260ms ${APPLE_SPRING_EASE}`,
                    transform: isSel
                      ? "translateY(-4px) scale(1.05)"
                      : isHov
                        ? "translateY(-3px) scale(1.03)"
                        : "translateY(0) scale(1)",
                    boxShadow: isSel
                      ? "0 8px 24px rgba(135, 185, 64, 0.35), inset 0 1px 0 rgba(255,255,255,0.7)"
                      : isHov
                        ? "0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.7)"
                        : "0 4px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
                    animation: `portraitCardReveal 420ms ${APPLE_SPRING_EASE} ${staggerDelay}ms both`,
                    minHeight: "76px",
                    willChange: "transform, box-shadow",
                  }}
                >
                  {country.countryCode && (
                    <div
                      style={{
                        position: "relative",
                        borderRadius: "6px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.3)",
                        transition: `transform 260ms ${APPLE_SPRING_EASE}`,
                        transform: isHov ? "scale(1.06)" : "scale(1)",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={`https://flagcdn.com/w160/${country.countryCode}.png`}
                        alt={country.name}
                        style={{
                          width: "44px",
                          height: "29px",
                          display: "block",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 650,
                      color: isSel ? "#3f6712" : "#0f172a",
                      textAlign: "center",
                      lineHeight: 1.18,
                      letterSpacing: "0.01em",
                      maxWidth: "100%",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", sans-serif',
                      textShadow: "0 1px 0 rgba(255, 255, 255, 0.6)",
                    }}
                  >
                    {country.name}
                  </span>
                </button>
              );
            })}

            {/* Ghost layout balance fillers */}
            {Array.from({ length: PAGE_SIZE - pageCountries.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ visibility: "hidden", minHeight: "76px" }} />
            ))}
          </div>
        </div>

        {/* Apple-Style Page Indicator Bar at Bottom of Dock */}
        {totalPages > 1 && (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "10px 16px",
              marginTop: "16px",
              borderRadius: "999px",
              background: "rgba(0, 0, 0, 0.08)", // Light glass recess
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              width: "fit-content",
              marginLeft: "auto",
              marginRight: "auto",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.5)",
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => {
              const isActive = i === safePage;
              return (
                <button
                  key={i}
                  onClick={() => navigateTo(i)}
                  aria-label={`Page ${i + 1}`}
                  style={{
                    width: isActive ? "32px" : "8px", // Keep the wide pill shape
                    height: "8px",
                    borderRadius: "999px",
                    border: "none",
                    background: isActive
                      ? "linear-gradient(90deg, #5E8E3E 0%, #87B940 100%)" // Dock's green theme
                      : "rgba(0, 0, 0, 0.25)",
                    cursor: "pointer",
                    padding: 0,
                    boxShadow: isActive ? "0 1px 6px rgba(135, 185, 64, 0.45)" : "none",
                    transition: `all 360ms ${APPLE_SPRING_EASE}`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LANDSCAPE — Single Row Scroll + Apple Alphabet Scrubber
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="dock-expand-container"
      onPointerDown={markDockInteraction}
      style={{
        position: "fixed",
        bottom: LANDSCAPE_DOCK_BOTTOM,
        left: "50%",
        transform: isDockTransitioning
          ? "translateX(-50%) translateY(36px) scale(0.95)"
          : "translateX(-50%) translateY(0) scale(1)",
        width: "min(1200px, 94vw)",
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "16px 18px 12px 18px",
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.28) 100%)",
        backdropFilter: "blur(50px) saturate(220%) brightness(1.05)",
        WebkitBackdropFilter: "blur(50px) saturate(220%) brightness(1.05)",
        border: "1px solid rgba(255, 255, 255, 0.65)",
        borderRadius: "32px",
        boxShadow: [
          "0 28px 60px -12px rgba(0, 0, 0, 0.32)",
          "0 8px 20px -4px rgba(0, 0, 0, 0.16)",
          "inset 0 1.5px 0 0 rgba(255, 255, 255, 0.7)",
          "inset 0 -1px 0 0 rgba(0, 0, 0, 0.06)",
        ].join(", "),
        opacity: isDockTransitioning ? 0 : 1,
        transition: `opacity 400ms ${APPLE_GENTLE_EASE}, transform 500ms ${APPLE_SPRING_EASE}`,
        boxSizing: "border-box",
        isolation: "isolate",
        overflow: "hidden",
      }}
    >
      {/* Gloss Sheen Reflector */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "45%",
          background: "linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 100%)",
          borderRadius: "32px 32px 0 0",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Flag Cards Row */}
      <div
        ref={cardsRef}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "4px 8px 8px 8px",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          alignItems: "center",
        }}
      >
        {visibleCountries.map((country, index) => {
          const isSel = selectedCountryName === country.name;
          const isGov = hoveredCardIdx === index;
          return (
            <button
              key={country.name}
              data-card
              onClick={() => {
                if (markDockInteraction) markDockInteraction();
                if (handleSelectCountry) handleSelectCountry(country.name || country);
              }}
              onMouseEnter={() => {
                setHoveredCardIdx(index);
                if (handleCountryHover) handleCountryHover(country.name);
              }}
              onMouseLeave={() => {
                setHoveredCardIdx(null);
                if (handleCountryHover) handleCountryHover(null);
              }}
              style={{
                scrollSnapAlign: "start",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                width: "112px",
                padding: "10px 8px",
                background: isSel
                  ? "linear-gradient(160deg, rgba(135,185,64,0.32) 0%, rgba(135,185,64,0.14) 100%)"
                  : isGov
                    ? "linear-gradient(160deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.32) 100%)"
                    : "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.15) 100%)",
                border: "1px solid " + (isSel
                  ? "rgba(135,185,64,0.6)"
                  : isGov
                    ? "rgba(255,255,255,0.85)"
                    : "rgba(255,255,255,0.5)"),
                borderRadius: "18px",
                cursor: "pointer",
                transition: `all 260ms ${APPLE_SPRING_EASE}`,
                transform: isSel
                  ? "scale(1.05) translateY(-3px)"
                  : isGov
                    ? "scale(1.03) translateY(-2px)"
                    : "scale(1) translateY(0)",
                boxShadow: isSel
                  ? "0 8px 24px rgba(135,185,64,0.35), inset 0 1px 0 rgba(255,255,255,0.7)"
                  : isGov
                    ? "0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.7)"
                    : "0 4px 10px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
              }}
            >
              {country.countryCode && (
                <img
                  src={`https://flagcdn.com/w160/${country.countryCode}.png`}
                  alt={country.name}
                  style={{
                    width: "72px",
                    height: "48px",
                    borderRadius: "6px",
                    objectFit: "cover",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
                    transition: `transform 260ms ${APPLE_SPRING_EASE}`,
                    transform: isGov ? "scale(1.06)" : "scale(1)",
                  }}
                />
              )}
              <span style={{
                fontSize: "11px",
                fontWeight: 650,
                color: isSel ? "#3f6712" : "#0f172a",
                textAlign: "center",
                lineHeight: 1.2,
                letterSpacing: "0.01em",
                maxWidth: "98px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", sans-serif',
                textShadow: "0 1px 0 rgba(255, 255, 255, 0.6)",
              }}>
                {country.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Divider Line */}
      <div style={{
        position: "relative",
        zIndex: 1,
        height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(15,23,42,0.12) 20%, rgba(15,23,42,0.12) 80%, transparent 100%)",
        margin: "2px 0 4px 0",
      }} />

      {/* Alphabet Scrubber */}
      <div
        ref={scrubberRef}
        onPointerDown={onPointerDownScrubber}
        onPointerMove={onPointerMoveScrubber}
        onPointerUp={onPointerUpScrubber}
        onPointerCancel={onPointerUpScrubber}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: "780px",
          margin: "0 auto",
          padding: "2px 20px",
          userSelect: "none",
          cursor: "ew-resize",
          touchAction: "none",
        }}
      >
        {ALPHABET.map((letter) => {
          const isAvail = available.has(letter);
          const isActive = activeLetter === letter;
          return (
            <div
              key={letter}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "22px",
                position: "relative",
              }}
            >
              <span style={{
                fontSize: isActive ? "13px" : "10px",
                fontWeight: isActive ? 800 : 600,
                color: isActive
                  ? "#4a7818"
                  : isAvail
                    ? "rgba(15, 23, 42, 0.8)"
                    : "rgba(15, 23, 42, 0.22)",
                transition: "all 140ms ease",
                lineHeight: 1,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              }}>
                {letter}
              </span>
              {isActive && (
                <div style={{
                  position: "absolute",
                  bottom: "-2px",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "#4a7818",
                  boxShadow: "0 0 6px rgba(74, 120, 24, 0.6)",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(UniversalDock);
