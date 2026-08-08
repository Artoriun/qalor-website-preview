import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base is '/' for a custom domain served from its document root (qalor.nl via FTP).
// '/qalor/' was a GitHub Pages project-site path this repo no longer deploys to —
// verify against the live host's actual document root before merging.
export default defineConfig({
  plugins: [react()],
  base: '/',
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
