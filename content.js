// contentScript.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "takeScreenshot") {
    const { scrollHeight, clientHeight } = document.documentElement;
    const devicePixelRatio = window.devicePixelRatio || 1;

    let capturedHeight = 0;
    let capturedImages = [];

    // Disable sticky elements before capture
    const stickyEls = [];
    document.querySelectorAll("*").forEach(el => {
      const style = getComputedStyle(el);
      if (style.position === "sticky") {
        stickyEls.push({ el, originalPosition: el.style.position });
        el.style.position = "static"; // disable sticky
      }
    });

    const captureAndScroll = () => {
      const scrollAmount = clientHeight * devicePixelRatio;

      chrome.runtime.sendMessage({ action: "captureVisibleTab", pixelRatio: devicePixelRatio }, (dataUrl) => {
        capturedHeight += scrollAmount;

        if (capturedHeight < scrollHeight * devicePixelRatio) {
          capturedImages.push(dataUrl);
          // Scroll to the next part of the page
          window.scrollTo(0, capturedHeight / devicePixelRatio);
          setTimeout(captureAndScroll, 2000); // delay to allow scroll/render
        } else {
          capturedImages.push(dataUrl); // capture last part

          // Restore sticky elements after capture
          stickyEls.forEach(({ el, originalPosition }) => {
            el.style.position = originalPosition || "";
          });

          // Return all captured images
          sendResponse({ dataUrl: capturedImages });
        }
      });
    };

    // Start capturing and scrolling
    captureAndScroll();

    return true; // async response
  }
});
