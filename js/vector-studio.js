/**
 * Vector Engine
 * Reads SVG files, extracts tags/classes, and handles live attribute recoloring.
 */

let svgContainer = null;
let currentSvgDoc = null;

export function initVectorStudio(containerId = 'canvas-container', svgString = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<div id="vector-svg-wrapper" class="svg-display"></div>`;
  svgContainer = document.getElementById('vector-svg-wrapper');

  if (svgString) {
    loadSVG(svgString);
  }
}

export function loadSVG(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.querySelector('svg');

  if (!svgElement) {
    console.error('Invalid SVG content provided.');
    return;
  }

  svgContainer.innerHTML = '';
  svgContainer.appendChild(svgElement);
  currentSvgDoc = svgElement;

  const tags = extractTags(svgElement);
  return tags;
}

/**
 * Scans SVG elements for data-swatch, class, or fill properties
 */
function extractTags(svgElement) {
  const elements = svgElement.querySelectorAll('*');
  const tagsFound = new Map();

  elements.forEach((el) => {
    const swatchId = el.getAttribute('data-swatch') || el.getAttribute('class');
    const fill = el.getAttribute('fill');

    if (swatchId) {
      tagsFound.set(swatchId, fill || '#000000');
    }
  });

  return Array.from(tagsFound.entries()).map(([tag_id, default_hex]) => ({
    tag_id,
    label: tag_id.replace(/[-_]/g, ' '),
    default_hex
  }));
}

export function swapVectorColor(tagId, newHex) {
  if (!currentSvgDoc) return;

  // Search by data-swatch attribute or class name
  const targets = currentSvgDoc.querySelectorAll(`[data-swatch="${tagId}"], .${tagId}`);
  targets.forEach((el) => {
    if (el.hasAttribute('stroke')) {
      el.setAttribute('stroke', newHex);
    } else {
      el.setAttribute('fill', newHex);
    }
  });
}
