import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  ...(process.env.AGENDIFY_BROWSER_SMOKE === '1' ? { distDir: '.next-browser-smoke' } : {}),
};

export default nextConfig;
