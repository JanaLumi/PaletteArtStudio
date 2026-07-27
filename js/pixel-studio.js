/**
 * Pixel Studio Engine - Updated with deferred palette extraction
 * and custom label persistence across rescans.
 */

import { getActiveColor } from './palette.js';

let canvas = null;
let ctx = null;
let gridWidth = 32;
let gridHeight = 32;
let pixelBuffer = [];
let isDrawing = false;

// Persistent memory map for user-edited group names keyed by Hex code
const labelMemory = new Map(); 

export function initPixelStudio(containerId = 'canvas-container', w = 32, h = 32) {
  const container = document.getElementById(containerId);
  const paletteContainer = document.getElementById('palette-container');
  if (!container) return;

  gridWidth = w;
  gridHeight = h;
  pixelBuffer = new Array(gridWidth * gridHeight).fill(null);

  container.innerHTML = `
    <div class="pixel-studio-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
      <div style="position: relative;">
        <canvas id="pixel-ref-canvas" style="position: absolute; top:0; left:0; pointer-events:none;"></canvas>
        <canvas id="pixel-draw-canvas" style="position: relative; border: 1px solid #444;"></canvas>
      </div>
      <button id="btn-finish-base" class="btn-primary">Finish Base Image (Extract Groups)</button>
    </div>
  `;

  canvas = document.getElementById('pixel-draw-canvas');
  ctx = canvas.getContext('2d');

  const displaySize = 480;
  canvas.width = gridWidth;
  canvas.height = gridHeight;
  canvas.style.width = `${displaySize}px`;
  canvas.style.height = `${displaySize}px`;
  canvas.style.imageRendering = 'pixelated';

  attachEvents();

  // Initialize the palette alongside the canvas
  if (paletteContainer) {
    initPalette(paletteContainer); // <-- Replace with your project's palette setup function
  }
}

function attachEvents() {
  canvas.addEventListener('mousedown', (e) => { isDrawing = true; draw(e); });
  canvas.addEventListener('mousemove', (e) => { if (isDrawing) draw(e); });
  window.addEventListener('mouseup', () => { isDrawing = false; });
}

function getPixelCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * gridWidth);
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * gridHeight);
  return { x: Math.max(0, Math.min(gridWidth - 1, x)), y: Math.max(0, Math.min(gridHeight - 1, y)) };
}

function draw(e) {
  const { x, y } = getPixelCoords(e);
  const activeColor = getActiveColor();
  const color = activeColor ? activeColor.default_hex : '#000000';

  const index = y * gridWidth + x;
  pixelBuffer[index] = color;
  renderGrid();
}

function renderGrid() {
  ctx.clearRect(0, 0, gridWidth, gridHeight);
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const colorHex = pixelBuffer[y * gridWidth + x];
      if (colorHex) {
        ctx.fillStyle = colorHex;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/**
 * Saves a user-edited group label so it persists when rescanning artwork
 */
export function updateLabelMemory(hex, newLabel) {
  labelMemory.set(hex.toLowerCase(), newLabel);
}

/**
 * Single-pass color extraction called ONLY when user clicks "Finish Base Image"
 */
export function extractGroupsFromCanvas() {
  const uniqueHexes = new Set();
  for (let i = 0; i < pixelBuffer.length; i++) {
    if (pixelBuffer[i]) uniqueHexes.add(pixelBuffer[i].toLowerCase());
  }

  const groups = [];
  let counter = 1;

  uniqueHexes.forEach((hex) => {
    // Retain custom user label if it exists, otherwise assign "Group X"
    const label = labelMemory.get(hex) || `Group ${counter}`;
    groups.push({
      tag_id: `tag_${counter}`,
      label: label,
      default_hex: hex,
      themes: {}
    });
    counter++;
  });

  return groups;
}
