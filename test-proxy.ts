import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(express.json());

app.use(
  '/api',
  createProxyMiddleware({
    target: 'https://erp.mte.vn',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api',
      '^/': '/api/',
    },
    on: {
      proxyRes: (proxyRes, req) => {
        console.log(`[PROXY] ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
        console.log('Headers:', proxyRes.headers);
      },
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('Origin', 'https://erp.mte.vn');
        proxyReq.setHeader('Referer', 'https://erp.mte.vn/');
      },
    },
  }),
);

app.listen(3001, () => {
  console.log('Test proxy running on 3001');
});
