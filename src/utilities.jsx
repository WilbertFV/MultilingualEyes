// src/utilities.js
import { translate } from "./translations.jsx";

/**
 * Draws rectangles around detected objects and displays their labels.
 *
 * @param {Array} detections - Array of detected objects.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context for the canvas.
 * @param {string} selectedLanguage - The selected language code for translations.
 * @param {Object} options - (Optional) Additional drawing options.
 */
export const drawRect = (detections, ctx, selectedLanguage, options = {}) => {
  const {
    padding = 2,
    color = "red",
    lineWidth = 2,
    font = "18px Arial",
  } = options;

  if (!Array.isArray(detections)) {
    console.error("Invalid detections array");
    return;
  }

  detections.forEach((prediction) => {
    // Extract bounding box coordinates
    let [x, y, width, height] = prediction.bbox;
    const originalText = prediction.class;

    let translatedText = originalText;
    try {
      translatedText = translate(originalText, selectedLanguage);
    } catch (error) {
      console.error("Translation error:", error);
    }
    const text = `${translatedText} ${Math.round(prediction.score * 100)}%`;

    // Apply padding adjustments
    x += padding;
    y += padding;
    width -= 2 * padding;
    height -= 2 * padding;

    // Set canvas styles
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.font = font;
    ctx.fillStyle = color;

    // Draw text and rectangle
    ctx.beginPath();
    ctx.fillText(text, x, y > 10 ? y - 5 : 10);
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.closePath();
  });
};
