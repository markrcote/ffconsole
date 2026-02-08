const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

app.use(express.json());
app.use(express.static(__dirname));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// GET /api/state - Return saved state
app.get('/api/state', (req, res) => {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            res.json(JSON.parse(data));
        } else {
            res.json({});
        }
    } catch (e) {
        console.error('Failed to read state:', e);
        res.status(500).json({ error: 'Failed to read state' });
    }
});

// PUT /api/state - Save state to disk
app.put('/api/state', (req, res) => {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to save state:', e);
        res.status(500).json({ error: 'Failed to save state' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fighting Fantasy Adventure Sheet running at http://localhost:${PORT}`);
});
