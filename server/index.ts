import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app';
import { assertProductionServerConfig, config } from './config';
import { pool, verifyDatabaseConnection } from './db/pool';

assertProductionServerConfig();

const app = createApp();
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (config.nodeEnv === 'production') {
  await verifyDatabaseConnection();
  const clientDirectory = path.join(repositoryRoot, 'dist');
  app.use(express.static(clientDirectory, { index: false, maxAge: '1h' }));
  app.use((request, response, next) => {
    if (request.method !== 'GET' || !request.accepts('html')) return next();
    return response.sendFile(path.join(clientDirectory, 'index.html'));
  });
} else {
  if (pool) {
    try { await verifyDatabaseConnection(); } catch (error) { console.warn('[database] API operativa sin conexión; no se sustituirán datos por mock:', error); }
  } else {
    console.warn('[database] DATABASE_URL ausente; la API operativa responderá como no configurada.');
  }
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`PapaStock escuchando en http://0.0.0.0:${config.port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal}: cierre ordenado.`);
  server.close(async () => {
    await pool?.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
