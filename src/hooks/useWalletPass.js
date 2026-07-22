/**
 * useWalletPass — Creates and manages WalletWallet passes for each milestone.
 *
 * Each milestone (5, 10, 25, 40, 56 countries) gets its own storeCard pass.
 * Passes from the same organizationName + logoText bundle in Apple Wallet
 * exactly like multi-city boarding passes.
 *
 * Serials are stored in localStorage under "ce_wallet_serials" (an object
 * keyed by milestone count: { 5: "uuid", 10: "uuid", ... }) so we can
 * issue live-update PUTs when the user visits more countries.
 *
 * Server endpoints (see server/index.js):
 *   POST /api/wallet              → create a pass
 *   PUT  /api/wallet/:serial      → update a pass (live push to all devices)
 */

import { useState, useCallback } from "react";
import { API_BASE_URL } from "../config";

// ─── Milestone metadata ───────────────────────────────────────────────────────

const MILESTONE_META = {
  // Available presets: blue, green, red, purple, orange, dark
  5:  { levelName: "Curious Explorer",            colorPreset: "orange",  icon: "curious-explorer" },
  10: { levelName: "Commonwealth Traveller",       colorPreset: "green",  icon: "commonwealth-traveller" },
  25: { levelName: "Global Navigator",             colorPreset: "blue",   icon: "global-navigator" },
  40: { levelName: "World Voyager",                colorPreset: "red",    icon: "world-voyager" },
  56: { levelName: "Golden Commonwealth Explorer", colorPreset: "purple", icon: "golden-commonwealth-explorer" },
};

const STORAGE_KEY = "ce_wallet_serials";

function loadSerials() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSerials(serials) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serials));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

// ─── Pass body builder ────────────────────────────────────────────────────────

/**
 * Builds the WalletWallet request body for a milestone pass.
 *
 * @param {object} params
 * @param {number} params.milestone        - e.g. 10
 * @param {number} params.totalVisited     - total countries visited so far
 * @param {string[]} params.visitedNames   - array of country names visited
 * @param {string|null} params.heroImageUrl - HTTPS URL of a country hero image (Pro only)
 * @param {string} params.userId           - stable anonymous user identifier
 */
function buildPassBody({ milestone, totalVisited, visitedNames, heroImageUrl, userId }) {
  const meta = MILESTONE_META[milestone] || MILESTONE_META[5];
  const barcodeId = `CE-V24-${userId}-${milestone}`;
  const countDisplay = `${totalVisited} / 56`;

  const body = {
    barcodeValue: barcodeId,
    barcodeFormat: "QR",
    logoText: "FamilySearch Commonwealth",
    organizationName: "Commonwealth Explorer",
    description: `Commonwealth Explorer — ${meta.levelName}`,
    colorPreset: meta.colorPreset, // We MUST use the native preset because the basic API ignores HEX overrides
    sharingProhibited: false,

    // Note: For images (logoURL, iconURL, stripURL) WalletWallet requires absolute public URLs.
    // We are pulling your exact badge SVGs directly from your public GitHub repository!
    iconURL: `https://raw.githubusercontent.com/dornellesda/commonwealth-explorer/main/public/badges/${meta.icon}.png?v=14`,
    thumbnailURL: `https://raw.githubusercontent.com/dornellesda/commonwealth-explorer/main/public/badges/${meta.icon}.png?v=14`,

    // Top-right strip (the only fields visible when the pass is stacked in Wallet)
    headerFields: [
      { label: "COUNTRIES", value: countDisplay },
    ],

    // Main pass face — centred, large
    primaryFields: [
      { label: "VOYAGER EXPERIENCE", value: meta.levelName },
    ],

    secondaryFields: [
      { label: "MILESTONE", value: `${milestone} Countries` },
      { label: "EXPLORER ID", value: userId.slice(0, 8).toUpperCase() },
    ],

    // Back of pass — full visited country list + notification anchor
    backFields: [
      {
        label: "Countries Visited",
        value: visitedNames.join(", ").length > 250 
          ? visitedNames.join(", ").substring(0, 250) + "..." 
          : visitedNames.join(", "),
        changeMessage: "Now exploring %@ Commonwealth nations",
      },
      {
        // Notification anchor — seeded with a space; bumped on live updates.
        // The value must change between versions to trigger a lock-screen banner.
        label: "Notifications",
        value: " ",
        changeMessage: "%@",
      },
    ],
  };

  // Pro-only: embed hero image as a wide banner strip (storeCard style)
  if (heroImageUrl) {
    body.stripURL = heroImageUrl;
  }

  return body;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWalletPass() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create a wallet pass for a specific milestone.
   * Returns { shareUrl, serialNumber, googleSaveUrl } on success.
   * Automatically opens the device-aware WalletWallet install page in a new tab.
   */
  const createPass = useCallback(async ({
    milestone,
    totalVisited,
    visitedNames,
    heroImageUrl = null,
    userId,
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const passBody = buildPassBody({ milestone, totalVisited, visitedNames, heroImageUrl, userId });

      const response = await fetch(`${API_BASE_URL}/api/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create wallet pass.");
      }

      // Persist the serial so future PUTs can push live updates
      const serials = loadSerials();
      serials[milestone] = data.serialNumber;
      saveSerials(serials);

      // No longer automatically opening window. Let the UI handle the QR code inline.
      // if (data.shareUrl) {
      //   window.open(data.shareUrl, "_blank", "noopener,noreferrer");
      // }

      return data;
    } catch (err) {
      setError(err.message || "Something went wrong.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update ALL previously issued milestone passes with the latest country list.
   * Triggers a live APNs push on Apple Wallet and a Google Wallet update.
   * Call this whenever the user visits a new country (not just milestones).
   */
  const updateAllPasses = useCallback(async ({
    totalVisited,
    visitedNames,
    userId,
  }) => {
    const serials = loadSerials();
    const entries = Object.entries(serials);
    if (!entries.length) return;

    await Promise.allSettled(
      entries.map(async ([milestone, serialNumber]) => {
        const passBody = buildPassBody({
          milestone: Number(milestone),
          totalVisited,
          visitedNames,
          userId,
        });

        try {
          await fetch(`${API_BASE_URL}/api/wallet/${serialNumber}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(passBody),
          });
        } catch {
          // Silent — best-effort live push
        }
      })
    );
  }, []);

  /** Returns true if a pass has already been issued for this milestone. */
  const hasPass = useCallback((milestone) => {
    return Boolean(loadSerials()[milestone]);
  }, []);

  /** Returns the stored serial UUID for an issued milestone pass. */
  const getSerial = useCallback((milestone) => {
    return loadSerials()[milestone] || null;
  }, []);

  return { createPass, updateAllPasses, hasPass, getSerial, isLoading, error };
}
