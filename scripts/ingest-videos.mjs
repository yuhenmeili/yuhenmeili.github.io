// Ingest source videos from workcase/ into public/videos with ASCII-safe
// filenames, extract metadata via ffprobe, generate poster frames via ffmpeg,
// and emit src/data/videos.json for the site to import.
//
// Usage: node scripts/ingest-videos.mjs <ffmpegDir>
//   <ffmpegDir> is the folder containing ffmpeg.exe / ffprobe.exe
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'workcase');
const VIDEOS_OUT = path.join(ROOT, 'public', 'videos');
const POSTERS_OUT = path.join(ROOT, 'public', 'posters');
const DATA_OUT = path.join(ROOT, 'src', 'data', 'videos.json');

const [ffmpegDir] = process.argv.slice(2);
if (!ffmpegDir) {
  console.error('Usage: node scripts/ingest-videos.mjs <ffmpegDir>');
  process.exit(1);
}
const FFMPEG = path.join(ffmpegDir, 'ffmpeg.exe');
const FFPROBE = path.join(ffmpegDir, 'ffprobe.exe');

// Curated metadata keyed by path relative to workcase/ (forward slashes).
// category ids map to src/data/videos.ts CATEGORIES.
const MANIFEST = {
  // 自研引擎
  'skybox.mp4': { slug: 'skybox', title: '天空盒 Skybox', category: 'engine', tags: ['天空盒', '全景'] },
  '模型阴影.mp4': { slug: 'model-shadow', title: '模型实时阴影', category: 'engine', tags: ['实时阴影', 'Shadow Map'] },
  '视频投影.mp4': { slug: 'video-projection', title: '视频纹理投影', category: 'engine', tags: ['视频纹理', '投影'] },
  '顶点动画.mp4': { slug: 'vertex-animation', title: '顶点动画', category: 'engine', tags: ['顶点着色器', '动画'] },
  '高性能模糊.mp4': { slug: 'high-performance-blur', title: '高性能模糊后处理', category: 'engine', tags: ['后处理', '模糊'] },
  'PBR和TAA.mp4': { slug: 'pbr-taa', title: 'PBR 与 TAA', category: 'engine', tags: ['PBR', 'TAA'] },
  'TAA_1.mp4': { slug: 'taa-1', title: 'TAA 时域抗锯齿 · 一', category: 'engine', tags: ['TAA', '抗锯齿'] },
  'TAA_2.mp4': { slug: 'taa-2', title: 'TAA 时域抗锯齿 · 二', category: 'engine', tags: ['TAA', '抗锯齿'] },
  '自研vulkan引擎效果1.mp4': { slug: 'vulkan-engine-1', title: '自研 Vulkan 引擎 · 演示一', category: 'engine', tags: ['Vulkan', '自研引擎'] },
  '自研vulkan引擎效果2.mp4': { slug: 'vulkan-engine-2', title: '自研 Vulkan 引擎 · 演示二', category: 'engine', tags: ['Vulkan', '自研引擎'] },

  // GIS 与数字孪生
  '3D空间测量.mp4': { slug: 'spatial-measurement', title: '3D 空间测量', category: 'gis', tags: ['空间测量', '拾取'] },
  'DWG投影贴地.mp4': { slug: 'dwg-projection', title: 'DWG 投影贴地', category: 'gis', tags: ['DWG', 'GIS'] },
  '倾斜摄影压平.mp4': { slug: 'orthophoto-flatten', title: '倾斜摄影压平', category: 'gis', tags: ['倾斜摄影', '压平'] },
  '剖切.mp4': { slug: 'section-clipping', title: '模型剖切', category: 'gis', tags: ['剖切', '裁剪'] },
  '动态轨迹线.mp4': { slug: 'dynamic-trajectory', title: '动态轨迹线', category: 'gis', tags: ['轨迹线', '动效'] },

  // BIM 与 CAD
  'BIM水面效果.mp4': { slug: 'bim-water', title: 'BIM 水面效果', category: 'bimcad', tags: ['BIM', '水面渲染'] },
  '模型组件高亮.mp4': { slug: 'component-highlight', title: '模型组件高亮', category: 'bimcad', tags: ['BIM', '高亮'] },
  'CAD渲染.mp4': { slug: 'cad-rendering', title: 'CAD 实时渲染', category: 'bimcad', tags: ['CAD', '实时渲染'] },

  // 车载 HMI
  'Unity泊车演示.mp4': { slug: 'unity-parking', title: 'Unity 泊车演示', category: 'auto', tags: ['Unity', '泊车'] },
  'Unity行车演示.mp4': { slug: 'unity-driving', title: 'Unity 行车演示', category: 'auto', tags: ['Unity', '行车'] },
  'MorrowUI/3D AVM.mp4': { slug: 'avm-3d-1', title: '3D AVM 环视 · 一', category: 'auto', tags: ['AVM', '环视'] },
  'MorrowUI/3DAVM.mp4': { slug: 'avm-3d-2', title: '3D AVM 环视 · 二', category: 'auto', tags: ['AVM', '环视'] },
  'MorrowUI/MorrowUI动画效果.mp4': { slug: 'morrowui-animation', title: 'MorrowUI 动效', category: 'auto', tags: ['HMI', '动效'] },
  'MorrowUI/MorrowUI粒子效果.mp4': { slug: 'morrowui-particles', title: 'MorrowUI 粒子效果', category: 'auto', tags: ['HMI', '粒子系统'] },
  'MorrowUI/opengl文字.mp4': { slug: 'opengl-text', title: 'OpenGL 文字渲染', category: 'auto', tags: ['OpenGL', '文字渲染'] },
  'MorrowUI/档位动效/上下扫光.mp4': { slug: 'gear-sweep', title: '档位动效 · 上下扫光', category: 'auto', tags: ['HMI', '档位动效'] },
  'MorrowUI/档位动效/动态圈.mp4': { slug: 'gear-ring', title: '档位动效 · 动态圈', category: 'auto', tags: ['HMI', '档位动效'] },
  'MorrowUI/档位动效/进入.mp4': { slug: 'gear-enter', title: '档位动效 · 进入', category: 'auto', tags: ['HMI', '档位动效'] },
  'MorrowUI/档位动效/退出.mp4': { slug: 'gear-exit', title: '档位动效 · 退出', category: 'auto', tags: ['HMI', '档位动效'] },

  // Web 与应用
  'web端超轻渲染引擎.mp4': { slug: 'web-lightweight-engine', title: 'Web 端超轻量渲染引擎', category: 'web', tags: ['WebGL', '轻量化'] },
  '爱福窝家装3D.mp4': { slug: 'home-3d', title: '家装 3D 展示', category: 'web', tags: ['家装', '3D 展示'] },
  '爱福窝家装平面.mp4': { slug: 'home-plan', title: '家装平面设计', category: 'web', tags: ['家装', '平面图'] },
  'ueGUI.mp4': { slug: 'ue-gui', title: 'UE 界面演示', category: 'web', tags: ['UE', '界面'] },
};

