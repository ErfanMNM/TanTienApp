import { createProxyMiddleware } from 'http-proxy-middleware';
import express from 'express';

const app = express();
app.use(express.json());

app.use('/api', createProxyMiddleware({
  target: 'https://erp.mte.vn',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // ensure /api stays
    '^/': '/api/'
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
    console.log('Headers:', proxyRes.headers);
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('Origin', 'https://erp.mte.vn');
    proxyReq.setHeader('Referer', 'https://erp.mte.vn/');
  }
}));

app.listen(3001, () => {
  console.log('Test proxy running on 3001');
});
