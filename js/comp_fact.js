
// Function to fetch and display a random fact
function fetchRandomFact() {
    const randomFactElement = document.getElementById('random-fact');
    
    // Check if we have a cached fact and it's still valid
    const cachedFact = localStorage.getItem('randomFact');
    const cachedTimestamp = localStorage.getItem('randomFactTimestamp');
    const currentTime = new Date().getTime();
    
    // Detailed logging for debugging
    console.group('Random Fact Fetch');
    console.log('Current Time:', new Date(currentTime).toLocaleString());
    console.log('Cached Fact:', cachedFact);
    console.log('Cached Timestamp:', cachedTimestamp ? new Date(parseInt(cachedTimestamp)).toLocaleString() : 'No timestamp');
    
    // Check if cached fact exists and is less than 5 minutes old
    if (cachedFact && cachedTimestamp) {
        const timeDiff = currentTime - parseInt(cachedTimestamp);
        console.log('Time Difference:', timeDiff, 'ms');
        
        if (timeDiff < 300000) {  // 5 minutes = 300000 milliseconds
            console.log('Using cached fact (within 5 minutes)');
            if (randomFactElement) {
                randomFactElement.textContent = cachedFact;
            }
            console.groupEnd();
            return;
        }
        
        console.log('Cached fact is older than 5 minutes, fetching new fact');
    } else {
        console.log('No cached fact found, fetching new fact');
    }
    
    // If no valid cached fact, fetch a new one
    fetch('https://uselessfacts.jsph.pl/random.json', {
        cache: 'no-store'  // Ensure fresh fetch
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Store the fact and current timestamp in localStorage
            const fact = data.text;
            const newTimestamp = new Date().getTime();
            
            try {
                localStorage.setItem('randomFact', fact);
                localStorage.setItem('randomFactTimestamp', newTimestamp.toString());
                
                console.log('New fact stored:', fact);
                console.log('New timestamp:', new Date(newTimestamp).toLocaleString());
            } catch (storageError) {
                console.error('Error storing fact in localStorage:', storageError);
            }
            
            // Display the fact
            if (randomFactElement) {
                randomFactElement.textContent = fact;
            }
            console.groupEnd();
        })
        .catch(error => {
            console.error('Error fetching random fact:', error);
            
            // Fallback to cached fact if available
            const cachedFact = localStorage.getItem('randomFact');
            if (cachedFact) {
                if (randomFactElement) {
                    randomFactElement.textContent = cachedFact;
                }
                console.log('Falling back to cached fact');
            } else {
                // If no cached fact, show error message
                if (randomFactElement) {
                    randomFactElement.textContent = "Could not fetch a fact";
                }
                console.log('No cached fact available');
            }
            
            console.groupEnd();
        });
}
