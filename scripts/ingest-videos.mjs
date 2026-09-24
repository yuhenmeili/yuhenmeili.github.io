// Scan public/videos (the git-managed source of truth, mirroring workcase/)
// and regenerate poster frames plus src/data/videos.json.
//
// Usage: node scripts/ingest-videos.mjs <ffmpegDir>
//   <ffmpegDir> is the folder containing ffmpeg.exe / ffprobe.exe
//
// Adding a video: drop the file anywhere under public/videos/, then re-run
// this script. Category is derived from the top-level folder, title from the
// file name; add an entry to OVERRIDES below to fine-tune title/tags/category.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_DIR = path.join(ROOT, 'public', 'videos');
const POSTERS_DIR = path.join(ROOT, 'public', 'posters');
const DATA_OUT = path.join(ROOT, 'src', 'data', 'videos.json');

const [ffmpegDir] = process.argv.slice(2);
if (!ffmpegDir) {
  console.error('Usage: node scripts/ingest-videos.mjs <ffmpegDir>');
  process.exit(1);
}
const FFMPEG = path.join(ffmpegDir, 'ffmpeg.exe');
const FFPROBE = path.join(ffmpegDir, 'ffprobe.exe');

// Curated metadata overrides, keyed by path relative to public/videos/
// (forward slashes). Anything not listed here is auto-derived:
//   category: top-level folder (see FOLDER_CATEGORIES)
//   title:    file name without extension
//   tags:     []
const OVERRIDES = {
  // Morrow 引擎（自研，未开源）
  'Morrow/竹林漫步.mp4': { title: '竹林漫步', tags: ['Vulkan', '场景漫游'] },
  'Morrow/粒子效果.mp4': { title: '粒子效果', tags: ['Vulkan', '粒子系统'] },
  'Morrow/Heightmap地形.mp4': { title: 'Heightmap 地形', tags: ['Vulkan', '地形'] },
  'Morrow/Raymarching + FBM地形.mp4': { title: 'Raymarching + FBM 地形', tags: ['Vulkan', 'Raymarching'] },
  'Morrow/Raymarching + FBM地形2.mp4': { title: 'Raymarching + FBM 地形 · 二', tags: ['Vulkan', 'Raymarching'] },
  'Morrow/体积雾.mp4': { title: '体积雾', tags: ['Vulkan', '体积雾'] },
  'Morrow/体积雾+体积光.mp4': { title: '体积雾 + 体积光', tags: ['Vulkan', '体积雾'] },
  'Morrow/体积雾+体积光2.mp4': { title: '体积雾 + 体积光 · 二', tags: ['Vulkan', '体积雾'] },

  // MorrowUI（开源仓库展示）
  'MorrowUI/MorrowUI 3D AVM实车展示.mp4': { title: '3D AVM 实车展示', tags: ['MorrowUI', 'AVM'] },
  'MorrowUI/MorrowUI 3D AVM操作展示.mp4': { title: '3D AVM 操作展示', tags: ['MorrowUI', 'AVM'] },
  'MorrowUI/MorrowUI Controls组件效果.mp4': { title: 'Controls 组件效果', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI GLTF.mp4': { title: 'GLTF 加载', tags: ['MorrowUI', 'GLTF'] },
  'MorrowUI/MorrowUI 动画效果.mp4': { title: '动画效果', tags: ['MorrowUI', '动效'] },
  'MorrowUI/MorrowUI 图片组件.mp4': { title: '图片组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI 场景组件.mp4': { title: '场景组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI 文本组件.mp4': { title: '文本组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI 档位效果.mp4': { title: '档位效果', tags: ['MorrowUI', '动效'] },
  'MorrowUI/MorrowUI 滚动容器组件.mp4': { title: '滚动容器组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI 粒子效果.mp4': { title: '粒子效果', tags: ['MorrowUI', '粒子系统'] },
  'MorrowUI/MorrowUI 视频流组件.mp4': { title: '视频流组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/MorrowUI 进度条组件.mp4': { title: '进度条组件', tags: ['MorrowUI', '组件'] },
  'MorrowUI/顶点动画.mp4': { title: '顶点动画', tags: ['MorrowUI', '顶点着色器'] },
  'MorrowUI/高性能模糊.mp4': { title: '高性能模糊', tags: ['MorrowUI', '后处理'] },

  // Unity
  'Unity/Unity泊车演示.mp4': { title: '泊车演示', tags: ['Unity', '泊车'] },
  'Unity/Unity行车演示.mp4': { title: '行车演示', tags: ['Unity', '行车'] },

  // threejs
  'threejs/CAD渲染.mp4': { title: 'CAD 实时渲染', tags: ['Three.js', 'CAD'] },
  'threejs/TAA_1.mp4': { title: 'TAA 时域抗锯齿 · 一', tags: ['Three.js', 'TAA'] },
  'threejs/TAA_2.mp4': { title: 'TAA 时域抗锯齿 · 二', tags: ['Three.js', 'TAA'] },
  'threejs/web端超轻渲染引擎.mp4': { title: 'Web 端超轻量渲染引擎', tags: ['Three.js', '轻量化'] },
  'threejs/爱福窝家装3D.mp4': { title: '家装 3D 展示', tags: ['Three.js', '家装'] },
  'threejs/爱福窝家装平面.mp4': { title: '家装平面设计', tags: ['Three.js', '平面图'] },

  // Cesium
  'Cesium/3D空间测量.mp4': { title: '3D 空间测量', tags: ['Cesium', '空间测量'] },
  'Cesium/BIM水面效果.mp4': { title: 'BIM 水面效果', tags: ['Cesium', '水面渲染'] },
  'Cesium/DWG投影贴地.mp4': { title: 'DWG 投影贴地', tags: ['Cesium', 'GIS'] },
  'Cesium/skybox.mp4': { title: '天空盒 Skybox', tags: ['Cesium', '全景'] },
  'Cesium/倾斜摄影压平.mp4': { title: '倾斜摄影压平', tags: ['Cesium', '倾斜摄影'] },
  'Cesium/剖切.mp4': { title: '模型剖切', tags: ['Cesium', '剖切'] },
  'Cesium/动态轨迹线.mp4': { title: '动态轨迹线', tags: ['Cesium', '轨迹线'] },
  'Cesium/模型组件高亮.mp4': { title: '模型组件高亮', tags: ['Cesium', '高亮'] },
  'Cesium/模型阴影.mp4': { title: '模型实时阴影', tags: ['Cesium', 'Shadow Map'] },
  'Cesium/视频投影.mp4': { title: '视频纹理投影', tags: ['Cesium', '投影'] },
};

// Top-level folder -> default category for files without an override.
const FOLDER_CATEGORIES = {
  Morrow: 'engine',
  MorrowUI: 'morrowui',
  Unity: 'unity',
  threejs: 'threejs',
  Cesium: 'cesium',
};

function listVideos(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listVideos(path.join(dir, entry.name), rel));
    } else if (/\.(mp4|webm)$/i.test(entry.name)) {
      out.push(rel);
    }
  }
  return out.sort();
}

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

// ---- main ----
const relFiles = listVideos(VIDEOS_DIR);
if (relFiles.length === 0) {
  console.error('No videos found under public/videos');
  process.exit(1);
}

// Curated entries first (keep manifest order), then auto-derived ones.
const ordered = [
  ...Object.keys(OVERRIDES).filter((k) => relFiles.includes(k)),
  ...relFiles.filter((f) => !OVERRIDES[f]),
];

const entries = [];
for (const rel of ordered) {
  const file = path.join(VIDEOS_DIR, ...rel.split('/'));
  const info = probe(file);

  const override = OVERRIDES[rel] ?? {};
  const topFolder = rel.includes('/') ? rel.split('/')[0] : null;
  const category = override.category ?? FOLDER_CATEGORIES[topFolder] ?? 'uncategorized';
  const title = override.title ?? rel.split('/').pop().replace(/\.(mp4|webm)$/i, '');
  const tags = override.tags ?? [];

  const posterRel = rel.replace(/\.(mp4|webm)$/i, '.jpg');
  const posterOut = path.join(POSTERS_DIR, ...posterRel.split('/'));
  fs.mkdirSync(path.dirname(posterOut), { recursive: true });

  const at = Math.min(Math.max(info.duration * 0.25, 0.3), 4);
  execFileSync(FFMPEG, [
    '-y', '-ss', String(at), '-i', file,
    '-frames:v', '1', '-vf', "scale='min(960,iw)':-2", '-q:v', '4', posterOut,
  ], { stdio: 'pipe' });

  entries.push({
    title,
    category,
    tags,
    file: `videos/${rel}`,
    poster: `posters/${posterRel}`,
    quality: qualityBadge(info.height),
    duration: formatDuration(info.duration),
    width: info.width,
    height: info.height,
  });
  console.log(`ok ${rel} -> ${info.width}x${info.height} ${info.duration}s [${category}]`);
}

fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });
fs.writeFileSync(DATA_OUT, JSON.stringify(entries, null, 2) + '\n', 'utf8');

// Prune posters that no longer match any video, and drop empty poster dirs.
function prunePosters(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      prunePosters(p);
      if (fs.readdirSync(p).length === 0) fs.rmdirSync(p);
    } else if (entry.name.endsWith('.jpg')) {
      const rel = path.relative(POSTERS_DIR, p).replaceAll('\\', '/');
      const videoRel = rel.replace(/\.jpg$/i, '.mp4');
      if (!relFiles.includes(videoRel) && !relFiles.some((v) => v.replace(/\.webm$/i, '.mp4') === videoRel)) {
        fs.rmSync(p);
        console.log(`pruned stale poster ${rel}`);
      }
    }
  }
}
if (fs.existsSync(POSTERS_DIR)) prunePosters(POSTERS_DIR);

console.log(`\nWrote ${entries.length} entries to ${path.relative(ROOT, DATA_OUT)}`);
