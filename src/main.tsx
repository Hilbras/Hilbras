import { createRoot } from 'react-dom/client';
import './index.css';
import { HomePage } from './pages/HomePage';

const root = document.getElementById('root');
if (!root) throw new Error('#root element missing');

createRoot(root).render(<HomePage />);
