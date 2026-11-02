const GRID = { cols: 8, rows: 8, frames: 64 } as const;

/**
 * Pixel measurements of the bundled artwork, before any display scaling.
 * uprightHeight measures Herbi rather than the transparent frame padding.
 * Sleep inherits the standing height from goingSleep: a reclining pose must
 * keep the same body scale instead of being enlarged to the standing height.
 */
export const MASCOT_SPRITE_METRICS = {
  idle: { ...GRID, referenceWidth: 768, referenceHeight: 1052, uprightHeight: 127 },
  goingSleep: { ...GRID, referenceWidth: 1028, referenceHeight: 1040, uprightHeight: 127 },
  sleeping: { ...GRID, referenceWidth: 1032, referenceHeight: 892, uprightHeight: 127 },
  wakeup: { ...GRID, referenceWidth: 1168, referenceHeight: 1184, uprightHeight: 135 },
  happy: { ...GRID, referenceWidth: 1032, referenceHeight: 1092, uprightHeight: 127 },
  thinking: { ...GRID, referenceWidth: 760, referenceHeight: 1048, uprightHeight: 127 },
  excited: { ...GRID, referenceWidth: 848, referenceHeight: 1096, uprightHeight: 128 },
  winking: { ...GRID, referenceWidth: 724, referenceHeight: 1044, uprightHeight: 127 },
  peaceful: { ...GRID, referenceWidth: 1144, referenceHeight: 1084, uprightHeight: 127 },
} as const;

// Preserve the original idle appearance and keep every pose inside its home slot.
export const MASCOT_SLOT_WIDTH = 140;
export const MASCOT_SLOT_HEIGHT = 120;
const STANDING_DISPLAY_HEIGHT = 107;

type SpriteMetrics = {
  cols: number;
  rows: number;
  frames: number;
  referenceHeight: number;
  uprightHeight: number;
};

export function getMascotLayout(metrics: SpriteMetrics, sheetWidth: number, sheetHeight: number) {
  const frameWidth = sheetWidth / metrics.cols;
  const frameHeight = sheetHeight / metrics.rows;
  const uprightHeight = metrics.uprightHeight * sheetHeight / metrics.referenceHeight;
  const scale = Math.min(
    STANDING_DISPLAY_HEIGHT / uprightHeight,
    MASCOT_SLOT_WIDTH / frameWidth,
    MASCOT_SLOT_HEIGHT / frameHeight,
  );
  return {
    cols: metrics.cols,
    frames: metrics.frames,
    width: frameWidth * scale,
    height: frameHeight * scale,
    sheetWidth: sheetWidth * scale,
    sheetHeight: sheetHeight * scale,
    scale,
  };
}

export function getMascotFrameOffset(
  frame: number,
  layout: Pick<ReturnType<typeof getMascotLayout>, "cols" | "frames" | "width" | "height">,
) {
  "worklet";
  // Timing ends at frames, so clamp to the final valid cell instead of showing
  // a ninth row or snapping a settled pose back to the beginning of its sheet.
  const index = Number.isFinite(frame)
    ? Math.max(0, Math.min(layout.frames - 1, Math.floor(frame)))
    : 0;
  return {
    translateX: -(index % layout.cols) * layout.width,
    translateY: -Math.floor(index / layout.cols) * layout.height,
  };
}
