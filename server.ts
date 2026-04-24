import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const port = Number(process.env.PORT || 3000);
  const erpBaseUrl = process.env.ERP_BASE_URL || 'https://erp.mte.vn';

  app.get('/api/csrf_token', async (req, res) => {
    try {
      const response = await fetch(new URL('/app', erpBaseUrl), {
        headers: {
          Cookie: req.headers.cookie || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TanTienApp',
        },
      });
      const html = await response.text();
      const match = html.match(/csrf_token\s*=\s*["']([^"']+)["']/);

      if (match?.[1]) {
        res.json({ csrf_token: match[1] });
        return;
      }

      res.status(404).json({ error: 'CSRF token not found in ERPNext HTML.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });

  app.use(
    '/api',
    createProxyMiddleware({
      target: erpBaseUrl,
      changeOrigin: true,
      pathRewrite: {
        '^/': '/api/',
      },
      cookieDomainRewrite: {
        '*': '',
      },
      headers: {
        Origin: erpBaseUrl,
        Referer: `${erpBaseUrl}/`,
      },
      on: {
        proxyReq: (proxyReq) => {
          proxyReq.setHeader('Origin', erpBaseUrl);
          proxyReq.setHeader('Referer', `${erpBaseUrl}/`);
        },
        proxyRes: (proxyRes) => {
          let setCookie = proxyRes.headers['set-cookie'];
          if (!setCookie) {
            return;
          }

          if (!Array.isArray(setCookie)) {
            setCookie = [setCookie];
          }

          proxyRes.headers['set-cookie'] = setCookie.map((cookie) => {
            let updated = cookie.replace(/SameSite=Lax/gi, 'SameSite=None');

            if (!/Secure/i.test(updated)) {
              updated += '; Secure';
            }

            if (!/SameSite=None/i.test(updated)) {
              updated += '; SameSite=None';
            }

            return updated;
          });
        },
      },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Proxy target: ${erpBaseUrl}`);
  });
}

void startServer();
