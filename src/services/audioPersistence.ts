export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)));
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Não foi possível salvar o áudio.')));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/^data:(.*?);base64$/)?.[1] ?? 'application/octet-stream';
  const binary = atob(data ?? '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}
