
// Function to fetch random movie details
function fetchRandomMovie() {
    const movieNameSpan = document.querySelector('.badge .description span');
    const badgeElement = document.querySelector('.badge');

    // Validate elements exist
    if (!movieNameSpan || !badgeElement) {
        console.error('Movie fetching elements not found');
        return;
    }

    // Array of proxy services to try
    const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://cors-proxy.htmldriven.com/?url='
    ];

    // Function to try fetching with different proxies
    function tryFetchWithProxy(proxyIndex = 0) {
        if (proxyIndex >= proxies.length) {
            console.error('All proxy attempts failed');
            movieNameSpan.textContent = 'Movie Not Found';
            return;
        }

        const corsProxy = proxies[proxyIndex];
        const filmGrabUrl = 'http://film-grab.com/?redirect_to=random';
        const fullUrl = `${corsProxy}${encodeURIComponent(filmGrabUrl)}`;

        fetch(fullUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Create a temporary div to parse HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extract movie title
                const titleElement = doc.querySelector('.entry-title');
                const movieTitle = titleElement ? titleElement.textContent.trim() : 'Unknown Movie';

                // Extract movie image
                const imageElement = doc.querySelector('.entry-thumb img');
                const movieImageUrl = imageElement ? imageElement.src : '';

                // Update movie name
                movieNameSpan.textContent = movieTitle;

                // Update badge background if image exists
                if (movieImageUrl) {
                    // Try loading image directly
                    const testImage = new Image();
                    testImage.onload = () => {
                        // Image loaded successfully
                        badgeElement.style.backgroundImage = `url(${movieImageUrl})`;
                        badgeElement.style.backgroundSize = 'cover';
                        badgeElement.style.backgroundPosition = 'center';
                        console.log('Movie image loaded:', movieTitle);
                    };
                    testImage.onerror = () => {
                        // If direct image fails, try with proxy
                        console.warn('Failed to load image directly');
                        badgeElement.style.backgroundImage = `url(${corsProxy}${encodeURIComponent(movieImageUrl)})`;
                        badgeElement.style.backgroundSize = 'cover';
                        badgeElement.style.backgroundPosition = 'center';
                    };
                    testImage.src = movieImageUrl;
                }

                console.log('Random movie fetched:', movieTitle);
            })
            .catch(error => {
                console.warn(`Proxy ${corsProxy} failed:`, error);
                // Try next proxy
                tryFetchWithProxy(proxyIndex + 1);
            });
    }

    // Start fetching with first proxy
    tryFetchWithProxy();
}
