require('dotenv').config();
const { RestClientV5 } = require('bybit-api');

const API_KEY = process.env.BYBIT_API_KEY;
const API_SECRET = process.env.BYBIT_API_SECRET;

const client = new RestClientV5({
    key: API_KEY,
    secret: API_SECRET,
    estnet: false, 
});

async function getServerTime() {
  try {
    const timeResponse = await client.getServerTime();
    console.log(timeResponse)
    return timeResponse.time;
  } catch (error) {
    console.error('Error fetching server time:', error);
    throw error;
  }
}

async function placeMarketOrder(category,symbol,qty,side,orderType) {
  try {
    const orderResponse = await client.submitOrder({
        category,
        symbol,
        side,
        orderType,
        qty,
    });
    return orderResponse;
  } catch (error) {
        console.error('Error placing market order:', error);
        throw error;
  }
}

async function run() {
  try {
    const serverTime = await getServerTime();
    const buyTime = new Date(serverTime + 5000); // Buy after 5 s
    
    console.log(`Current Server Time: ${new Date(serverTime).toISOString()}`);
    console.log(`Scheduled Buy Time: ${buyTime.toISOString()}`);
    
    const waitTime = buyTime - new Date().getTime();
    console.log(`Waiting for ${waitTime / 1000} seconds...`);

    setTimeout(async () => {
    
        const category = 'spot'; //" Spot forever "
        const symbol = 'FTMUSDT'; // Change to desired trading pair
        const qty = '4'; // Change to desired quantity
        const side = 'Sell' // Sell <-> Buy
        const orderType = 'Market'; // Buy

        console.log('Placing market order...');

        const orderResult = await placeMarketOrder(category,symbol,qty,side,orderType);
        console.log('Order Result:', orderResult);
    }, waitTime);
  } catch (error) {
        console.error('Error in trading bot:', error);
  }
}

run();
