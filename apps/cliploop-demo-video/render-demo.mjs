import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const outFile = resolve(
  '/root/projects/cliploop/apps/cliploop-demo-video/dist/cliploop-v0.1.0-demo.mp4',
);

await mkdir(dirname(outFile), { recursive: true });

const ffmpegArgs = [
  '-y',
  '-f',
  'lavfi',
  '-i',
  'color=c=black:s=1920x1080:r=30:d=48',
  '-vf',
  [
    "drawtext=fontcolor=white:fontsize=58:x=(w-text_w)/2:y=140:text='ClipLoop v0.1.0'",
    "drawtext=fontcolor=white:fontsize=34:x=(w-text_w)/2:y=220:text='Open Video Workflow Layer'",
    "drawtext=fontcolor=white:fontsize=28:x=(w-text_w)/2:y=320:text='Turn product updates into short-form promo videos.'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,5,10)':text='npx @talocode/cliploop'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,11,16)':text='cliploop init'",
    "drawtext=fontcolor=white:fontsize=28:x=160:y=520:enable='between(t,11,16)':text='Create a local video workflow.'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,17,22)':text='cliploop script --update \"we shipped Codra v0.1.5\"'",
    "drawtext=fontcolor=white:fontsize=28:x=160:y=520:enable='between(t,17,22)':text='Turn product updates into a launch script.'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,23,28)':text='cliploop storyboard --script .cliploop/scripts/latest.md'",
    "drawtext=fontcolor=white:fontsize=28:x=160:y=520:enable='between(t,23,28)':text='Generate a structured video storyboard.'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,29,34)':text='cliploop render'",
    "drawtext=fontcolor=white:fontsize=28:x=160:y=520:enable='between(t,29,34)':text='Render a simple promo video locally.'",
    "drawtext=fontcolor=white:fontsize=38:x=160:y=440:enable='between(t,35,40)':text='cliploop export x'",
    "drawtext=fontcolor=white:fontsize=28:x=160:y=520:enable='between(t,35,40)':text='Prepare video + launch copy for X.'",
    "drawtext=fontcolor=white:fontsize=30:x=160:y=760:enable='between(t,41,44)':text='No login. No hosted service. No closed workflow.'",
    "drawtext=fontcolor=white:fontsize=30:x=160:y=820:enable='between(t,41,44)':text='Open-source video workflow for builders.'",
    "drawtext=fontcolor=white:fontsize=34:x=(w-text_w)/2:y=920:enable='between(t,45,48)':text='ClipLoop — Video workflow for indie app builders'",
    "drawtext=fontcolor=white:fontsize=26:x=(w-text_w)/2:y=975:enable='between(t,45,48)':text='Part of Talocode.'",
  ].join(','),
  '-c:v',
  'libx264',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  outFile,
];

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn('ffmpeg', ffmpegArgs, { stdio: 'inherit' });
  child.on('error', rejectPromise);
  child.on('exit', code => {
    if (code === 0) resolvePromise();
    else rejectPromise(new Error(`ffmpeg exited with code ${code}`));
  });
});

console.log(outFile);
