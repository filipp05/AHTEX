/** @type {import('next').NextConfig} */
const base = { trailingSlash: true, images: { unoptimized: true }, reactStrictMode: true }
export default function config(phase) {
  if (phase === 'phase-development-server') return { ...base, async rewrites(){return [
    {source:'/api/:path*',destination:'http://127.0.0.1:3101/api/:path*'},
    {source:'/media/:path*',destination:'http://127.0.0.1:3101/media/:path*'},
  ]} }
  return { ...base, output: 'export' }
}