function probe(file) {
  const out = execFileSync(FFPROBE, [
    '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file,
  ], { encoding: 'utf8' });
  const info = JSON.parse(out);
  const stream = info.streams.find((s) => s.codec_type === 'video');
  const [num, den] = (stream.avg_frame_rate || '0/1').split('/').map(Number);
  return {
    width: stream.width,
    height: stream.height,
    fps: den ? Math.round((num / den) * 100) / 100 : 0,
    duration: Math.round(Number(info.format.duration || 0) * 10) / 10,
  };
}

function qualityBadge(height) {
  if (height >= 2000) return '4K';
  if (height >= 1400) return '2K';
  if (height >= 1000) return '1080p';
  if (height >= 700) return '720p';
  return `${height}p`;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

fs.mkdirSync(VIDEOS_OUT, { recursive: true });
fs.mkdirSync(POSTERS_OUT, { recursive: true });

const entries = [];
for (const [rel, meta] of Object.entries(MANIFEST)) {
  const src = path.join(SOURCE_DIR, ...rel.split('/'));
  if (!fs.existsSync(src)) {
    console.warn(`!! missing source, skipped: ${rel}`);
    continue;
  }
  const videoOut = path.join(VIDEOS_OUT, `${meta.slug}.mp4`);
  const posterOut = path.join(POSTERS_OUT, `${meta.slug}.jpg`);

  const info = probe(src);
  fs.copyFileSync(src, videoOut);

  const at = Math.min(Math.max(info.duration * 0.25, 0.3), 4);
  execFileSync(FFMPEG, [
    '-y', '-ss', String(at), '-i', src,
    '-frames:v', '1', '-vf', "scale='min(960,iw)':-2", '-q:v', '4', posterOut,
  ], { stdio: 'pipe' });

  entries.push({
    ...meta,
    file: `videos/${meta.slug}.mp4`,
    poster: `posters/${meta.slug}.jpg`,
    quality: qualityBadge(info.height),
    duration: formatDuration(info.duration),
    width: info.width,
    height: info.height,
  });
  console.log(`ok ${rel} -> ${meta.slug}.mp4 ${info.width}x${info.height} ${info.duration}s`);
}

fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });
fs.writeFileSync(DATA_OUT, JSON.stringify(entries, null, 2) + '\n', 'utf8');
console.log(`\nWrote ${entries.length} entries to ${path.relative(ROOT, DATA_OUT)}`);
