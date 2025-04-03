
// Function to fetch and display Google Trends
function fetchGoogleTrends() {
    const trendingListElement = document.getElementById('trending-list');
    
    // Check if we have cached trends and if they're still valid
    const cachedTrends = localStorage.getItem('googleTrends');
    const cachedTimestamp = localStorage.getItem('googleTrendsTimestamp');
    const currentTime = new Date().getTime();
    
    // Detailed logging for debugging
    console.group('Google Trends Fetch');
    console.log('Current Time:', new Date(currentTime).toLocaleString());
    
    // Check if cached trends exist and are less than 5 minutes old
    if (cachedTrends && cachedTimestamp) {
        const timeDiff = currentTime - parseInt(cachedTimestamp);
        console.log('Time Difference:', timeDiff, 'ms');
        
        if (timeDiff < 300000) {  // 5 minutes = 300000 milliseconds
            console.log('Using cached trends (within 5 minutes)');
            if (trendingListElement) {
                trendingListElement.innerHTML = cachedTrends;
            }
            console.groupEnd();
            return;
        }
        
        console.log('Cached trends are older than 5 minutes, fetching new trends');
    } else {
        console.log('No cached trends found, fetching new trends');
    }
    
    // We need to use a proxy to avoid CORS issues with the RSS feed
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const trendsUrl = 'https://trends.google.com/trending/rss?geo=VN';
    const encodedUrl = encodeURIComponent(trendsUrl);
    
    fetch(`${corsProxy}${encodedUrl}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            // Parse the XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const items = xmlDoc.querySelectorAll('item');
            
            // Create HTML for trends
            let trendsHtml = '';
            
            // Limit to 9 trends
            const maxTrends = Math.min(items.length, 9);
            
            for (let i = 0; i < maxTrends; i++) {
                const item = items[i];
                const title = item.querySelector('title')?.textContent || 'Unknown Trend';
                
                // Look for ht:news_item_url specifically
                let articleLink = '#';
                const newsItemUrl = item.querySelector('ht\\:news_item_url, news_item_url');
                if (newsItemUrl) {
                    articleLink = newsItemUrl.textContent;
                }
                
                // Fallback to other link types if news_item_url is not found
                if (articleLink === '#') {
                    const links = item.querySelectorAll('link');
                    if (links.length > 1) {
                        articleLink = links[1].textContent;
                    }
                }
                
                // Create a numbered list item
                trendsHtml += `
                    <li class="trending-item">
                        <span class="trend-number">${i + 1}.</span>
                        <a href="${articleLink}" target="_blank">${title}</a>
                    </li>
                `;
            }
            
            // Update the trending list
            if (trendingListElement) {
                trendingListElement.innerHTML = trendsHtml;
                
                // Cache the trends
                localStorage.setItem('googleTrends', trendsHtml);
                localStorage.setItem('googleTrendsTimestamp', currentTime.toString());
                console.log('New trends cached at:', new Date(currentTime).toLocaleString());
            }
            
            console.groupEnd();
        })
        .catch(error => {
            console.error('Error fetching Google Trends:', error);
            
            // Fallback to cached trends if available
            if (cachedTrends && trendingListElement) {
                trendingListElement.innerHTML = cachedTrends;
                console.log('Falling back to cached trends');
            } else if (trendingListElement) {
                // If no cached trends, show error message
                trendingListElement.innerHTML = '<li class="trending-item">Could not fetch trends</li>';
                console.log('No cached trends available');
            }
            
            console.groupEnd();
        });
}
