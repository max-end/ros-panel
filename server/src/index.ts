import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for local development and LAN access
app.use(
  cors({
    origin: true, // Allow frontend on any origin / port
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ros-web-manager', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// Discover static frontend dist path
const candidatePaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  process.env.CLIENT_DIST_PATH || '',
].filter(Boolean);

const clientDistPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientDistPath) {
  console.log(`[RosPanel] Serving frontend from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.warn(
    '[RosPanel] ⚠️  未检测到已构建的前端资源 (client/dist/index.html)。如果需要完整 Web 控制台，请在根目录执行 "pnpm build"。'
  );
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>RosPanel - 静态资源未构建</title>
        <style>
          body { background: #0B0F19; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #111827; border: 1px solid #1F2937; border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); text-align: center; }
          h2 { font-size: 20px; color: #F8FAFC; margin-bottom: 8px; }
          p { font-size: 13px; color: #94A3B8; line-height: 1.6; margin: 8px 0; }
          code { background: #1E293B; color: #38BDF8; padding: 3px 8px; border-radius: 6px; font-family: monospace; font-size: 12px; }
          .box { background: #0F172A; border: 1px solid #334155; border-radius: 10px; padding: 14px; margin: 20px 0; text-align: left; font-family: monospace; font-size: 12px; color: #A5F3FC; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 40px; margin-bottom: 12px;">⚠️</div>
          <h2>前端静态资源尚未编译</h2>
          <p>当前服务端正常运行，但尚未检测到前端编译产物 <code>client/dist/index.html</code>。</p>
          <div class="box">
            # 1. 编译前端与后端工程<br/>
            pnpm build<br/><br/>
            # 2. 重新启动服务<br/>
            pnpm start
          </div>
          <p style="font-size: 11px; color: #64748B;">
            💡 若您正在使用开发模式 (<code>pnpm dev</code>)，请直接访问 Vite 开发端口：<code>http://&lt;IP&gt;:5173</code>
          </p>
        </div>
      </body>
      </html>
    `);
  });
}

app.listen(PORT, () => {
  console.log(`[RouterOS Web Manager] Server running on http://0.0.0.0:${PORT}`);
});
