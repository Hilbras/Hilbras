import { hydrateRoot } from 'react-dom/client';
import './index.css';
import { App } from './pages/App';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing');

/**
 * The prerender step writes the rendered app into `#root`, so the client hydrates
 * that markup instead of throwing it away and re-rendering. React reuses the
 * existing DOM, which is what keeps first paint on the server HTML.
 *
 * The path comes from the URL, and it is resolved by the same function the
 * prerender used. Deciding the page twice is how a hydration mismatch happens.
 */
hydrateRoot(root, <App path={window.location.pathname} />);
