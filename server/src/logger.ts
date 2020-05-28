import {createLogger, transports, format} from 'winston';

const myFormat = format.printf(({level, message, timestamp}) => {
    return `${timestamp} [${level}] ${message}`;
});

const date = new Date();
const logger = createLogger({
    transports: [
        new transports.Console(),
        new transports.File({
            filename: `log_${date.getFullYear()}_${date.getMonth()}_${date.getDate()}_${date.getTime()}.txt`
        })
    ],
    level: 'debug',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD hh:mm:ss'
        }),
        myFormat
    )
});

export default logger;