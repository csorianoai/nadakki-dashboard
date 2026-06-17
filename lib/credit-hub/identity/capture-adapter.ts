"use client";

export interface CaptureResult {
  b64: string;
  mime: string;
}

export interface CaptureAdapter {
  readonly name: string;
  isAvailable(): boolean;
  capture(): Promise<CaptureResult>;
  cleanup(): void;
}

/**
 * getUserMedia adapter — dev/test fallback.
 * Captures a single frame from the front-facing camera.
 */
export const webcamAdapter: CaptureAdapter = {
  name: "webcam",

  isAvailable(): boolean {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  },

  async capture(): Promise<CaptureResult> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } },
      audio: false,
    });

    try {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play();

      // Wait for video to have dimensions
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0) {
          resolve();
          return;
        }
        video.addEventListener("loadeddata", () => resolve(), { once: true });
      });

      const canvas = document.createElement("canvas");
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      const offsetX = (video.videoWidth - size) / 2;
      const offsetY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const b64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

      return { b64, mime: "image/jpeg" };
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  },

  cleanup(): void {
    // No persistent resources to clean up
  },
};

/**
 * Truora SDK adapter — production use.
 * Lazy-loads the Truora web SDK to avoid blocking the initial bundle.
 */
export const truoraAdapter: CaptureAdapter = {
  name: "truora",

  isAvailable(): boolean {
    // Truora SDK requires getUserMedia as a baseline
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices !== "undefined" &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    );
  },

  async capture(): Promise<CaptureResult> {
    // In production, this would lazy-load the Truora Digital Identity SDK
    // and use its liveness detection flow. For now, fall back to webcam
    // capture since the actual SDK integration requires vendor credentials.
    //
    // TODO: Replace with Truora SDK when vendor integration is complete:
    // const TruoraSDK = await import("@truora/digital-identity-sdk");
    // const result = await TruoraSDK.runLiveness({ ... });
    // return { b64: result.selfieBase64, mime: "image/jpeg" };
    return webcamAdapter.capture();
  },

  cleanup(): void {
    // Truora SDK cleanup would go here
  },
};

/**
 * Select the appropriate capture adapter based on environment.
 */
export function selectAdapter(): CaptureAdapter {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    return truoraAdapter;
  }
  return webcamAdapter;
}
