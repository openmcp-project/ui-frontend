import { createRoot } from 'react-dom/client';
import { createApp } from './main.tsx';

const root = createRoot(document.getElementById('root')!);
root.render(createApp());
