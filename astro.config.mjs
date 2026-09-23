import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// User site (yuhenmeili.github.io) is served from the domain root.
export default defineConfig({
  site: 'https://yuhenmeili.github.io',
  base: '/',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
});
