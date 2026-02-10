import fs from 'fs';
import path from 'path';
import type { Plugin, Connect } from 'vite';

export function mockApiPlugin(): Plugin {
    const handleRequest: Connect.NextHandleFunction = (req, res, next) => {
        // Intercept /api/data requests
        if (req.url && req.url.startsWith('/api/data/')) {
            const url = new URL(req.url, 'http://localhost');
            const relativePath = decodeURIComponent(url.pathname).replace(/^\/api\/data\//, '');
            const filePath = path.resolve(process.cwd(), 'data', relativePath);

            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                const content = fs.readFileSync(filePath);

                if (filePath.endsWith('.geojson') || filePath.endsWith('.json')) {
                    res.setHeader('Content-Type', 'application/json');
                }

                res.end(content);
                return;
            } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: `Mock file not found: ${relativePath}` }));
                return;
            }
        }
        next();
    };

    return {
        name: 'mock-api',
        configureServer(server) {
            server.middlewares.use(handleRequest);
        },
        configurePreviewServer(server) {
            server.middlewares.use(handleRequest);
        },
    };
}
