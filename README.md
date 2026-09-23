# MORROW — Personal Graphics Showcase & Blog

个人视频作品 + 博客展示网站，基于 [astro-darkness](https://github.com/kpab/astro-darkness) 模板改造（深色主题 + Three.js 星空背景），部署于 GitHub Pages：<https://yuhenmeili.github.io>

## 结构

- `src/pages/videos.astro` — 视频展示页：分类标签筛选 + 视频卡片网格（悬停静音预览、点击弹窗播放、大文件加载进度条）
- `src/data/videos.json` — 视频清单（由脚本生成：路径、标题、分类、标签、分辨率、时长）
- `src/data/videos.ts` — 分类定义（含 MorrowUI 开源仓库链接）与类型
- `public/videos/` `public/posters/` — 视频与封面，**目录结构与 workcase 完全一致**（本目录由 git 管理）
- `src/content/blog/` — 博客文章（Markdown）
- `scripts/ingest-videos.mjs` — 扫描 public/videos 生成封面与清单

## 新增 / 删除视频

1. 把视频放进 `public/videos/`（建议按子目录归类，如 `public/videos/MorrowUI/`），删除视频直接删文件
2. 在 `scripts/ingest-videos.mjs` 的 `OVERRIDES` 中按相对路径补充 `{ title, category, tags }`（不写则按顶层目录自动归类、以文件名为标题）
3. 运行（需要本地 ffmpeg/ffprobe）：

   ```bash
   node scripts/ingest-videos.mjs <ffmpeg-bin 目录>
   ```

   脚本会递归扫描 `public/videos`，抽帧生成封面 `public/posters/**`、探测分辨率/时长并更新 `videos.json`，同时清理失效封面。

`workcase/` 只是本地原始素材（已 gitignore），站点内容以 `public/videos/` 为准。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 产物在 dist/
```

## 部署

推送至 `main` 分支后，`.github/workflows/deploy.yml` 自动构建并发布到 GitHub Pages（站点为用户页，`base: '/'`）。

注意：仓库内 `public/videos/` 约 300MB，GitHub Pages 单文件上限 100MB（当前最大约 97MB，接近上限），站点总量需保持在 1GB 以内；新增大视频前请先压缩。
