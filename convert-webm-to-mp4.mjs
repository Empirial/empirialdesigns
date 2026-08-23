// Converts a .webm screen recording to a web-friendly .mp4 (H.264/AAC,
// yuv420p for broad browser/Safari compatibility, faststart for progressive
// playback). Uses the static ffmpeg binary from the ffmpeg-static npm
// package — no system-wide ffmpeg install required.
//
// Usage: node convert-webm-to-mp4.mjs <input.webm> [output.mp4]
// If output is omitted, writes alongside the input with a .mp4 extension.
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const [, , input, outputArg] = process.argv;

if (!input) {
  console.error('Usage: node convert-webm-to-mp4.mjs <input.webm> [output.mp4]');
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error(`Input file not found: ${input}`);
  process.exit(1);
}

const output = outputArg || input.replace(/\.webm$/i, '.mp4');

const args = [
  '-y',
  '-i', input,
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-b:a', '160k',
  '-movflags', '+faststart',
  output,
];

console.log(`Converting:\n  ${input}\n  -> ${output}`);

const proc = spawn(ffmpegPath, args, { stdio: 'inherit' });
proc.on('exit', (code) => {
  if (code === 0) {
    const size = (fs.statSync(output).size / 1024 / 1024).toFixed(1);
    console.log(`\nDone — ${path.basename(output)} (${size} MB)`);
  } else {
    console.error(`\nffmpeg exited with code ${code}`);
    process.exit(code ?? 1);
  }
});
