/**
 * Palette Engine
 * Draws a radial arc color picker on HTML5 Canvas.
 */

let paletteCanvas = null;
let ctx = null;
let paletteData = [];
let activeColorIndex = 0;

export function initPalette(containerId = 'palette-container', initialPalette = []) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="donut-wrapper">
      <canvas id="donut-canvas" width="360" height="360"></canvas>
      <div id="donut-hub" class="donut-center-hub">
        <span id="hub-label">Select Color</span>
        <span id="hub-hex">#------</span>
      </div>
    </div>
  `;

  paletteCanvas = document.getElementById('donut-canvas');
  ctx = paletteCanvas.getContext('2d');

  // Load default fallback colors if none provided
  paletteData = initialPalette.length ? initialPalette : getDefaultPalette();

  renderDonut();
  attachEvents();
}

function getDefaultPalette() {
  return [
    { tag_id: 'color_1', label: 'Primary Hair', default_hex: '#2A2A2A' },
    { tag_id: 'color_2', label: 'Base Skin', default_hex: '#FFE0BD' },
    { tag_id: 'color_3', label: 'Shadow Tone', default_hex: '#8D5524' },
    { tag_id: 'color_4', label: 'Accent Red', default_hex: '#E91E63' },
    { tag_id: 'color_5', label: 'Canvas BG', default_hex: '#4A90E2' },
    { tag_id: 'color_6', label: 'Highlight White', default_hex: '#FFFFFF' }
  ];
}

function renderDonut() {
  if (!ctx) return;

  const total = paletteData.length;
  const centerX = paletteCanvas.width / 2;
  const centerY = paletteCanvas.height / 2;
  const outerRadius = 160;
  const innerRadius = 80;

  ctx.clearRect(0, 0, paletteCanvas.width, paletteCanvas.height);

  const angleStep = (Math.PI * 2) / total;

  paletteData.forEach((item, index) => {
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = startAngle + angleStep;

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle, false);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = item.default_hex;
    ctx.fill();

    // Highlight active selected segment with a border
    ctx.lineWidth = index === activeColorIndex ? 4 : 1;
    ctx.strokeStyle = index === activeColorIndex ? '#000000' : '#FFFFFF';
    ctx.stroke();
  });

  updateCenterHub();
}

function updateCenterHub() {
  const current = paletteData[activeColorIndex];
  if (!current) return;

  const labelEl = document.getElementById('hub-label');
  const hexEl = document.getElementById('hub-hex');

  if (labelEl) labelEl.textContent = current.label;
  if (hexEl) hexEl.textContent = current.default_hex.toUpperCase();
}

function attachEvents() {
  paletteCanvas.addEventListener('click', (e) => {
    const rect = paletteCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left - paletteCanvas.width / 2;
    const y = e.clientY - rect.top - paletteCanvas.height / 2;

    const distance = Math.sqrt(x * x + y * y);
    if (distance < 80 || distance > 160) return; // Outside arc zone

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    const total = paletteData.length;
    const angleStep = (Math.PI * 2) / total;
    activeColorIndex = Math.floor(angle / angleStep) % total;

    renderDonut();
  });
}

export function getActiveColor() {
  return paletteData[activeColorIndex];
}
