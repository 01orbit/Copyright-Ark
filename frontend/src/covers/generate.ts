import { MAX_COVER_BYTES } from "../../../shared/cover-protocol";

// 原作品只在浏览器里读取；生成的 WebP 缩略图才会上传。
function canvas(width = 720, height = 960) {
  const element = document.createElement("canvas");
  element.width = Math.max(1, Math.round(width));
  element.height = Math.max(1, Math.round(height));
  const context = element.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.fillStyle = "white";
  context.fillRect(0, 0, element.width, element.height);
  return { element, context };
}

async function encode(element: HTMLCanvasElement): Promise<Blob> {
  for (const quality of [0.8, 0.6, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => element.toBlob(resolve, "image/webp", quality));
    if (blob?.type === "image/webp" && blob.size <= MAX_COVER_BYTES) return blob;
  }
  throw new Error("Cannot encode cover");
}

async function picture(source: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, 960 / Math.max(width, height));
  const { element, context } = canvas(width * scale, height * scale);
  context.drawImage(source, 0, 0, element.width, element.height);
  return encode(element);
}

async function pdfCover(file: File) {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  const { default: worker } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  GlobalWorkerOptions.workerSrc = worker;
  const task = getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const passwordRequired = new Promise<never>((_, reject) => {
    task.onPassword = () => reject(new Error("Encrypted PDF requires a password"));
  });
  try {
    const pdf = await Promise.race([task.promise, passwordRequired]);
    const page = await pdf.getPage(1);
    const original = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 960 / Math.max(original.width, original.height) });
    const { element, context } = canvas(viewport.width, viewport.height);
    await page.render({ canvas: element, canvasContext: context, viewport }).promise;
    return await encode(element);
  } finally { await task.destroy(); }
}

async function textCover(file: File) {
  const { element, context } = canvas();
  context.fillStyle = "#172337";
  context.font = "22px sans-serif";
  context.fillText(file.name, 48, 56, 624);
  context.font = "20px sans-serif";
  let y = 108;
  for (const paragraph of (await file.slice(0, 16000).text()).split(/\r?\n/)) {
    let line = "";
    for (const char of paragraph) {
      if (context.measureText(line + char).width > 624) {
        context.fillText(line, 48, y);
        y += 32;
        line = "";
      }
      if (y > 900) break;
      line += char;
    }
    if (y > 900) break;
    context.fillText(line, 48, y);
    y += 32;
  }
  return encode(element);
}

async function videoCover(file: File) {
  const video = document.createElement("video");
  const url = URL.createObjectURL(file);
  video.muted = true;
  video.preload = "auto";
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => finish(new Error("Video timed out")), 15000);
      const finish = (error?: Error) => {
        clearTimeout(timeout);
        video.onloadeddata = video.onseeked = video.onerror = null;
        error ? reject(error) : resolve();
      };
      video.onerror = () => finish(new Error("Unsupported video"));
      video.onloadeddata = () => {
        const position = Number.isFinite(video.duration) ? Math.min(1, video.duration / 2) : 0;
        if (position > 0) { video.onseeked = () => finish(); video.currentTime = position; }
        else finish();
      };
      video.src = url;
    });
    return await picture(video, video.videoWidth, video.videoHeight);
  } finally { video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url); }
}

async function audioCover(file: File) {
  const audio = new AudioContext();
  try {
    const buffer = await audio.decodeAudioData(await file.arrayBuffer());
    const samples = buffer.getChannelData(0);
    const { element, context } = canvas(720, 480);
    context.fillStyle = "#172337";
    context.font = "28px sans-serif";
    context.fillText(file.name, 40, 64, 640);
    context.font = "18px sans-serif";
    context.fillText(`${Math.floor(buffer.duration / 60)}:${String(Math.floor(buffer.duration % 60)).padStart(2, "0")} · ${buffer.sampleRate} Hz`, 40, 104);
    context.fillStyle = "#2563eb";
    for (let bar = 0; bar < 128; bar++) {
      const start = Math.floor(bar * samples.length / 128);
      const end = Math.floor((bar + 1) * samples.length / 128);
      let peak = 0;
      for (let i = start; i < end; i++) peak = Math.max(peak, Math.abs(samples[i]));
      const height = Math.max(2, peak * 220);
      context.fillRect(40 + bar * 5, 290 - height / 2, 3, height);
    }
    return await encode(element);
  } finally { await audio.close(); }
}

export async function generateCover(file: File): Promise<Blob> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) {
    const image = await createImageBitmap(file);
    try { return await picture(image, image.width, image.height); }
    finally { image.close(); }
  }
  if (extension === "pdf") return pdfCover(file);
  if (extension === "txt") return textCover(file);
  if (extension === "mp4") return videoCover(file);
  if (extension === "mp3" || extension === "wav") return audioCover(file);
  throw new Error("Unsupported cover format");
}
