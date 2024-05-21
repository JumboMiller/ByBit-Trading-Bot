require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const API_KEY = process.env.GATE_API_KEY;
const API_SECRET = process.env.GATE_API_SECRET;

const BASE_URL = 'https://api.gateio.ws/api/v4';

function signRequest(queryString, method, endpoint) {
    const hmac = crypto.createHmac('sha512', API_SECRET);
    const payload = `${method}\n${endpoint}\n${queryString}\n`;
    return hmac.update(payload).digest('hex');
}

async function sendRequest(method, endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const signature = signRequest(queryString, method, endpoint);

    const headers = {
        'KEY': API_KEY,
        'SIGN': signature,
        'Content-Type': 'application/json'
    };

    const url = `${BASE_URL}${endpoint}${method === 'GET' && queryString ? `?${queryString}` : ''}`;

    const options = {
        method,
        headers,
        body: method === 'POST' ? JSON.stringify(params) : undefined
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        return null;
    }
}

async function getServerTime() {
    const endpoint = '/spot/time';
    return await sendRequest('GET', endpoint);
}


async function placeMarketOrder(category,symbol,qty,side,orderType) {
    const endpoint = '/spot/orders';
    const params = {
        currency_pair: symbol,
        type: orderType,
        account: category,
        amount: qty,
        time_in_force: 'ioc',  
        side: side
    };
    return await sendRequest('POST', endpoint, params);
}


async function run() {
    const serverTime = await getServerTime();
    const buyTime = new Date(serverTime + 5000); // Buy after 5 s
    
    console.log(`Current Server Time: ${new Date(serverTime).toISOString()}`);
    console.log(`Scheduled Buy Time: ${buyTime.toISOString()}`);
    
    const waitTime = buyTime - new Date().getTime();
    console.log(`Waiting for ${waitTime / 1000} seconds...`);
/*
    setTimeout(async () => {
    
        const category = 'spot'; //" Spot forever "
        const symbol = 'FTM_USDT'; // Change to desired trading pair
        const qty = '4'; // Change to desired quantity
        const side = 'sell' // Sell <-> Buy
        const orderType = 'market'; // Buy

        console.log('Placing market order...');

        const orderResult = await placeMarketOrder(category,symbol,qty,side,orderType);
        console.log('Order Result:', orderResult);
    }, waitTime);*/
}

run();
