/**
 * Main Application Router & Group Table UI Engine
 */

import { getContrastColor, generateCSV } from './csv-parser.js';
import { initPixelStudio, extractGroupsFromCanvas, updateLabelMemory } from './pixel-studio.js';

let activePalette = [];
let activeThemes = ['Theme 1'];

document.addEventListener('DOMContentLoaded', () => {
  // Global click listener for navigation buttons and app actions
  document.addEventListener('click', (e) => {
    console.log('Clicked element:', e.target, 'Found modeTarget:', modeTarget);
    // 1. Navigation: Handle landing page buttons reading data-mode
    const navBtn = e.target.closest('[data-mode]');
    if (modeTarget) {
      const targetMode = modeTarget.dataset.mode;
      console.log('Target mode detected:', targetMode);
      switchView(targetMode);
      return;
    }
/*
    if (navBtn) {
      const targetMode = navBtn.dataset.mode; // e.g., "pixel" or "palette"
      switchView(targetMode);
      return;
    } */
    // 2. Navigation: Handle generic back buttons
    if (e.target.closest('.btn-back')) {
      switchView('landing');
      return;
    }

    // 3. Action: Handle "Finish Base Image" extraction button
    if (e.target && e.target.id === 'btn-finish-base') {
      activePalette = extractGroupsFromCanvas();
      renderGroupTable(activePalette, activeThemes);
    }
  });
});

/**
 * Switches active section view and initializes engines dynamically
 */
export function switchView(targetMode) {
  console.log('switchView called with:', targetMode);
  // Hide all view sections
  document.querySelectorAll('.view').forEach(section => {
    section.classList.add('hidden');
  });

  // Show selected view
  const targetSection = document.getElementById(targetMode);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // Initialize studio engine when entering pixel mode
  if (targetMode === 'pixel') {
    initPixelStudio('canvas-container', 32, 32);
  }
}

/**
 * Renders space-saving group textboxes styled with base hex backgrounds & dynamic text contrast
 */
export function renderGroupTable(palette, themeNames) {
  const container = document.getElementById('palette-container');
  if (!container) return;

  let html = `
    <div class="theme-table-wrapper">
      <div class="table-actions" style="margin-bottom: 8px;">
        <button id="btn-download-csv" class="btn-secondary">Download CSV</button>
      </div>
      <table class="theme-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Group Label (Base Color)</th>
            ${themeNames.map(t => `<th><input type="text" class="theme-header-input" value="${t}" /></th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  palette.forEach((group) => {
    const bgHex = group.default_hex;
    const textColor = getContrastColor(bgHex);

    html += `
      <tr>
        <td style="padding: 4px;">
          <input 
            type="text" 
            class="group-label-input" 
            data-hex="${bgHex}"
            value="${group.label}" 
            style="background-color: ${bgHex}; color: ${textColor}; border: 1px solid #ccc; padding: 6px 10px; border-radius: 4px; font-weight: bold; width: 100%;"
          />
        </td>
        ${themeNames.map(tName => `
          <td style="text-align: center; padding: 4px;">
            <input type="color" value="${group.themes[tName] || bgHex}" data-tag="${group.tag_id}" data-theme="${tName}" />
          </td>
        `).join('')}
      </tr>
    `;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;

  attachTableListeners();
}

function attachTableListeners() {
  // Store custom label updates into persistent memory immediately upon editing
  document.querySelectorAll('.group-label-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const hex = e.target.dataset.hex;
      const newLabel = e.target.value;
      updateLabelMemory(hex, newLabel);
    });
  });

  // Handle CSV Download
  const dlBtn = document.getElementById('btn-download-csv');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const csvStr = generateCSV(activePalette, activeThemes);
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'palette-theme.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
