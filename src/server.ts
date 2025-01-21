import { exec } from 'child_process';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { Server } from "socket.io";
import { DbConnector } from './dbConnector';
import { errWithTime, logWithTime } from './util';

export class QuizzServer {

    // constants
    private port = 3000;

    // runtime variables
    private app: express.Application;
    private httpServer: ReturnType<typeof createServer>;
    private socketServer: Server;
    private dbConnector: DbConnector;

    // app variables
    private answers = new Map<string, number>();                // key: name, value: answer
    private sortedAnswers: [string, number, number][] = [];     // [name, answer, distance]
    private question: string = "";
    private solution: number = 0;
    private isRevealed: boolean = false;
    private isClosed: boolean = false;


    constructor(dbConnector: DbConnector) {
        this.dbConnector = dbConnector;
        this.app = express();
        this.httpServer = createServer(this.app);
        this.socketServer = new Server(this.httpServer);
    }

    public start() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..', 'web')));

        this.httpServer.listen(this.port, () => {
            logWithTime(`Server is running at http://localhost:${this.port}`);
        });

        this.app.get('/player', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'web', 'player.html'));
        });

        this.app.get('/host', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'web', 'host.html'));
        });

        this.app.get('/statistics', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'web', 'statistics.html'));
        });

        this.app.post('/newQuestion', (req, res) => {
            this.setNewQuestion(req.body.question, req.body.answer);
            this.socketServer.emit('newQuestion', this.question);
            res.send('New question set');
        });

        this.app.get('/getQuestion', (req, res) => {
            res.json(this.question);
        });

        this.app.post('/addAnswer', (req, res) => {
            if (this.isClosed) {
                res.status(400).send('Question is closed');
                return;
            }
            const { name, answer } = req.body;
            const parsedAnswer = parseFloat(answer);
            if (isNaN(parsedAnswer)) {
                res.status(400).send('Invalid answer');
                return;
            }
            logWithTime(`New answer from ${name}: ${parsedAnswer}`);
            this.answers.set(name, parsedAnswer);
            this.calculateRanking();
            this.socketServer.emit('newAnswer', this.sortedAnswers);
            res.send('Answer added');
        });

        this.app.get('/getSolution', (req, res) => {
            if (this.isRevealed) {
                res.json(this.solution);
            }
            else {
                res.status(400).send('Question is still open');
            }
        });

        this.app.get('/revealResult', (req, res) => {
            this.isRevealed = true;
            this.socketServer.emit('isRevealed', true);
            res.send('Result revealed');
        });

        this.app.get('/closeQuestion', (req, res) => {
            this.isClosed = true;
            this.calculateRanking();
            this.storeWinner();
            this.socketServer.emit('isClosed', true);
            res.json(this.sortedAnswers);
        });

        this.app.get('/getRanking', (req, res) => {
            res.json(this.sortedAnswers);
        });

        this.app.get('/getClosed', (req, res) => {
            res.json(this.isClosed);
        });

        this.app.get('/getWinnerRanking', (req, res) => {
            this.getWinnerRanking().then(result => {
                res.json(result);
            }).catch(error => {
                res.status(500).send(error.message);
                errWithTime(error.message);
            });
        });

        this.app.get('/getAllQuestions', (req, res) => {
            this.getAllQuestions().then(result => {
                res.json(result);
            }).catch(error => {
                res.status(500).send(error.message);
                errWithTime(error.message);
            });
        });

        this.app.get('/getLogs', (req, res) => {
            exec('tail -n 100 logs.log', (error, stdout, stderr) => {
                if (error) {
                    res.status(500).send(`Error: ${error.message}`);
                    errWithTime(error.message);
                    return;
                }
                if (stderr) {
                    res.status(500).send(`Stderr: ${stderr}`);
                    errWithTime(stderr);
                    return;
                }
                res.send(`<pre>${stdout}</pre>`);
            });
        });
    }

    private setNewQuestion(question: string, answer: number) {
        this.question = question;
        this.solution = answer;
        this.isRevealed = false;
        this.isClosed = false;
        this.sortedAnswers = [];
        this.answers.clear();
    }

    private calculateRanking() {
        this.sortedAnswers = Array.from(this.answers.entries()).map(([name, value]): [string, number, number] => {
            return [name, value, parseFloat(Math.abs(value - this.solution).toFixed(2))];
        }).sort((a, b) => a[2] - b[2]);
    }

    private storeWinner() {
        if (this.sortedAnswers.length === 0) {
            return;
        }
        const winner = this.sortedAnswers[0][0];
        this.dbConnector.insertQuestion(new Date().toISOString(), this.question, this.solution.toString(), this.sortedAnswers[0][1].toString(), winner);
    }

    private getWinnerRanking() {
        return this.dbConnector.getWinnerRanking();
    }

    private getAllQuestions() {
        return this.dbConnector.getQuestions();
    }
}