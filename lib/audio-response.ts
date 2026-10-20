type AudioFileResponseData = {
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
};

export function createAudioResponse(audio: AudioFileResponseData | undefined) {
  if (!audio?.fileUrl) return new Response("Audio not found.", { status: 404 });

  const match = /^data:audio\/(mpeg|wav|x-wav|mp4|aac|ogg|flac|webm);base64,([A-Za-z0-9+/=]+)$/.exec(audio.fileUrl);
  if (!match) return new Response("Audio is unavailable.", { status: 404 });

  const decoded = Buffer.from(match[2], "base64");
  const body = new Uint8Array(decoded.byteLength);
  body.set(decoded);
  const extension = audio.fileName?.split(".").pop() || match[1];
  const fileName = audio.fileName || `audio.${extension}`;

  return new Response(body, {
    headers: {
      "Content-Type": audio.fileType || `audio/${match[1]}`,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
