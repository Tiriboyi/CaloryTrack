const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { CreateErrorResponse } = require('./utils/http');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'leaderboard.db');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased limit for base64 images

// Serve React build in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
}

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
        // Check if timestamp column exists, if not add it
        db.all("PRAGMA table_info(logs)", (err, columns) => {
            const hasTimestamp = columns && columns.some(col => col.name === 'timestamp');
            
            if (!hasTimestamp && columns && columns.length > 0) {
                console.log('Migrating database: adding timestamp column...');
                db.run("ALTER TABLE logs ADD COLUMN timestamp INTEGER DEFAULT 0", (err) => {
                    if (err) {
                        console.error('Migration error:', err.message);
                    } else {
                        console.log('Migration complete: timestamp column added');
                        // Update existing records with timestamp based on date
                        db.run(`UPDATE logs SET timestamp = strftime('%s', date) * 1000 WHERE timestamp = 0`);
                    }
                });
            }
        });

        // Logs table for current entries (proof deleted after day ends)
        db.run(`CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            proof TEXT, -- Base64 image (deleted after day)
            date TEXT NOT NULL,
            timestamp INTEGER NOT NULL DEFAULT 0 -- Unix timestamp for easier date comparisons
        )`);

        // Lifetime stats table (no proofs, just aggregated data)
        db.run(`CREATE TABLE IF NOT EXISTS lifetime_stats (
            name TEXT PRIMARY KEY,
            total_calories INTEGER NOT NULL DEFAULT 0,
            entries_count INTEGER NOT NULL DEFAULT 0
        )`);

        // Monthly stats table (reset on first day of new month)
        db.run(`CREATE TABLE IF NOT EXISTS monthly_stats (
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

        // Initialize lastMonthlyReset if not exists
        db.get("SELECT value FROM meta WHERE key = 'lastMonthlyReset'", (err, row) => {
            if (!row) {
                const now = new Date();
                const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
                db.run("INSERT INTO meta (key, value) VALUES ('lastMonthlyReset', ?)", [monthKey]);
            }
        });

        // Check if monthly stats need to be reset (new month started)
        setTimeout(() => checkAndResetMonthlyStats(), 1000);

        // Clean up old screenshots on startup
        setTimeout(() => cleanupOldScreenshots(), 2000); // Delay to ensure migration completes
    });
}

// Clean up screenshots from previous days
function cleanupOldScreenshots() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    // Check if timestamp column exists before using it
    db.all("PRAGMA table_info(logs)", (err, columns) => {
        if (err) {
            console.error('Error checking table structure:', err.message);
            return;
        }

        const hasTimestamp = columns && columns.some(col => col.name === 'timestamp');

        if (hasTimestamp) {
            // Use timestamp column if available
            db.run(
                "UPDATE logs SET proof = NULL WHERE timestamp < ? AND timestamp > 0 AND proof IS NOT NULL",
                [todayTimestamp],
                function(err) {
                    if (err) {
                        console.error('Error cleaning up old screenshots:', err.message);
                    } else if (this.changes > 0) {
                        console.log(`Cleaned up ${this.changes} old screenshots`);
                    }
                }
            );
        } else {
            // Fallback: use date string parsing (slower but works with old schema)
            db.all("SELECT id, date, proof FROM logs WHERE proof IS NOT NULL", (err, rows) => {
                if (err) {
                    console.error('Error reading logs:', err.message);
                    return;
                }

                const idsToClean = rows
                    .filter(row => {
                        const logDate = new Date(row.date);
                        logDate.setHours(0, 0, 0, 0);
                        return logDate.getTime() < todayTimestamp;
                    })
                    .map(row => row.id);

                if (idsToClean.length > 0) {
                    const placeholders = idsToClean.map(() => '?').join(',');
                    db.run(
                        `UPDATE logs SET proof = NULL WHERE id IN (${placeholders})`,
                        idsToClean,
                        function(err) {
                            if (err) {
                                console.error('Error cleaning up old screenshots:', err.message);
                            } else {
                                console.log(`Cleaned up ${this.changes} old screenshots`);
                            }
                        }
                    );
                }
            });
        }
    });
}

// Check and reset monthly stats if a new month has started
function checkAndResetMonthlyStats() {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    
    db.get("SELECT value FROM meta WHERE key = 'lastMonthlyReset'", (err, row) => {
        if (err) {
            console.error('Error checking monthly reset:', err.message);
            return;
        }
        
        const lastMonthKey = row ? row.value : null;
        
        if (lastMonthKey !== currentMonthKey) {
            console.log(`New month detected. Resetting monthly stats (was: ${lastMonthKey}, now: ${currentMonthKey})`);
            
            db.serialize(() => {
                db.run("DELETE FROM monthly_stats", (err) => {
                    if (err) {
                        console.error('Error resetting monthly stats:', err.message);
                    } else {
                        console.log('Monthly stats reset successfully');
                    }
                });
                
                if (lastMonthKey) {
                    db.run("UPDATE meta SET value = ? WHERE key = 'lastMonthlyReset'", [currentMonthKey]);
                } else {
                    db.run("INSERT INTO meta (key, value) VALUES ('lastMonthlyReset', ?)", [currentMonthKey]);
                }
            });
        }
    });
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
        // Check if new month started
        checkAndResetMonthlyStats();
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
    
    db.all(
        "SELECT name, total_calories, entries_count FROM monthly_stats ORDER BY total_calories DESC",
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const users = rows.map(row => ({
                name: row.name,
                totalCalories: row.total_calories,
                entries: row.entries_count
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
    const { name, calories, proof } = req.body;
    
    if (!name || !calories) {
        return res.status(400)
            .json(CreateErrorResponse('Name and calories required', 400));
    }

    let caloriesRegex = /^\d{1,5}$/;
    if(!caloriesRegex.test(calories) && parseInt(calories, 10) > 10000)
    {
        return res.status(400)
            .json(CreateErrorResponse('Please enter valid calories. Valid calories must be a whole number between 1 and 10 0000.'))
    }

    let nameRegex = /^[a-zA-Z0-9 -_]{1,30}$/;
    if(typeof name !== "string" || name.length > 30 || !nameRegex.test(name)){
        return res.status(400)
            .json(CreateErrorResponse('Please enter a valid name. A valid name may include letters, numbers, underscores, or dashes.', 400))
    }

    const timestamp = Date.now();

    // Check if user already has an entry today
    db.get(
        "SELECT id FROM logs WHERE name = ? COLLATE NOCASE AND date = date('now') order by date desc",
        [name],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (row) {
                // Update existing entry for today
                const stmt = db.prepare("UPDATE logs SET calories = ?, proof = ?, date = date('now'), timestamp = ? WHERE id = ?");
                stmt.run(calories, proof, timestamp, row.id, function(err) {
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
                const stmt = db.prepare("INSERT INTO logs (name, calories, proof, date, timestamp) VALUES (?, ?, ?, date('now'), ?)");
                stmt.run(name, calories, proof, timestamp, function(err) {
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

// Update lifetime and monthly statistics
function updateLifetimeStats(name, calories, isNewEntry) {
    // Update lifetime stats
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
    
    // Update monthly stats
    db.get(
        "SELECT total_calories, entries_count FROM monthly_stats WHERE name = ?",
        [name],
        (err, row) => {
            if (err) {
                console.error('Error updating monthly stats:', err.message);
                return;
            }

            if (row) {
                // Update existing stats
                const newTotal = row.total_calories + calories;
                const newCount = isNewEntry ? row.entries_count + 1 : row.entries_count;
                db.run(
                    "UPDATE monthly_stats SET total_calories = ?, entries_count = ? WHERE name = ?",
                    [newTotal, newCount, name]
                );
            } else {
                // Insert new stats
                db.run(
                    "INSERT INTO monthly_stats (name, total_calories, entries_count) VALUES (?, ?, ?)",
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
