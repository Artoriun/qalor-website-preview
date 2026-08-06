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
  },
  // `vite preview` (production build) has its own separate allowlist from `vite dev`.
  preview: {
    allowedHosts: ['localhost', '.trycloudflare.com'],
  },
});
