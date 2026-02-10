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
    // Map types to folders
    const folder = type === 'ward' ? 'ward' : 'const';
    const filePath = path.resolve(__dirname, '../data', folder, `${id}.geojson`);

    if (fs.existsSync(filePath)) {
        res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    } else {
        res.status(404).json({ error: 'Boundary not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Mock API Server running on http://localhost:${PORT}`);
});
