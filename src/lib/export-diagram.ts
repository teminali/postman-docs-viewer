/**
 * Export diagram (SVG) as PNG or PDF in the browser.
 */

function svgToPngDataUrl(svg: string, scale = 2): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2d not available"));
        return;
      }
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG as image"));
    };
    img.src = url;
  });
}

export async function downloadDiagramAsPng(svg: string, filename = "flowchart.png"): Promise<void> {
  const dataUrl = await svgToPngDataUrl(svg);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function downloadDiagramAsPdf(svg: string, filename = "flowchart.pdf"): Promise<void> {
  const dataUrl = await svgToPngDataUrl(svg);
  const { default: jsPDF } = await import("jspdf");
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
  const pdf = new jsPDF({
    orientation: img.width > img.height ? "landscape" : "portrait",
    unit: "px",
    format: [img.width, img.height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, img.width, img.height);
  pdf.save(filename);
}
