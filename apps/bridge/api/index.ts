import { handle } from 'hono/vercel';
import { createApp } from '../src/app.js';
import { getContainer } from '../src/container.js';

export const config = { runtime: 'nodejs20.x' };

const app = createApp(getContainer());
export default handle(app);
