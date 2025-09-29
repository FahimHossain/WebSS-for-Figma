document.getElementById("takeScreenshotBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { action: "takeScreenshot" }, (response) => {
      const images = response.dataUrl;

      if (images.length === 0) {
        console.error("No images captured.");
        return;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const segmentHeightMax = 4096;

      const firstImage = new Image();
      firstImage.onload = () => {
        const fullWidth = firstImage.width;
        const fullHeight = images.length * firstImage.height;

        canvas.width = fullWidth;
        canvas.height = fullHeight;

        let imagesLoaded = 0;

        const drawImageOnCanvas = (image, index) => {
          context.drawImage(image, 0, index * firstImage.height);
          imagesLoaded++;

          if (imagesLoaded === images.length) {
            // Splitting full canvas into chunks
            const totalSegments = Math.ceil(fullHeight / segmentHeightMax);

            for (let i = 0; i < totalSegments; i++) {
              const remainingHeight = fullHeight - (segmentHeightMax * i);
              const chunkHeight = remainingHeight > segmentHeightMax ? segmentHeightMax : remainingHeight;

              const chunkCanvas = document.createElement("canvas");
              chunkCanvas.width = fullWidth;
              chunkCanvas.height = chunkHeight;

              const chunkCtx = chunkCanvas.getContext("2d");
              chunkCtx.drawImage(
                canvas,
                0, i * segmentHeightMax, fullWidth, chunkHeight,
                0, 0, fullWidth, chunkHeight
              );

              chunkCanvas.toBlob(blob => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `fullpage_screenshot_part_${i + 1}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }, "image/png");
            }
          }
        };

        images.forEach((dataUrl, index) => {
          const image = new Image();
          image.onload = () => drawImageOnCanvas(image, index);
          image.src = dataUrl;
        });
      };

      firstImage.src = images[0];
    });
  });
});
