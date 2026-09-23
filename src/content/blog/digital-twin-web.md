---
title: 'Digital Twins: Rendering a City in a Browser Tab'
description: 'What it takes to stream massive GIS and BIM scenes to the web — tiling, LOD and lightweight engine design'
pubDate: 2026-03-02
tags: ['gis', 'webgl', 'digital-twin', 'bim']
---

# Digital Twins: Rendering a City in a Browser Tab

A digital twin promises the physical world in a window: orthophotos, oblique photogrammetry, BIM models, live sensor feeds. The browser is the delivery vehicle everyone already has — but a browser tab gives you one process, a JavaScript budget and a GPU that other tabs are sharing.

## The Data Is the Problem

Rendering a tiled terrain is a solved problem. Streaming *the right tiles* is not:

- **Tiles & LOD**: hierarchical tiling with screen-space error metrics keeps the GPU fed without over-fetching
- **Compression**: draco/meshopt-style geometry plus texture atlases cuts transfer sizes by an order of magnitude
- **Flattening**: oblique photogrammetry often needs to be "pressed flat" so vector data and models can sit on top of it

## Lightweight Beats Full-featured

For web delivery we built a deliberately small engine: no scene graph ceremony, frustum culling first, draw call batching everywhere. The goal is not feature parity with a desktop renderer — it's a stable 60fps on the median office laptop.

## Why It's Worth It

When a DWG drawing drapes onto terrain, or a BIM component highlights on hover inside a browser, non-experts suddenly *read* the built environment. That's the quiet superpower of web graphics: zero install, maximal reach.
