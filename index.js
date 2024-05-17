const axios = require('axios');
const crypto = require('crypto');
const { apiKey, apiSecret, baseUrl } = require('./config');

// Function to generate the signature for requests
function generateSignature(params, secret) {
  const orderedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  return crypto.createHmac('sha256', secret).update(orderedParams).digest('hex');
}

// Function to make API requests
async function makeRequest(endpoint, method = 'GET', params = {}) {
  const timestamp = Date.now();
  params.api_key = apiKey;
  params.timestamp = timestamp;
  const signature = generateSignature(params, apiSecret);
  params.sign = signature;

  try {
    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error.message);
    throw error;
  }
}

// Example function to get server time
async function getServerTime() {
  const endpoint = '/v2/public/time';
  return await makeRequest(endpoint);
}

// Example function to place an order
async function placeOrder(symbol, side, qty, price) {
  const endpoint = '/v2/private/order/create';
  const params = {
    symbol,
    side,
    order_type: 'Limit',
    qty,
    price,
    time_in_force: 'GoodTillCancel'
  };
  return await makeRequest(endpoint, 'POST', params);
}

// Main function to run the bot
async function runBot() {
  try {
    const time = await getServerTime();
    console.log('Server time:', time);

    // Example order placement
    /*const order = await placeOrder('BTCUSD', 'Buy', 1, 30000);
    console.log('Order placed:', order);*/
  } catch (error) {
    console.error('Error running bot:', error.message);
  }
}

runBot();
