import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

const SMOOTH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function buildIndex(countries) {
  const index = {};
  countries.forEach((c, i) => {
    const l = c.name[0].toUpperCase();
    if (!(l in index)) index[l] = i;
  });
  return index;
}

function UniversalDock({
  isMenuOpen,
  isDockTransitioning,
  markDockInteraction,
  searchResults,
  selectedCountryIndex,
  isDockExpanding,
  handleSelectCountry,
  handleCountryHover,
}) {
  const cardsRef = useRef(null);
  const scrubberRef = useRef(null);
  const [activeLetter, setActiveLetter] = useState('A');
  const [hoveredCardIdx, setHoveredCardIdx] = useState(null);
  const isDragging = useRef(false);

  const alphaIndex = buildIndex(searchResults);
  const available  = new Set(Object.keys(alphaIndex));

  // Determine active letter based on flag scroll position
  const handleCardsScroll = useCallback(() => {
    if (!cardsRef.current) return;
    const scrollLeft = cardsRef.current.scrollLeft;
    const cards = cardsRef.current.querySelectorAll('[data-card]');
    
    // Find the first visible card in the viewport
    let firstVisibleLetter = 'A';
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.offsetLeft + card.clientWidth / 2 > scrollLeft) {
        const countryName = searchResults[i]?.name;
        if (countryName) {
          firstVisibleLetter = countryName[0].toUpperCase();
        }
        break;
      }
    }
    setActiveLetter(firstVisibleLetter);
  }, [searchResults]);

  useEffect(() => {
    const el = cardsRef.current;
    if (el) {
      el.addEventListener('scroll', handleCardsScroll);
      return () => el.removeEventListener('scroll', handleCardsScroll);
    }
  }, [isMenuOpen, handleCardsScroll]);

  // Scroll to a letter
  const scrollToLetter = useCallback((letter) => {
    if (!available.has(letter) || !cardsRef.current) return;
    const idx = alphaIndex[letter];
    if (idx == null) return;
    const cards = cardsRef.current.querySelectorAll('[data-card]');
    cards[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveLetter(letter);
  }, [alphaIndex, available]);

  // Handle slide/drag scrubbing across the horizontal alphabet
  const getLetterFromPointer = useCallback((clientX) => {
    if (!scrubberRef.current) return null;
    const rect = scrubberRef.current.getBoundingClientRect();
    const rel = (clientX - rect.left) / rect.width;
    const idx = Math.floor(rel * ALPHABET.length);
    const clamped = Math.max(0, Math.min(ALPHABET.length - 1, idx));
    return ALPHABET[clamped];
  }, []);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    scrubberRef.current?.setPointerCapture(e.pointerId);
    const letter = getLetterFromPointer(e.clientX);
    if (letter) scrollToLetter(letter);
  }, [getLetterFromPointer, scrollToLetter]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const letter = getLetterFromPointer(e.clientX);
    if (letter) scrollToLetter(letter);
  }, [getLetterFromPointer, scrollToLetter]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!isMenuOpen) return null;

  return (
    <div
      onPointerDown={markDockInteraction}
      style={{
        position: "fixed",
        bottom: "1.2rem",
        left: "50%",
        transform: isDockTransitioning
          ? "translateX(-50%) translateY(32px) scale(0.96)"
          : "translateX(-50%) translateY(0) scale(1)",
        width: "min(1360px, 98vw)",
        zIndex: 900,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px 14px 10px 14px",
        // Liquid Glass Styling matching the mini dock
        background: "rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(32px) saturate(200%)",
        WebkitBackdropFilter: "blur(32px) saturate(200%)",
        border: "1px solid rgba(255,255,255,0.5)",
        borderRadius: "28px", // Clean rounded corners that align with flag shapes
        boxShadow: "0 18px 40px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.35)",
        opacity: isDockTransitioning ? 0 : 1,
        transition: `opacity 420ms ${SMOOTH_EASE}, transform 420ms ${SMOOTH_EASE}`,
        boxSizing: "border-box",
      }}
    >
      {/* ── Flag cards row ─────────────────────────────────────── */}
      <div
        ref={cardsRef}
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "4px 10px", // Less padding needed for 28px radius
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          alignItems: "center",
        }}
      >
        {searchResults.map((country, index) => {
          const isSel = selectedCountryIndex === index;
          const isGov = hoveredCardIdx === index;
          return (
            <button
              key={country.name}
              data-card
              onClick={() => handleSelectCountry(country.name)}
              onMouseEnter={() => {
                setHoveredCardIdx(index);
                handleCountryHover(country.name);
              }}
              onMouseLeave={() => {
                setHoveredCardIdx(null);
                handleCountryHover(null);
              }}
              style={{
                scrollSnapAlign: "start",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                width: "110px",
                padding: "8px",
                // Liquid glass card highlights: high-contrast text and green borders
                background: isSel 
                  ? "rgba(135,185,64,0.22)" 
                  : isGov 
                    ? "rgba(15,23,42,0.06)" 
                    : "transparent",
                border: "1px solid " + (isSel 
                  ? "rgba(135,185,64,0.5)" 
                  : isGov 
                    ? "rgba(15,23,42,0.1)" 
                    : "transparent"),
                borderRadius: "16px",
                cursor: "pointer",
                transition: `all 220ms ${SMOOTH_EASE}`,
                transform: isSel ? "scale(1.04)" : "scale(1)",
                boxShadow: isSel ? "0 4px 16px rgba(135,185,64,0.2)" : "none",
                animation: isDockExpanding
                  ? `dockCardReveal 280ms ${SMOOTH_EASE} ${Math.min(index * 12, 280)}ms both`
                  : "none",
              }}
            >
              <img
                src={`https://flagcdn.com/w160/${country.countryCode || "xx"}.png`}
                alt={country.name}
                style={{
                  width: "84px",
                  height: "56px",
                  borderRadius: "6px",
                  objectFit: "cover",
                  boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
                  transition: `transform 220ms ${SMOOTH_EASE}`,
                  transform: isGov ? "scale(1.04)" : "scale(1)",
                }}
              />
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                // High-contrast slate texts for readability over light background
                color: isSel ? "#5a8820" : "rgba(15,23,42,0.9)",
                textAlign: "center",
                lineHeight: 1.25,
                letterSpacing: "0.01em",
                maxWidth: "96px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transition: "color 220ms ease",
              }}>
                {country.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Thin line divide */}
      <div style={{
        height: "1px",
        background: "linear-gradient(to right, transparent, rgba(15,23,42,0.08) 20%, rgba(15,23,42,0.08) 80%, transparent)",
      }} />

      {/* ── Minimal Horizontal Alphabet Scrubber ───────────────── */}
      <div
        ref={scrubberRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
          padding: "4px 28px", // padding matches flag row indent
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
              <span
                style={{
                  fontSize: isActive ? "13px" : "10px",
                  fontWeight: isActive ? 800 : 600,
                  // High-contrast letters over light liquid glass background
                  color: isActive
                    ? "#5a8820"
                    : isAvail
                      ? "rgba(15,23,42,0.8)"
                      : "rgba(15,23,42,0.22)",
                  transition: "all 140ms ease",
                  lineHeight: 1,
                }}
              >
                {letter}
              </span>
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#5a8820",
                    boxShadow: "0 0 6px rgba(90,136,32,0.6)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// memo() prevents re-renders when AppNew updates unrelated state
export default memo(UniversalDock);
