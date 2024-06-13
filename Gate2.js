require('dotenv').config();
const GateApi = require('gate-api');
const moment = require('moment-timezone');
const winston = require('winston'); // Для логирования

// Настройка логирования с добавлением временных меток до миллисекунд
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'trade_bot.log' })
  ]
});

const client = new GateApi.ApiClient();
client.setApiKeySecret(process.env.GATE_API_KEY, process.env.GATE_API_SECRET);

const orderPair = process.env.ORDER_PAIR || 'FTM_USDT'; // Используйте подходящую переменную среды
const quoteCurrency = 'USDT'; // Предполагается, что валюта котировки всегда USDT

async function getServerTime() {
  const apiInstance = new GateApi.SpotApi(client);
  try {
    const serverTime = await apiInstance.getSystemTime();
    return serverTime.response.data.server_time;
  } catch (error) {
    logger.error('Error fetching server time:', error);
    return null;
  }
}

async function getCurrentPrice(symbol) {
  const apiInstance = new GateApi.SpotApi(client);
  try {
    const ticker = await apiInstance.listTickers({ currencyPair: symbol });
    return parseFloat(ticker.body[0].last);
  } catch (error) {
    logger.error('Error fetching current price:', error);
    return null;
  }
}

async function getBalance(currency) {
  const apiInstance = new GateApi.WalletApi(client);
  try {
    const balances = await apiInstance.listSpotAccounts();
    const balance = balances.body.find(b => b.currency === currency);
    return balance ? parseFloat(balance.available) : 0;
  } catch (error) {
    logger.error('Error fetching balance:', error);
    return 0;
  }
}

async function placeMarketOrder(symbol, amountInUSD, side) {
  const apiInstance = new GateApi.SpotApi(client);
  let amount;

  if (side === 'buy') {
    const currentPrice = await getCurrentPrice(symbol);
    if (!currentPrice) {
      logger.error('Unable to get current price for', symbol);
      return;
    }
    amount = (amountInUSD / currentPrice).toFixed(8); // Рассчитать количество монет
  } else if (side === 'sell') {
    const baseCurrency = symbol.split('_')[0];
    amount = await getBalance(baseCurrency); // Получить баланс имеющихся монет
    if (amount === 0) {
      logger.error(`No balance available for ${baseCurrency}`);
      return;
    }
  }

  const order = new GateApi.Order();
  order.currencyPair = symbol;
  order.side = side;
  order.type = 'market';
  order.account = 'spot';
  order.timeInForce = 'ioc';
  order.amount = amount.toString();

  try {
    const orderResult = await apiInstance.createOrder(order);
    logger.info('Order Result:', orderResult);
  } catch (error) {
    logger.error('Error creating order:', error);
  }
}

async function main() {
  const targetTime = moment.tz('2024-06-13 02:47:00', 'YYYY-MM-DD HH:mm:ss.SSS', 'UTC');
  const amountToSpend = 10; // Сумма в долларах для покупки

  while (true) {
    const serverTime = await getServerTime();

    if (!serverTime) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    const currentTime = moment(serverTime);
    logger.info(`Current server time: ${currentTime.format('YYYY-MM-DD HH:mm:ss.SSS')}`);
    const timeDifference = targetTime.diff(currentTime);

    if (timeDifference <= 0) {
      logger.info('Target time reached. Placing market order...');
      await placeMarketOrder(orderPair, amountToSpend, 'buy');
      logger.info('Waiting for selling');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await placeMarketOrder(orderPair, null, 'sell'); // Продать все имеющиеся монеты
      break;
    } else {
      // ждем 150 мс
      const waitTime = 150;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

main().catch(error => {
  logger.error('Critical error in main function:', error);
  process.exit(1); 
});
