const ccxt = require('ccxt');

const exchanges = [
    'binance',
    'coinbase',
    'kraken',
    'bitfinex',
    'gemini',
    'kucoin',
    'blockchaincom',
    'cryptocom'
];

const symbol = 'DOGE/USDT'; 

const fetchArbitrageNetProfit = async (symbol) => {
    let buyPrice = Infinity;
    let sellPrice = 0;
    let buyExchangeName = '';
    let sellExchangeName = '';

    console.log("Fetching....")

    for (let exchangeName of exchanges) {
        try {
            const exchange = new ccxt[exchangeName]({
                timeout: 30000, // 3sec
                enableRateLimit: true, 
            });
            await exchange.loadMarkets();

            if (exchange.markets[symbol]) {
                const ticker = await exchange.fetchTicker(symbol);
                const askPrice = ticker.ask; 
                const bidPrice = ticker.bid; 

                if (askPrice < buyPrice) {
                    buyPrice = askPrice;
                    buyExchangeName = exchangeName;
                }

                if (bidPrice > sellPrice) {
                    sellPrice = bidPrice;
                    sellExchangeName = exchangeName;
                }
            } else {
                console.log(`${symbol} not available on ${exchangeName}`);
            }
        } catch (error) {
            console.error(`Error fetching data from ${exchangeName}:`, error.message);
        }
    }

    if (buyPrice === Infinity || sellPrice === 0) {
        console.log('No valid arbitrage opportunity found.');
        return;
    }

    console.log(`Buy ${symbol} on ${buyExchangeName} at $${buyPrice}`);
    console.log(`Sell ${symbol} on ${sellExchangeName} at $${sellPrice}`);

    const buyExchange = new ccxt[buyExchangeName]();
    const sellExchange = new ccxt[sellExchangeName]();
    await buyExchange.loadMarkets();
    await sellExchange.loadMarkets();

    const buyFees = buyExchange.fees['trading'];
    const sellFees = sellExchange.fees['trading'];
    const buyFeeRate = buyFees.taker;
    const sellFeeRate = sellFees.taker;

    const buyFee = buyPrice * buyFeeRate;
    const sellFee = sellPrice * sellFeeRate;

    const netProfit = (sellPrice - buyPrice) - (buyFee + sellFee);
    const percentageProfit = ((sellPrice - buyPrice) / buyPrice) * 100;

    if(netProfit<0) console.log("NO arbitrage oppurtunity.")

    console.log(`Net Profit: $${netProfit.toFixed(2)}`);
    console.log(`Percentage Profit: ${percentageProfit.toFixed(2)}%`);
};

fetchArbitrageNetProfit(symbol);
