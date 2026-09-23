---
title: 'TAA: Temporal Anti-aliasing, Explained Simply'
description: 'Why real-time renderers borrow pixels from the past — how temporal accumulation trades time for smooth edges'
pubDate: 2026-08-20
tags: ['TAA', 'rendering', 'anti-aliasing']
---

# TAA: Temporal Anti-aliasing, Explained Simply

Aliasing is the oldest enemy of real-time rendering: geometry edges shimmer, thin details crawl, and specular highlights spark like static. MSAA fixes edges but costs bandwidth and does nothing for shader aliasing. Temporal anti-aliasing (TAA) takes a different route — **borrow pixels from previous frames**.

## The Core Idea

Each frame, the camera is jittered by a sub-pixel offset. Every frame therefore samples the scene at a slightly different location. TAA blends the current frame with a history of reprojected previous frames, effectively averaging many samples over time:

- **Reprojection**: for each pixel, use the motion vector (previous + current camera matrices) to find where the same surface point was last frame.
- **Accumulation**: blend history and current color with a small current-frame weight.
- **Disocclusion handling**: reject or clamp history where it is no longer valid — that's where most of the engineering lives.

## Where It Breaks

Ghosting behind moving objects, softening under motion, and flickering thin geometry are all symptoms of history reuse going wrong. Modern variants (TAAU, DLSS-style upscalers) add better rejection heuristics and deterministic jitter patterns to keep the image stable.

## Takeaways

TAA is a reminder that in real-time graphics, **time is a resource**. Spent well, a few blended frames look better than one perfect frame ever could at the same cost.
