/**
 * Calculates W3C relative luminance to select black or white text
 * for maximum accessibility and readability.
 */
export function getContrastColor(hex) {
  if (!hex) return '#FFFFFF';
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

  // Relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Parses incoming CSV text into an array of palette group objects.
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const themeNames = headers.slice(3); // Headers after default_hex
  const palette = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < 3) continue;

    const group = {
      tag_id: cols[0],
      label: cols[1],
      default_hex: cols[2],
      themes: {}
    };

    themeNames.forEach((tName, idx) => {
      group.themes[tName] = cols[3 + idx] || cols[2];
    });

    palette.push(group);
  }
  return { palette, themeNames };
}

/**
 * Serializes current palette data back to downloadable CSV.
 */
export function generateCSV(paletteData, themeNames = ['Theme 1']) {
  let csv = `tag_id,label,default_hex,${themeNames.join(',')}\n`;

  paletteData.forEach(group => {
    const row = [group.tag_id, `"${group.label}"`, group.default_hex];
    themeNames.forEach(tName => {
      row.push(group.themes[tName] || group.default_hex);
    });
    csv += row.join(',') + '\n';
  });

  return csv;
}
