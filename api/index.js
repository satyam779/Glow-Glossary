// Vercel serverless entry: the same Express app that `npm start` runs, deployed as one function.
// vercel.json rewrites /api/* here; the static site in dist/ is served by Vercel's CDN.
import { createApp } from '../server/app.js';

export default createApp();
