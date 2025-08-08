import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function setupStaticHandler(app) {
    // Serve static files from the public directory
    app.use('/', express.static(path.join(__dirname, '../dist/public')));
    // Handle client-side routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        // Serve index.html for all other routes (client-side routing)
        res.sendFile(path.join(__dirname, '../dist/public/index.html'));
    });
}
