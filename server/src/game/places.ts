import * as fs from 'fs';
import * as path from 'path';

export const places: string[] = [];

let test = fs.readFileSync(path.resolve(__dirname, '../../../files/places.txt'));
test.toString().split('\n').map(value => places.push(value));

places.sort();

export function getRandomPlace(): string {
    return places[Math.floor(Math.random() * places.length)];
}
