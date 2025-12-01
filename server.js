const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'leaderboard.db');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for base64 images
app.use(express.static(__dirname)); // Serve static files (index.html)

// Ensure database directory has proper permissions
function ensureDbPermissions() {
    const dbDir = path.dirname(DB_PATH);
    
    try {
        // Check if directory is writable
        fs.accessSync(dbDir, fs.constants.W_OK);
        
        // If database exists, check if it's writable
        if (fs.existsSync(DB_PATH)) {
            fs.accessSync(DB_PATH, fs.constants.W_OK);
            console.log('Database file is writable');
        }
    } catch (err) {
        console.error('ERROR: Database directory or file is not writable!');
        console.error(`Please run: chmod -R 755 ${dbDir}`);
        console.error(`Or: chmod 664 ${DB_PATH}`);
        console.error('Full error:', err.message);
        process.exit(1);
    }
}

// Database Setup
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        console.error(`Database path: ${DB_PATH}`);
        console.error('Please check file permissions');
        process.exit(1);
    } else {
        console.log('Connected to SQLite database.');
        console.log(`Database location: ${DB_PATH}`);
        ensureDbPermissions();
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Logs table for current entries (proof deleted after day ends)
        db.run(`CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            proof TEXT, -- Base64 image (deleted after day)
            date TEXT NOT NULL,
            timestamp INTEGER NOT NULL -- Unix timestamp for easier date comparisons
        )`);

        // Lifetime stats table (no proofs, just aggregated data)
        db.run(`CREATE TABLE IF NOT EXISTS lifetime_stats (
            name TEXT PRIMARY KEY,
            total_calories INTEGER NOT NULL DEFAULT 0,
            entries_count INTEGER NOT NULL DEFAULT 0
        )`);

        // Meta table for last reset date
        db.run(`CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);
        
        // Initialize lastReset if not exists
        db.get("SELECT value FROM meta WHERE key = 'lastReset'", (err, row) => {
            if (!row) {
                const now = Date.now().toString();
                db.run("INSERT INTO meta (key, value) VALUES ('lastReset', ?)", [now]);
            }
        });

        // Clean up old screenshots on startup
        cleanupOldScreenshots();
    });
}

// Clean up screenshots from previous days
function cleanupOldScreenshots() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    db.run(
        "UPDATE logs SET proof = NULL WHERE timestamp < ? AND proof IS NOT NULL",
        [todayTimestamp],
        function(err) {
            if (err) {
                console.error('Error cleaning up old screenshots:', err.message);
            } else if (this.changes > 0) {
                console.log(`Cleaned up ${this.changes} old screenshots`);
            }
        }
    );
}

// Run cleanup daily at midnight
function scheduleScreenshotCleanup() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 1, 0); // 1 second after midnight
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
        cleanupOldScreenshots();
        // Reschedule for next day
        scheduleScreenshotCleanup();
    }, timeUntilMidnight);
}

// Routes

// Get weekly leaderboard data
app.get('/api/data', (req, res) => {
    const response = {
        users: [],
        lastReset: 0
    };

    db.serialize(() => {
        // Get Last Reset
        db.get("SELECT value FROM meta WHERE key = 'lastReset'", (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            response.lastReset = parseInt(row ? row.value : Date.now());

            // Get Logs
            db.all("SELECT * FROM logs", (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Aggregate logs into users array to match frontend expectation
                // Frontend expects: { name, totalCalories, logs: [] }
                const usersMap = {};

                rows.forEach(row => {
                    if (!usersMap[row.name]) {
                        usersMap[row.name] = {
                            name: row.name,
                            totalCalories: 0,
                            logs: []
                        };
                    }
                    usersMap[row.name].totalCalories += row.calories;
                    usersMap[row.name].logs.push({
                        date: row.date,
                        calories: row.calories,
                        proof: row.proof
                    });
                });

                response.users = Object.values(usersMap);
                res.json(response);
            });
        });
    });
});

// Get monthly leaderboard
app.get('/api/monthly', (req, res) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTimestamp = firstDayOfMonth.getTime();

    db.all(
        "SELECT name, SUM(calories) as total_calories, COUNT(*) as entries FROM logs WHERE timestamp >= ? GROUP BY name",
        [monthTimestamp],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const users = rows.map(row => ({
                name: row.name,
                totalCalories: row.total_calories,
                entries: row.entries
            }));

            res.json({ users, month: now.toLocaleString('default', { month: 'long', year: 'numeric' }) });
        }
    );
});

// Get lifetime leaderboard
app.get('/api/lifetime', (req, res) => {
    db.all(
        "SELECT name, total_calories, entries_count FROM lifetime_stats ORDER BY total_calories DESC",
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const users = rows.map(row => ({
                name: row.name,
                totalCalories: row.total_calories,
                entries: row.entries_count
            }));

            res.json({ users });
        }
    );
});

// Add Entry
app.post('/api/entry', (req, res) => {
    const { name, calories, proof, date } = req.body;
    
    if (!name || !calories) {
        return res.status(400).json({ error: 'Name and calories required' });
    }

    const entryDate = date || new Date().toLocaleString();
    const timestamp = Date.now();

    // Check if user already has an entry today
    db.get(
        "SELECT id FROM logs WHERE name = ? AND date(substr(date, 1, 10)) = date(?)",
        [name, new Date().toISOString().split('T')[0]],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (row) {
                // Update existing entry for today
                const stmt = db.prepare("UPDATE logs SET calories = ?, proof = ?, date = ?, timestamp = ? WHERE id = ?");
                stmt.run(calories, proof, entryDate, timestamp, row.id, function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Update lifetime stats
                    updateLifetimeStats(name, calories, false);
                    
                    res.json({ id: row.id, message: 'Entry updated for today', updated: true });
                });
                stmt.finalize();
            } else {
                // Insert new entry
                const stmt = db.prepare("INSERT INTO logs (name, calories, proof, date, timestamp) VALUES (?, ?, ?, ?, ?)");
                stmt.run(name, calories, proof, entryDate, timestamp, function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Update lifetime stats
                    updateLifetimeStats(name, calories, true);
                    
                    res.json({ id: this.lastID, message: 'Entry added', updated: false });
                });
                stmt.finalize();
            }
        }
    );
});

// Update lifetime statistics
function updateLifetimeStats(name, calories, isNewEntry) {
    db.get(
        "SELECT total_calories, entries_count FROM lifetime_stats WHERE name = ?",
        [name],
        (err, row) => {
            if (err) {
                console.error('Error updating lifetime stats:', err.message);
                return;
            }

            if (row) {
                // Update existing stats
                const newTotal = row.total_calories + calories;
                const newCount = isNewEntry ? row.entries_count + 1 : row.entries_count;
                db.run(
                    "UPDATE lifetime_stats SET total_calories = ?, entries_count = ? WHERE name = ?",
                    [newTotal, newCount, name]
                );
            } else {
                // Insert new stats
                db.run(
                    "INSERT INTO lifetime_stats (name, total_calories, entries_count) VALUES (?, ?, ?)",
                    [name, calories, 1]
                );
            }
        }
    );
}

// Reset Data (Weekly Reset)
app.post('/api/reset', (req, res) => {
    const newResetDate = Date.now().toString();
    
    db.serialize(() => {
        // Archive logs? For now, just delete as per requirements "Reset all weekly data"
        db.run("DELETE FROM logs", (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            db.run("UPDATE meta SET value = ? WHERE key = 'lastReset'", [newResetDate], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Leaderboard reset', lastReset: parseInt(newResetDate) });
            });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    scheduleScreenshotCleanup();
});
