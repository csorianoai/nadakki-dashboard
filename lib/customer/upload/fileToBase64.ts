export async function fileToBase64(file: Blob): Promise<string> {
  let buf: ArrayBuffer;
  if (typeof file.arrayBuffer === "function") {
    buf = await file.arrayBuffer();
  } else {
    buf = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error ?? new Error("file_read_failed"));
      reader.readAsArrayBuffer(file);
    });
  }
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
