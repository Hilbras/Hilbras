import { renderToString } from 'react-dom/server';
import { buildStructuredDataDocument } from './data/structuredData';
import { site } from './data/site';
import { HomePage } from './pages/HomePage';

/**
 * The server entry for the prerender step.
 *
 * The whole app is server-renderable as it stands: the only browser APIs in
 * play are behind `useEffect`, which never runs on a server. So `vite build
 * --mode ssr` compiles this file, the prerender script calls `render()`, and the
 * resulting markup is written into `dist/index.html` before the client loads.
 *
 * `site` and the structured-data document travel with it so the prerender step
 * can set every absolute URL and emit the JSON-LD from one source of truth.
 */
export function render(): string {
  return renderToString(<HomePage />);
}

export { site, buildStructuredDataDocument };
