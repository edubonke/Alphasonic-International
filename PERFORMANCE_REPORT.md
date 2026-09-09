# Alphasonic International — Performance Image Pass V7

## What changed
- Kept all original brand artwork and project photographs untouched.
- Added WebP derivatives under `assets/optimized/`.
- Added 640px and 1200px responsive versions for project photography.
- Replaced the displayed 1254×1254 header-logo JPEG with a visually identical 128px WebP derivative.
- Replaced the displayed services poster with a 960px WebP derivative.
- Added responsive `srcset`/`sizes` to project photographs.
- Added explicit width/height metadata to the main displayed assets where useful.
- Preloaded only the true hero/LCP project image.
- Lowered priority for the two secondary hero thumbnails.
- Kept the original JPEGs as the lightbox sources, so the high-resolution originals load only when a visitor opens a photo.

## Approximate image transfer comparison
Original source files referenced by the page: **2.05 MB**

Responsive derivative set if the browser selected every 640px candidate: **0.44 MB**

Responsive derivative set if the browser selected every 1200px candidate: **0.83 MB**

Actual transfer is normally lower because below-the-fold images remain lazy-loaded.

## Safety
This patch does not modify:
- logo wording
- slogans
- brand colours inside supplied artwork
- estimator JavaScript
- pricing configuration
- WhatsApp flow
- CSS layout
- original portfolio photographs

The original image files remain in the repository.
