
// Function to fetch and display market data
function fetchMarketData() {
    const marketWidget = document.querySelector('.market-content');
    
    // Validate market widget exists
    if (!marketWidget) {
        console.error('Market widget not found');
        return;
    }

    // CryptoCompare API endpoint
    const apiUrl = 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,BNB,C98&tsyms=USD';

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Extract raw data
            const rawData = data.RAW;
            
            // Create market data HTML
            const marketHTML = Object.entries(rawData).map(([symbol, details]) => {
                const price = details.USD.PRICE.toFixed(2);
                const changePercent = details.USD.CHANGEPCT24HOUR.toFixed(2);
                const changeClass = changePercent >= 0 ? 'positive' : 'negative';
                
                return `
                    <div class="market-item">
                        <span class="symbol">${symbol}</span>
                        <span class="price">$${price}</span>
                        <span class="change ${changeClass}">${changePercent}%</span>
                    </div>
                `;
            }).join('');

            // Update market widget
            marketWidget.innerHTML = marketHTML;

            console.log('Market data fetched successfully');
        })
        .catch(error => {
            console.error('Error fetching market data:', error);
            marketWidget.innerHTML = 'Failed to load market data';
        });
}
