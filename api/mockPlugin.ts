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

            // HANDLE GET
            if (req.method === 'GET') {
                if (fs.existsSync(filePath)) {
                    if (fs.lstatSync(filePath).isDirectory()) {
                        // Directory listing (for finding available boundaries)
                        const files = fs.readdirSync(filePath)
                            .filter(f => f.endsWith('.geojson') || f.endsWith('.json'))
                            .map(f => ({
                                id: f.replace(/\.(geojson|json)$/, ''),
                                name: f.replace(/\.(geojson|json)$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                                file: f
                            }));
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(files));
                        return;
                    } else {
                        // Single file
                        const content = fs.readFileSync(filePath);
                        if (filePath.endsWith('.geojson') || filePath.endsWith('.json')) {
                            res.setHeader('Content-Type', 'application/json');
                        }
                        res.end(content);
                        return;
                    }
                } else {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: `Mock file not found: ${relativePath}` }));
                    return;
                }
            }

            // HANDLE POST (Saving bubbles/data)
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                    try {
                        const dir = path.dirname(filePath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        fs.writeFileSync(filePath, body);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: true, path: relativePath }));
                    } catch (err: any) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: err.message }));
                    }
                });
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
