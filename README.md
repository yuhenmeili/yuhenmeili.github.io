# MORROW — Personal Graphics Showcase & Blog

个人视频作品 + 博客展示网站，基于 [astro-darkness](https://github.com/kpab/astro-darkness) 模板改造（深色主题 + Three.js 星空背景），部署于 GitHub Pages：<https://yuhenmeili.github.io>

## 结构

- `src/pages/videos.astro` — 视频展示页：分类标签筛选 + 视频卡片网格（悬停静音预览、点击弹窗播放）
- `src/data/videos.json` — 视频清单（由脚本生成：路径、标题、分类、标签、分辨率、时长）
- `src/data/videos.ts` — 分类定义与类型
- `public/videos/` `public/posters/` — 视频与封面（文件名为 ASCII slug，保证 Pages 兼容）
- `src/content/blog/` — 博客文章（Markdown）
- `scripts/ingest-videos.mjs` — 视频入库脚本

## 新增一个视频

1. 在 `scripts/ingest-videos.mjs` 的 `MANIFEST` 中加一行：源文件相对路径 → `{ slug, title, category, tags }`
2. 运行（需要本地 ffmpeg/ffprobe）：

   ```bash
   node scripts/ingest-videos.mjs <ffmpeg-bin 目录>
   ```

   脚本会拷贝视频到 `public/videos/<slug>.mp4`、抽帧生成封面 `public/posters/<slug>.jpg`、探测分辨率/时长并更新 `videos.json`。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
```

## 部署

推送至 `main` 分支后，`.github/workflows/deploy.yml` 自动构建并发布到 GitHub Pages（站点为用户页，`base: '/'`）。

注意：仓库内 `public/videos/` 约 300MB，GitHub Pages 单文件上限 100MB（当前最大约 97MB，接近上限），站点总量需保持在 1GB 以内；新增大视频前请先压缩。
