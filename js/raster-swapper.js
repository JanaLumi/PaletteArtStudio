/**
 * Raster Swapper Engine
 * Performs bucket flood fills and global color tolerance replacements on pixel buffers.
 */

import { getActiveColor } from './palette-donut.js';

let canvas = null;
let ctx = null;
let imageWidth = 0;
let imageHeight = 0;

export function initRasterSwapper(containerId = 'canvas-container', imageSrc = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="raster-wrapper">
      <canvas id="raster-canvas"></canvas>
    </div>
  `;

  canvas = document.getElementById('raster-canvas');
  ctx = canvas.getContext('2d');

  if (imageSrc) {
    loadImage(imageSrc);
  }

  attachEvents();
}

export function loadImage(src) {
  const img = new Image();
  img.onload = () => {
    imageWidth = img.width;
    imageHeight = img.height;
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    ctx.drawImage(img, 0, 0);
  };
  img.src = src;
}

function attachEvents() {
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const startX = Math.floor(((e.clientX - rect.left) / rect.width) * imageWidth);
    const startY = Math.floor(((e.clientY - rect.top) / rect.height) * imageHeight);

    const activeColor = getActiveColor();
    if (!activeColor) return;

    floodFill(startX, startY, hexToRgb(activeColor.default_hex));
  });
}

/**
 * Queue-based Breadth-First Flood Fill on raw pixel array
 */
function floodFill(startX, startY, fillRGB) {
  const imgData = ctx.getImageData(0, 0, imageWidth, imageHeight);
  const data = imgData.data;

  const targetIndex = (startY * imageWidth + startX) * 4;
  const targetR = data[targetIndex];
  const targetG = data[targetIndex + 1];
  const targetB = data[targetIndex + 2];
  const targetA = data[targetIndex + 3];

  if (targetR === fillRGB.r && targetG === fillRGB.g && targetB === fillRGB.b) return;

  const queue = [[startX, startY]];
  const visited = new Uint8Array(imageWidth * imageHeight);

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    const idx = y * imageWidth + x;

    if (x < 0 || x >= imageWidth || y < 0 || y >= imageHeight || visited[idx]) continue;
    visited[idx] = 1;

    const pIdx = idx * 4;
    if (
      data[pIdx] === targetR &&
      data[pIdx + 1] === targetG &&
      data[pIdx + 2] === targetB &&
      data[pIdx + 3] === targetA
    ) {
      data[pIdx] = fillRGB.r;
      data[pIdx + 1] = fillRGB.g;
      data[pIdx + 2] = fillRGB.b;
      data[pIdx + 3] = 255;

      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}
