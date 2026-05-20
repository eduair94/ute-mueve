import 'dotenv/config';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { getContainer } from './container.js';

const container = getContainer();
const app = createApp(container);
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, (info) => {
  container.logger.info(`bridge listening on http://localhost:${info.port} (docs: /docs)`);
});
