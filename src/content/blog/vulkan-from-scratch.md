---
title: 'A Vulkan Renderer from Scratch: What I Wish I Knew'
description: 'Lessons from building a custom Vulkan engine — synchronization, descriptor management and the frames-in-flight mental model'
pubDate: 2026-06-10
tags: ['vulkan', 'engine', 'graphics-api']
---

# A Vulkan Renderer from Scratch: What I Wish I Knew

Building a custom Vulkan engine is famously verbose — a triangle takes a thousand lines. But the verbosity is not the hard part. The hard part is that Vulkan asks you to make **every decision the driver used to hide**.

## Frames in Flight

The single most clarifying idea: the CPU is always N frames ahead of the GPU. Every resource falls into one of three buckets:

1. **Per-frame** — constant buffers, dynamic descriptors, swapped every frame
2. **Per-image (swapchain)** — framebuffers tied to the swapchain image
3. **Persistent** — static meshes, textures, pipelines

Get this classification wrong and you get the classic "works on my machine, flickers on yours" bug.

## Descriptors Are the Real Cost

Pipeline barriers get all the attention, but descriptor set management is where performance lives. Bind-once, draw-many layouts, descriptor indexing, and pushing constants instead of tiny uniform updates made the biggest difference in my engine.

## What It Enables

Once the boilerplate settles, Vulkan pays you back: render passes become explicit, async compute becomes reachable, and features like GPU-driven culling stop being black boxes. The engine demos on this site — skybox, shadows, TAA — all run on that foundation.
