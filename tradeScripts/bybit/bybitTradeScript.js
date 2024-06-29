//REMAKE AND TEST FIRSTLY*********
require('dotenv').config();
const { RestClientV5 } = require('bybit-api');
const moment = require('moment-timezone');
const winston = require('winston'); 

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'trade_bybit_bot.log' })
  ]
});

const client = new RestClientV5({
    key: API_KEY,
    secret: API_SECRET,
    testnet: false, 
});

const orderPair = 'BTCUSD'; 

async function getServerTime() {
  try {
    const response = await client.getServerTime();
    return response.time_now;
  } catch (error) {
    logger.error('Error fetching server time:', error);
    return null;
  }
}

async function getCurrentPrice(symbol) {
  try {
    const response = await client.getTickers({ symbol });
    return parseFloat(response.result[0].last_price);
  } catch (error) {
    logger.error('Error fetching current price:', error);
    return null;
  }
}

async function getBalance(currency) {
  try {
    const response = await client.getWalletBalance({ coin: currency });
    const balance = response.result[currency];
    return balance ? parseFloat(balance.available_balance) : 0;
  } catch (error) {
    logger.error('Error fetching balance:', error);
    return 0;
  }
}

async function placeMarketOrder(symbol, amountInUSD, side) {
  let amount;

  if (side === 'Buy') {
    amount = amountInUSD; 
  } else if (side === 'Sell') {
    const baseCurrency = symbol.split('USD')[0];
    amount = await getBalance(baseCurrency); 
    if (amount === 0) {
      logger.error(`No balance available for ${baseCurrency}`);
      return;
    }
  }

  try {
    const orderResult = await client.submitOrder({
      symbol,
      side,
      order_type: 'Market',
      qty: amount,
      time_in_force: 'ImmediateOrCancel',
    });
    logger.info('Order Result:', orderResult);
  } catch (error) {
    logger.error('Error creating order:', error);
  }
}

async function main() {
  const targetTime = moment.tz('2024-06-13 3:58:00.00', 'YYYY-MM-DD HH:mm:ss.SSS', 'UTC');
  const amountToSpend = 20; 

  while (true) {
    const serverTime = await getServerTime();

    if (!serverTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    const currentTime = moment.unix(serverTime);
    logger.info(`Current server time: ${currentTime.format('YYYY-MM-DD HH:mm:ss.SSS')}`);

    const timeDifference = targetTime.diff(currentTime);

    if (timeDifference <= 0) {
      logger.info('Target time reached. Placing market order...');
      await placeMarketOrder(orderPair, amountToSpend, 'Buy');
      logger.info('Waiting for selling');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await placeMarketOrder(orderPair, null, 'Sell'); 
      break;
    } else {
      const waitTime = 100;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

main().catch(error => {
  logger.error('Critical error in main function:', error);
  process.exit(1); 
});
