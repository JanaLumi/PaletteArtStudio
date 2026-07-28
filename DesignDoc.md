## **1\. Unified App Architecture**

Instead of three isolated apps, structure this as **one application with three workspace views**:

> * **Vector View (.svg):** Parses the XML tree, reads fill/stroke tags or CSS classes, and maps each tag to a theme slot.  
> * **Raster Bucket View (.bmp, .png, .jpg):** Features targeted selection and flood-fill swappers for standalone images.  
> * **Pixel Art Editor View:** A native drawing canvas (.bmp focus) with instant, real-time palette swapping.

## **2\. Automated Smart Theme Engine**

To auto-generate distinct, accessible themes based on contrast and saturation, use the **OKLCH color space** (rather than standard RGB or HSL).

> * **Perceptual Uniformity:** Human eyes perceive brightness differently across hues (e.g., standard HSL yellow looks brighter than blue at the same "lightness" value). OKLCH fixes this, ensuring generated colors have visual distance.  
> * **Contrast Spacing Algorithm:**  
  1. Set a fixed **Lightness (L)** and **Chroma (C)** (saturation).  
  2. Divide the 360° Hue wheel (H) by the number of tags needed (e.g., 360^\\circ / 5 \= 72^\\circ separation).  
  3. Calculate perceptual distance (\\Delta E) between neighboring colors to ensure distinct contrast.  
> * **Theme Table Structure:** Organize themes as editable rows:

| Theme Name | Tag: Hair | Tag: Skin | Tag: Background | Actions |
| :---- | :---- | :---- | :---- | :---- |
| **Default** | \#2a2a2a | \#ffe0bd | \#4a90e2 | Base |
| **Vibrant (Auto)** | oklch(0.5 0.2 30\) | oklch(0.8 0.1 80\) | oklch(0.6 0.2 200\) | Swap |
| **Custom 1** | *(Empty Swatch)* | *(Empty Swatch)* | *(Empty Swatch)* | Add Row |

## **3\. Designing a Better Pixel Art Editor**

To fix the clunky color workflows of existing apps:

### **Persistent Active Swatches**

> * Keep a pinned **Active Palette Bar** visible at all times.  
> * Automatically append used colors to an "In-Use" row with clear tooltips (e.g., "Primary Outline \- \#1A1A1A").

### **Dual Engine (Draw \+ Swap Simultaneously)**

> * Render the editor on an HTML5 \<canvas\> using an indexed array of color IDs rather than static RGB values.  
> * Changing a color in the palette dynamically updates every pixel bound to that ID in real time without redrawing the artwork.

- - -

## **1\. Tackling GIFs: Add-On vs. Built-In**

Handling GIFs as an **add-on or secondary phase** is definitely the smartest move for launch.  
When you *do* add GIF support, it directly reuses your **Pixel Art and Raster code engines**. A GIF is just a stack of pixel frames sharing a color palette.

> * **Pixel Engine:** Renders and edits the active frame.  
> * **Raster Engine:** Applies flood-fill or palette swaps across all frames at once using the file's global color table.

## **2\. Onion Skinning (Translucency) & Animation**

What you described with translucent layers is known in animation as **Onion Skinning**. Traditional animators used lightboxes; digital animators use semi-transparent overlays of the previous/next frames.  
`┌─────────────────────────────────────────────────────────────┐`  
`│                   CANVAS STACK ARCHITECTURE                 │`  
`│                                                             │`  
`│   ┌─────────────────────────────────────────────────────┐   │`  
`│   │  Layer 3: Active Frame (Current Pixel Canvas)      │   │`  
`│   ├─────────────────────────────────────────────────────┤   │`  
`│   │  Layer 2: Onion Skin (Previous Frame @ 30% Opacity) │   │`  
`│   ├─────────────────────────────────────────────────────┤   │`  
`│   │  Layer 1: Optional Reference Image / Background     │   │`  
`│   └─────────────────────────────────────────────────────┘   │`  
`└─────────────────────────────────────────────────────────────┘`

Rather than making the active drawing pixels translucent (which makes color picking tricky), standard onion skinning keeps your **active frame fully opaque**, but places a **semi-transparent copy of the previous frame behind it**.  
Instead of a full animation suite upfront, you can support this with two simple toggles in the Pixel Editor:

> * **Background Reference Image:** A toggle to display a loaded image (or previous frame) behind your main canvas.  
> * **Reference Opacity Slider:** Lets you adjust how visible that background layer is while you draw over it.

## **3\. Storage: Local Browser vs. File Exports**

