// Function to fetch and display market data
function fetchMarketData() {
    const marketWidget = document.querySelector('.market-content');
    let symbols = getTrackedSymbols();
    if (!symbols) {
        symbols = 'BTC,ETH,BNB'; // Default symbols
    }
    // Validate market widget exists
    if (!marketWidget) {
        console.error('Market widget not found');
        return;
    }

    // CryptoCompare API endpoint
    const apiUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbols}&tsyms=USD`;

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
            if (!rawData) {
                marketWidget.innerHTML = 'No data available for these symbols.';
                return;
            }
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

function getTrackedSymbols() {
    return localStorage.getItem('trackedCryptoSymbols') || null;
}

function setTrackedSymbols(symbols) {
    localStorage.setItem('trackedCryptoSymbols', symbols);
}

function setupMarketInput() {
    const input = document.getElementById('crypto-input');
    const btn = document.getElementById('save-crypto-btn');
    if (!input || !btn) return;
    // Prefill input with saved value
    const saved = getTrackedSymbols();
    if (saved) input.value = saved;
    btn.addEventListener('click', () => {
        const val = input.value.trim().toUpperCase().replace(/\s+/g, '');
        if (val) {
            setTrackedSymbols(val);
            fetchMarketData();
        }
    });
}

// Setup input and fetch data on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    setupMarketInput();
    fetchMarketData();
    setInterval(fetchMarketData, 60000);
});
