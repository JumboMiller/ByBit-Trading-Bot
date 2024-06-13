require('dotenv').config();
const GateApi = require('gate-api');
const moment = require('moment-timezone');

const client = new GateApi.ApiClient();
client.setApiKeySecret(process.env.GATE_API_KEY, process.env.GATE_API_SECRET);

async function getServerTimeFunction() {
  const apiInstance = new GateApi.SpotApi(client);
  try {
    const serverTime = await apiInstance.getSystemTime();
    return serverTime.response.data.server_time;
  } catch (error) {
    console.error('Error fetching server time:', error);
  }
}

async function buyMarket(symbol, amount, side) {
  
  const apiInstance = new GateApi.SpotApi(client);
  const order = new GateApi.Order();
  order.currencyPair = symbol;
  order.side = side;
  order.type = 'market';
  order.account = 'spot';
  order.timeInForce = 'ioc';
  order.amount = amount.toString();

  try {
    const orderResult = await apiInstance.createOrder(order);
    console.log('Order Result:', orderResult);
  } catch (error) {
    console.error('Error creating order:', error);
  }
}
//BACGAMES_USDT
async function main() {
  const targetTime = moment.tz('2024-06-03 12:00:00', 'YYYY-MM-DD HH:mm:ss', 'UTC'); 
  
  while (true) {
    const serverTime = await getServerTimeFunction();

    const currentTime = moment(serverTime);

    console.log(`Current server time: ${currentTime.format('YYYY-MM-DD HH:mm:ss')}`);

    if (currentTime.isSameOrAfter(targetTime)) {
      console.log('Target time reached. Placing market order... VZLOM PENTAGONA');
      for (let index = 0; index < 8; index++) {
        await buyMarket('BACGAMES_USDT', 15, 'buy'); 
      } 
      console.log('Waiting for selling')
      await new Promise(resolve => setTimeout(resolve, 1000));
      for (let index = 0; index < 1; index++) {
        await buyMarket('BACGAMES_USDT', 270 , 'sell'); 
      }
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

main();
