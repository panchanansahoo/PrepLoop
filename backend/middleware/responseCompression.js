import compression from 'compression';

export const smartCompression = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    if (res.getHeader('Content-Type')?.includes('audio')) return false;
    return compression.filter(req, res);
  },
  level: process.env.NODE_ENV === 'production' ? 6 : 4,
  threshold: 1024,
  memLevel: 8,
});
