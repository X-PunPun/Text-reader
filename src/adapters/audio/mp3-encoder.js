/**
 * Exportación del audio leído a un archivo descargable.
 *
 * Los motores locales devuelven WAV, que para un texto largo ocupa decenas de
 * megas. Aquí se decodifica ese WAV, se junta todo en una sola pista y se
 * codifica a MP3, que baja el tamaño a una décima parte y abre en cualquier
 * reproductor. Si el codificador no se puede cargar, se entrega WAV.
 */

const LAME_URL = "https://cdn.jsdelivr.net/npm/@breezystack/lamejs@1.2.7/+esm";
const SAMPLES_PER_FRAME = 1152;

/** Convierte los blobs de audio en una sola pista mono de muestras Float32. */
export async function decodeAndJoin(blobs) {
  const Context = window.AudioContext || window.webkitAudioContext;
  const context = new Context();

  try {
    const tracks = [];
    let rate = 0;

    for (const blob of blobs) {
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      rate = rate || buffer.sampleRate;
      tracks.push(buffer.getChannelData(0));
    }

    const total = tracks.reduce((sum, track) => sum + track.length, 0);
    const joined = new Float32Array(total);
    let at = 0;
    tracks.forEach((track) => {
      joined.set(track, at);
      at += track.length;
    });

    return { samples: joined, sampleRate: rate || 22050 };
  } finally {
    context.close?.();
  }
}

/**
 * Cambia la frecuencia de muestreo de la pista.
 *
 * Hace falta para los perfiles de alta calidad: a 22,05 kHz el MP3 no puede
 * pasar de 160 kbps, así que sin esto pedir 320 devolvía el mismo archivo
 * que pedir 192.
 */
export async function resample(track, targetRate) {
  if (!targetRate || targetRate === track.sampleRate) return track;

  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const length = Math.ceil((track.samples.length * targetRate) / track.sampleRate);
  const context = new Offline(1, length, targetRate);

  const buffer = context.createBuffer(1, track.samples.length, track.sampleRate);
  buffer.copyToChannel(track.samples, 0);

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();

  const rendered = await context.startRendering();
  return { samples: rendered.getChannelData(0), sampleRate: rendered.sampleRate };
}

function toInt16(samples) {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    pcm[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return pcm;
}

/**
 * @param {{ samples: Float32Array, sampleRate: number }} track
 * @param {number} bitrate kbps
 * @returns {Promise<Blob>} MP3 mono.
 */
export async function encodeMp3(track, bitrate, onProgress) {
  const { samples, sampleRate } = track;
  const { Mp3Encoder } = await import(/* @vite-ignore */ LAME_URL);
  const encoder = new Mp3Encoder(1, sampleRate, bitrate);
  const pcm = toInt16(samples);
  const parts = [];

  for (let i = 0; i < pcm.length; i += SAMPLES_PER_FRAME) {
    const frame = encoder.encodeBuffer(pcm.subarray(i, i + SAMPLES_PER_FRAME));
    if (frame.length) parts.push(new Uint8Array(frame));
    if (onProgress && i % (SAMPLES_PER_FRAME * 200) === 0) {
      onProgress(Math.round((i / pcm.length) * 100));
    }
  }

  const tail = encoder.flush();
  if (tail.length) parts.push(new Uint8Array(tail));

  return new Blob(parts, { type: "audio/mpeg" });
}

/**
 * WAV mono sin comprimir. 16 bits es lo habitual; 24 bits es lo que piden los
 * editores de audio para seguir trabajando sin acumular pérdidas.
 *
 * @param {{ samples: Float32Array, sampleRate: number }} track
 * @param {number} [bitDepth] 16 o 24
 * @returns {Blob}
 */
export function encodeWav({ samples, sampleRate }, bitDepth = 16) {
  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const dataBytes = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const text = (at, value) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(at + i, value.charCodeAt(i));
  };

  text(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);                            // PCM
  view.setUint16(22, 1, true);                            // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);  // bytes por segundo
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  text(36, "data");
  view.setUint32(40, dataBytes, true);

  let at = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));

    if (bitDepth === 24) {
      const scaled = Math.round(value < 0 ? value * 0x800000 : value * 0x7fffff);
      view.setUint8(at, scaled & 0xff);
      view.setUint8(at + 1, (scaled >> 8) & 0xff);
      view.setUint8(at + 2, (scaled >> 16) & 0xff);
      at += 3;
    } else {
      view.setInt16(at, value < 0 ? value * 0x8000 : value * 0x7fff, true);
      at += 2;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}
