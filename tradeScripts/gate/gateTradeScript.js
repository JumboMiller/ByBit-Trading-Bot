require('dotenv').config();
const GateApi = require('gate-api');
const moment = require('moment-timezone');
const winston = require('winston'); 

// Настройка логирования 
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'trade_gate_zex_bot.log' })
  ]
});

// Нетрогать
const client = new GateApi.ApiClient();
client.setApiKeySecret(process.env.GATE_API_KEY, process.env.GATE_API_SECRET);

// Здесь выбрать монетную пару 
const orderPair = 'ZEX_USDT' 

//Получить время сервера 
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

//Получение баланса определённой монеты для быстрой продажи
async function getBalance(currency) {
  const apiInstance = new GateApi.SpotApi(client); 
  try {
    const balances = await apiInstance.listSpotAccounts();
    const balance = balances.body.find(b => b.currency === currency);
    return balance ? parseFloat(balance.available) : 0;
  } catch (error) {
    logger.error('Error fetching balance:', error);
    return 0;
  }
}

//Создания ордера на покупку/продажу
async function placeMarketOrder(symbol, amountInUSD, side) {
  const apiInstance = new GateApi.SpotApi(client);
  let amount = amountInUSD;
  if (side === 'sell') {
    const baseCurrency = symbol.split('_')[0];
    amount = await getBalance(baseCurrency); 
    if (amount === 0) {
      logger.error(`No balance available for ${baseCurrency}`);
      return;
    }
  }
  //Подготовка переменных для ордера (стоит перенести для ускорение в global workplace)
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
  //Выставить время покупки по британии UTC
  const targetTime = moment.tz('2024-06-30 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS', 'UTC');
  //Сумма в долларах для покупки
  const amountToSpend = 60; 

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
      await placeMarketOrder(orderPair, amountToSpend, 'buy');
      logger.info('Target time reached. Placing market order all ready gone and now waiting for selling');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await placeMarketOrder(orderPair, null, 'sell'); 
      break;
    } else {
      const waitTime = 50;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

main().catch(error => {
  logger.error('Critical error in main function:', error);
  process.exit(1); 
});
