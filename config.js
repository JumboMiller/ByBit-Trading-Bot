require('dotenv').config();

module.exports = {
  apiKey: process.env.BYBIT_API_KEY,
  apiSecret: process.env.BYBIT_API_SECRET,
  baseUrl: 'https://api.bybit.com'
};
