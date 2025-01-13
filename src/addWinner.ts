import { DbConnector } from './dbConnector';

function parseDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toISOString();
}

const dateStr = process.argv[2];
const question = process.argv[3];
const solution = process.argv[4];
const closestAnswer = process.argv[5];
const winner = process.argv[6];

if (dateStr && question && solution && closestAnswer && winner) {
    const dbConnector = new DbConnector();
    const date = parseDate(dateStr);
    dbConnector.insertQuestion(date, question, solution, closestAnswer, winner);
    dbConnector.closeDbConnection();
} else {
    console.log('Please provide a date (dd.MM.yyyy), question, solution, closest answer, and winner.');
}