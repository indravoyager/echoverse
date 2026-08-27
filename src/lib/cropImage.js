export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues
    image.src = url;
  });

export async function getCroppedImg(imageSrc, pixelCrop, targetSize = 256) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  // Set the canvas to the desired output size
  const destWidth = targetSize > 0 ? targetSize : pixelCrop.width;
  const destHeight = targetSize > 0 ? targetSize : pixelCrop.height;

  canvas.width = destWidth;
  canvas.height = destHeight;

  // Draw the cropped image onto the canvas, resizing it to targetSize
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    destWidth,
    destHeight
  );

  // Return the base64 string
  return canvas.toDataURL('image/jpeg', 0.85);
}
