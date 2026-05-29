/**
 * Compress an image file client-side using HTML5 Canvas.
 * Adjusts dimensions (max 1920px width/height) and JPEG quality to stay below 1MB.
 */
export async function compressImage(file: File, maxSizeInMB: number = 1): Promise<File> {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // If the file is already smaller than the max size, return it as is
  if (file.size <= maxSizeInBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Downscale image if it exceeds 1920px
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2d context from canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try compressing with decreasing quality
        let quality = 0.9;
        const attemptCompression = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Canvas export to blob failed"));
                return;
              }

              if (blob.size <= maxSizeInBytes || quality <= 0.2) {
                // Done or minimum quality reached
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Reduce quality and try again
                quality -= 0.1;
                attemptCompression();
              }
            },
            "image/jpeg",
            quality
          );
        };

        attemptCompression();
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
