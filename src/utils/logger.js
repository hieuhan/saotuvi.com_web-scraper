const winston = require('winston');
require( 'winston-daily-rotate-file' );

module.exports = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        winston.format.align(),
        winston.format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`)
    ),
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/info-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.printf((i) =>
                    i.level === 'info' ? `${i.level}: ${i.timestamp} ${i.message}` : ''
                )
            )
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
    ],
})