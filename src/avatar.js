/**
 * THE TULIP PROJECT - Procedural Avatar Generator
 * Generates a high-end abstract geometric profile avatar dataURL.
 */

export function generateAvatarDataURL() {
  const canvas = document.createElement('canvas');
  const logicalSize = 64;
  const pixelRatio = 4;
  canvas.width = logicalSize * pixelRatio;
  canvas.height = logicalSize * pixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 64, 64);
  grad.addColorStop(0, '#111827');
  grad.addColorStop(1, '#1f2937');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  // Soft glowing orb in the center
  const orb = ctx.createRadialGradient(32, 32, 2, 32, 32, 24);
  orb.addColorStop(0, 'rgba(88, 166, 255, 0.7)');
  orb.addColorStop(0.5, 'rgba(57, 197, 207, 0.3)');
  orb.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb;
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.fill();

  // Abstract lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(32, 32, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.moveTo(32, 12);
  ctx.lineTo(32, 52);
  ctx.moveTo(12, 32);
  ctx.lineTo(52, 32);
  ctx.stroke();

  // Tiny highlight dots
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(32, 32, 2.5, 0, Math.PI * 2);
  ctx.arc(32, 12, 1.5, 0, Math.PI * 2);
  ctx.arc(32, 52, 1.5, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL();
}
