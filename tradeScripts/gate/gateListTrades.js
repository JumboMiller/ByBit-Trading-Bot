const gate = require('gate-api');
const moment = require('moment-timezone');
const winston = require('winston');

const client = new gate.ApiClient();
client.setApiKeySecret('your_api_key', 'your_api_secret');

// ^ PAIR_PAIR ^
const currencyPair = 'BACGAMES_USDT';

const apiInstance = new gate.SpotApi(client);

const startTime = moment.tz('2024-06-03 12:00:00', 'UTC');
const endTime = startTime.clone().add(30, 'seconds');

const options = {
    limit: 999,
    from: Math.floor(startTime.unix()),
    to: Math.floor(endTime.unix())
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: '../../logs/tradeHistoryLogs/gate_trade_BACGAMES_USDT_history.log' })
    ]
});

apiInstance.listTrades(currencyPair, options)
    .then(response => {
        response.body.forEach(trade => {
            const formattedTrade = {
                id: trade.id,
                createTime: moment.unix(trade.createTimeMs / 1000).format('YYYY-MM-DD HH:mm:ss.SSS'),
                currencyPair: trade.currencyPair,
                side: trade.side,
                amount: trade.amount,
                price: trade.price,
                sequenceId: trade.sequenceId
            };
            logger.info('Trade data:', formattedTrade);
        });
    })
    .catch(error => {
        logger.error('Error retrieving trade data', error);
    });
