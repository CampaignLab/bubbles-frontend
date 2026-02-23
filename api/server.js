const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so your frontend can talk to this server
app.use(cors());

// Serve GeoJSON from the /data folder
app.get('/api/data/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const folder = type === 'ward' ? 'ward' : 'const';
    const filePath = path.resolve(__dirname, '../data', folder, `${id}.geojson`);

    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } else {
        res.status(404).json({ error: 'Boundary not found' });
    }
});

// Serve Audience CSVs
app.get('/api/data/bubbles/:type/:id.csv', (req, res) => {
    const { type, id } = req.params;
    const folder = type === 'ward' ? 'bubbles/ward' : 'bubbles/const';
    const filePath = path.resolve(__dirname, '../data', folder, `${id}.csv`);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Audience CSV not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Mock API Server running on http://localhost:${PORT}`);
});
