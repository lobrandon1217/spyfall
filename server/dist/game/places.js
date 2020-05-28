"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomPlace = exports.places = void 0;
var fs = require("fs");
var path = require("path");
exports.places = [];
var test = fs.readFileSync(path.resolve(__dirname, '../../../files/places.txt'));
test.toString().split('\n').map(function (value) { return exports.places.push(value); });
exports.places.sort();
function getRandomPlace() {
    return exports.places[Math.floor(Math.random() * exports.places.length)];
}
exports.getRandomPlace = getRandomPlace;
//# sourceMappingURL=places.js.map