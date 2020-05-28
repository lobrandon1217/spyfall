"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = require("winston");
var myFormat = winston_1.format.printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp;
    return timestamp + " [" + level + "] " + message;
});
var date = new Date();
var logger = winston_1.createLogger({
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({
            filename: "log_" + date.getFullYear() + "_" + date.getMonth() + "_" + date.getDate() + "_" + date.getTime() + ".txt"
        })
    ],
    level: 'debug',
    format: winston_1.format.combine(winston_1.format.timestamp({
        format: 'YYYY-MM-DD hh:mm:ss'
    }), myFormat)
});
exports.default = logger;
//# sourceMappingURL=logger.js.map