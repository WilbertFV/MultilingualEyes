import { translate } from "./translations.jsx";

/**
 * Draws rectangles around detected objects and displays their labels.
 * 
 * @param {Array} detections - Array of detected objects.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context for the drawing surface of a canvas.
 * @param {string} selectedLanguage - The selected language code for translations.
 */
export const drawRect = (detections, ctx, selectedLanguage) => {
  detections.forEach((prediction) => {
    // Get prediction results
    let [x, y, width, height] = prediction['bbox'];
    const originalText = prediction['class'];

    // Translate the detected label to the selected language
    const translatedText = translate(originalText, selectedLanguage);
    const text = `${translatedText} ${Math.round(prediction['score'] * 100)}%`;

    // Adjustments to make the box smaller
    const padding = 2;  // You can adjust this value as required
    x += padding;
    y += padding;
    width -= 2 * padding;
    height -= 2 * padding;

    // Set styling
    const color = 'red';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;  // You can adjust the line width
    ctx.font = '18px Arial';
    ctx.fillStyle = color;

    // Draw rectangles and text
    ctx.beginPath();
    ctx.fillText(text, x, y > 10 ? y - 5 : 10); // Avoid drawing text too close to the top edge
    ctx.rect(x, y, width, height);
    ctx.stroke();
    ctx.closePath();
  });
};
