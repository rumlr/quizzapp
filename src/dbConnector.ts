import sqlite3 from 'sqlite3';

export class DbConnector {
    private db: sqlite3.Database;

    constructor() {
        this.db = new sqlite3.Database('db/quizzapp.db', (err) => {
            if (err) {
                console.error(err.message);
            }
            else {
                console.log('Connected to the quizzapp database.');
            }
        });
        this.createTable();
    }

    public closeDbConnection() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            else {
                console.log('Connection to the quizzapp database closed.');
            }
        });
    }

    private createTable() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATETIME NOT NULL,
                question TEXT NOT NULL,
                solution TEXT NOT NULL,
                closestAnswer TEXT NOT NULL,
                winner TEXT NOT NULL
            )`);
        });
    }

    public insertQuestion(date: string, question: string, solution: string, closestAnswer: string, winner: string) {
        this.db.serialize(() => {
            this.db.run(`INSERT INTO questions (date, question, solution, closestAnswer, winner) VALUES (?, ?, ?, ?, ?)`, [date, question, solution, closestAnswer, winner], (err) => {
                if (err) {
                    console.error(err.message);
                }
            });
        });
    }

    public getQuestions() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM questions`, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    public getWinnerRanking() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT winner, COUNT(*) as count FROM questions GROUP BY winner ORDER BY count DESC`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
            });
        });
    }
}