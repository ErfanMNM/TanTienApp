import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import http from 'http';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Route to scrape CSRF token from ERPNext for the current authenticated user
  app.get('/api/csrf_token', async (req, res) => {
    try {
      // Need dynamic import due to node-fetch ESM package
      const fetchApi = (await import('node-fetch')).default || fetch;
      const resp = await fetchApi('https://erp.mte.vn/app', {
        headers: {
          'Cookie': req.headers.cookie || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIStudio'
        }
      });
      const html = await resp.text();
      // Match window.csrf_token = "TOKEN";
      const match = html.match(/csrf_token\s*=\s*["']([^"']+)["']/);
      if (match && match[1]) {
        res.json({ csrf_token: match[1] });
      } else {
        res.status(404).json({ error: 'CSRF token not found in HTML' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add the proxy middleware for mapping frontend API calls directly to ERPNext
  app.use('/api', createProxyMiddleware({
    target: 'https://erp.mte.vn',
    changeOrigin: true,
    pathRewrite: {
      '^/': '/api/' // Adds back the /api prefix stripped by Express
    },
    cookieDomainRewrite: {
      '*': '' // Crucial: Binds the ERPNext cookie to our current domain
    },
    onProxyRes: (proxyRes, req, res) => {
      // Very Important: Frappe sets cookies as SameSite=Lax, which blocks them in the AI Studio iframe.
      // We must rewrite the Set-Cookie headers to SameSite=None; Secure.
      let setCookie = proxyRes.headers['set-cookie'];
      if (setCookie) {
        if (!Array.isArray(setCookie)) setCookie = [setCookie];
        proxyRes.headers['set-cookie'] = setCookie.map(c => {
          let updated = c.replace(/SameSite=Lax/ig, 'SameSite=None');
          if (!/Secure/i.test(updated)) {
            updated += '; Secure';
          }
          if (!/SameSite=None/i.test(updated)) {
            updated += '; SameSite=None';
          }
          // Frappe sometimes misses setting path or we need it strictly
          return updated;
        });
      }
    },
    headers: {
      // Trick the CSRF checks if applicable
      'Origin': 'https://erp.mte.vn',
      'Referer': 'https://erp.mte.vn/'
    }
  }));

  // Vite middleware for development UI
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production delivery of built UI
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
