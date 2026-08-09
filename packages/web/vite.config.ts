import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base is '/' for a custom domain served from its document root (qalor.nl via FTP).
//
// Overridable via VITE_BASE for the GitHub Pages preview, which is served from a project
// subpath ('/qalor-website-preview/'). Read here rather than passed as `vite build --base`
// so that `vite build` and `vite preview` agree: preview reads this config, not the build's
// CLI flags, and a mismatch means scripts/prerender.mjs boots a page whose asset URLs all
// 404 — capturing an empty shell instead of failing loudly.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  server: {
    allowedHosts: [
      'localhost',
      '192.168.10.23',
      '.loca.lt', // Allow all localtunnel subdomains
      '.ngrok.io', // Allow ngrok domains for future use
      '.trycloudflare.com', // Allow Cloudflare quick tunnels
    ],
    // Local dev only — VITE_API_URL is what production reads instead (see lib/api.ts).
    // Proxying avoids CORS entirely for `npm run dev`, and keeps the API's own port out of
    // sight, matching how the built site only ever talks to one origin.
    proxy: {
      '/api': { target: `http://localhost:${process.env.API_PORT ?? 4000}`, changeOrigin: true },
    },
  },
  // `vite preview` (production build) has its own separate allowlist from `vite dev`.
  preview: {
    allowedHosts: ['localhost', '.trycloudflare.com'],
  },
});
