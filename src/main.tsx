import { hydrateRoot } from 'react-dom/client';
import './index.css';
import { HomePage } from './pages/HomePage';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing');

/**
 * The prerender step writes the rendered app into `#root`, so the client
 * hydrates that markup instead of throwing it away and re-rendering. React
 * reuses the existing DOM, which is what keeps first paint on the server HTML.
 */
hydrateRoot(root, <HomePage />);