To keep user artwork safe without building a costly cloud database:

### **IndexedDB (In-Browser Storage)**

This is exactly what tools like Construct 3 use. IndexedDB can store several gigabytes of data locally in the browser (far more than standard localStorage).

> * **Pros:** Automatic saving while working; project files persist across page refreshes.  
> * **Caveat:** If a user clears their browser cache or site data, it wipes the storage.

### **Universal JSON / Native File Export**

To give users 100% control and backup safety, offer a **Save Project** option that exports a lightweight .json file containing:

> 1. The pixel grid data / frame arrays.  
> 2. The custom palette slots and tag names.  
> 3. Theme definitions.

Users can download this file and drag-and-drop it back into the app anytime to resume right where they left off.

## **4\. Defending Against Scope Creep (The Roadmap)**

To keep from getting overwhelmed, divide the project into strict build phases:  
`PHASE 1: Core Engine (MVP)`  
`├── Vector SVG Tag Swapper + OKLCH Theme Generator`  
`└── Pixel Art Studio (Single Canvas, Persistent Swatches, Real-Time LUT Swap)`

`PHASE 2: Advanced Raster & Storage`  
`├── Raster Bucket Swapper (PNG/JPG Flood-Fill with Tolerance)`  
`├── IndexedDB Local Auto-Save`  
`└── Project JSON Export / Import`

`PHASE 3: Animation & GIF Expansion`  
`├── Onion Skinning (Reference Layer Opacity)`  
`└── GIF Demuxer / Re-encoder for Multi-Frame Palette Swapping`

- - -

## 1. Automated Palette Extraction (The Initial Load)
When a user uploads an existing pixel art image or finishes drawing their base image:
 1. **Scan the Image:** The app iterates through all raw pixel data on an offscreen canvas and builds a frequency map of every unique hex color present in the image.
 2. **Assign Auto-Tags:** Each unique hex color found is automatically assigned a default Tag ID (e.g., Color_1 (#1a1a1a), Color_2 (#ffe0bd), Color_3 (#4a90e2)).
 3. **Bind Pixels to Tags:** The internal pixel buffer converts from raw hex strings to these Tag IDs. Instead of saying *"this pixel is blue"*, the app now reads *"this pixel belongs to Group 3"*.
Once that binding is done, every theme row in your table simply maps replacement colors to Color_1, Color_2, Color_3, etc. Updating a theme automatically updates every pixel bound to that group across all offscreen theme previews in the right panel.
## 2. Separating Color Groups (Selection Tool vs. Split)
Split a single color group into two—for instance, if the hair and the shoes both happen to use the exact same black (#1a1a1a), but you only want to change the shoes in Theme B—adds a layer of complexity.

### How Group Splitting Will Work (When We Build It)
Instead of forcing complex selection tools immediately, the cleanest way to handle splits later is:
 * **Pick & Split:** Click a pixel or select a region with a marquee box.
 * **Re-assign Tag:** A small popover asks: *"Create new group for these pixels?"*
 * **Re-index:** The selected pixels are re-bound from Color_1 to Color_1_B. A new column dynamically drops into your theme table so you can control them independently.
### Recommendation
**Holding off on group splitting for the first running version is a smart call.**

- - -

> 1. **Direct Canvas Control:** A native HTML5 \<canvas\> and JS 2D Context (or ImageData arrays) run significantly faster in plain JavaScript without framework overhead.  
> 2. **Zero Build Step:** Three simple files (index.html, styles.css, app.js) allow you to open and run the tool directly in any browser.  
> 3. **Data formats:** CSV works well for flat, structured tabular data (like palette theme lists, color definitions, and frame indices). JSON can be reserved for nested structures if needed, such as serialized pixel array buffers for project exports.

### **1\. Handling CSV for Project Storage vs. Frame Data**

> * **Palette Themes:** CSV is straightforward for theme definitions and tag lists.  
>   `tag_id,tag_name,default_hex,theme_vibrant_hex`  
>   `1,Hair,#2A2A2A,#1E90FF`  
>   `2,Skin,#FFE0BD,#FFD700`

> * **Pixel Grid Data:** For saving multi-frame pixel art, store the pixel grid in CSV by serializing each frame as a single row containing a comma-separated array of color IDs (e.g., frame\_id,width,height,pixel\_array).

### **2\. File Organization Options**

Divide the JS into clear sub-modules:
- pixel-studio.js
- raster-studio.js
- vector-studio.js
- palette.js

Using standard ES6 native imports (\<script type="module" src="app.js"\>).
