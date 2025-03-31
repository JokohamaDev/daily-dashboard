// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    initDashboard();
    
    // Update the time every second
    setInterval(updateTime, 1000);
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Request user's location
    requestLocation();
});

// Global variables for location data
let userLatitude = null;
let userLongitude = null;
let userCity = null;
let userCountry = null;
let userTimezone = null;

// Function to request user's location
function requestLocation() {
    const locationElement = document.getElementById('location');
    const locationCityElement = document.getElementById('location-city');
    
    if (navigator.geolocation) {
        locationElement.textContent = "Requesting location...";
        locationCityElement.textContent = "Locating...";
        
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                userLatitude = position.coords.latitude;
                userLongitude = position.coords.longitude;
                
                // Update location display
                if (locationElement) {
                    locationElement.textContent = `Lat: ${userLatitude.toFixed(2)}°, Long: ${userLongitude.toFixed(2)}°`;
                }
                
                // Get city name using reverse geocoding
                getCityName(userLatitude, userLongitude);
                
                // Get weather data for the location
                getWeatherData(userLatitude, userLongitude);
                
                // Get air quality data
                getAirQualityData(userLatitude, userLongitude);
            },
            // Error callback
            function(error) {
                console.error("Geolocation error:", error);
                
                // Clear location-related widgets
                if (locationElement) {
                    locationElement.textContent = "Location unavailable";
                }
                
                if (locationCityElement) {
                    locationCityElement.textContent = "No location";
                }
                
                // Reset global location variables
                userLatitude = null;
                userLongitude = null;
                userCity = null;
                userCountry = null;
                userTimezone = null;
                
                // Clear weather and air quality widgets
                clearWeatherWidget();
                clearAirQualityWidget();
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        if (locationElement) {
            locationElement.textContent = "Geolocation not supported";
        }
        
        if (locationCityElement) {
            locationCityElement.textContent = "No location";
        }
        
        // Clear weather and air quality widgets
        clearWeatherWidget();
        clearAirQualityWidget();
    }
}

// Function to clear weather widget when no location is available
function clearWeatherWidget() {
    const weatherIcon = document.querySelector('.weather-icon');
    const temperature = document.querySelector('#temperature');
    const condition = document.querySelector('#WTI');
    const weatherChart = document.getElementById('weather-chart');
    
    if (weatherIcon) weatherIcon.textContent = "❓";
    if (temperature) temperature.textContent = "--°C";
    if (condition) condition.textContent = "Location required";
    if (weatherChart) weatherChart.innerHTML = '';
}

// Function to clear air quality widget when no location is available
function clearAirQualityWidget() {
    const airQualityIcon = document.querySelector('.air-quality-icon');
    const airQualityIndex = document.querySelector('#air-quality-index');
    const airQualityQuality = document.querySelector('#AQI');
    const airQualityChart = document.getElementById('air-quality-chart');
    
    if (airQualityIcon) airQualityIcon.textContent = "❓";
    if (airQualityIndex) airQualityIndex.textContent = "--";
    if (airQualityQuality) airQualityQuality.textContent = "Location required";
    if (airQualityChart) airQualityChart.innerHTML = '';
}

// Function to get city name using Open-Meteo Geocoding API
function getCityName(latitude, longitude) {
    const locationCityElement = document.getElementById('location-city');
    const timezoneElement = document.getElementById('timezone');
    
    console.log(`Fetching city name for coordinates: ${latitude}, ${longitude}`);
    
    // First try using the reverse geocoding endpoint
    const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    
    fetch(reverseGeoUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Nominatim response:", data);
            
            if (data && data.address) {
                // Extract location information
                userCity = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.county || "Unknown city";
                userCountry = data.address.country || "Unknown country";
                
                // Display the location
                if (locationCityElement) {
                    locationCityElement.textContent = `${userCity}`;
                }
                
                // Get timezone from Open-Meteo timezone API
                return fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${latitude}&longitude=${longitude}`);
            } else {
                throw new Error("No address data found");
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Timezone API response:", data);
            
            if (data && data.timeZone) {
                userTimezone = data.timeZone;
                
                // Update timezone display
                if (timezoneElement) {
                    timezoneElement.textContent = `${userCity} time (${userTimezone})`;
                }
                
                // Update time with the correct timezone
                updateTime();
            }
        })
        .catch(error => {
            console.error("Error fetching location details:", error);
            
            // Reset location details
            userCity = null;
            userCountry = null;
            userTimezone = null;
            
            // Update display with minimal information
            if (locationCityElement) {
                locationCityElement.textContent = "Location details unavailable";
            }
            
            if (timezoneElement) {
                timezoneElement.textContent = "Local time";
            }
        });
}

// Function to get weather data using Open-Meteo API
function getWeatherData(latitude, longitude) {
    // Check if location is available
    if (!latitude || !longitude) {
        clearWeatherWidget();
        return;
    }

    const weatherIcon = document.querySelector('.weather-icon');
    const temperature = document.querySelector('#temperature');
    const condition = document.querySelector('#WTI');
    const weatherChart = document.getElementById('weather-chart');
    
    // Open-Meteo API URL with additional parameters for UV index, precipitation probability, and hourly forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,uv_index,weathercode&timezone=auto`;
    
    fetch(weatherUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Weather data:", data);
            
            // Extract current weather information
            const currentWeather = data.current_weather;
            const temp = currentWeather.temperature;
            const windSpeed = currentWeather.windspeed;
            const weatherCode = currentWeather.weathercode;
            
            // Get current hour index for hourly data
            const now = new Date();
            const currentHourIndex = now.getHours();
            
            // Extract UV index and precipitation probability for current hour
            const uvIndex = data.hourly.uv_index[currentHourIndex];
            const rainChance = data.hourly.precipitation_probability[currentHourIndex];
            
            // Map weather codes to descriptions and icons
            const weatherCodeMap = {
                0: { description: "Clear sky", icon: "☀️" },
                1: { description: "Mainly clear", icon: "🌤️" },
                2: { description: "Partly cloudy", icon: "⛅" },
                3: { description: "Overcast", icon: "☁️" },
                45: { description: "Foggy", icon: "🌫️" },
                48: { description: "Depositing rime fog", icon: "🌫️" },
                51: { description: "Light drizzle", icon: "🌦️" },
                53: { description: "Moderate drizzle", icon: "🌧️" },
                55: { description: "Dense drizzle", icon: "🌧️" },
                61: { description: "Slight rain", icon: "🌧️" },
                63: { description: "Moderate rain", icon: "🌧️" },
                65: { description: "Heavy rain", icon: "🌊" },
                66: { description: "Light freezing rain", icon: "🌧️❄️" },
                67: { description: "Heavy freezing rain", icon: "🌧️❄️" },
                71: { description: "Slight snow fall", icon: "🌨️" },
                73: { description: "Moderate snow fall", icon: "🌨️" },
                75: { description: "Heavy snow fall", icon: "❄️" },
                77: { description: "Snow grains", icon: "❄️" },
                80: { description: "Light rain showers", icon: "🌦️" },
                81: { description: "Moderate rain showers", icon: "🌧️" },
                82: { description: "Violent rain showers", icon: "🌊" },
                85: { description: "Light snow showers", icon: "🌨️" },
                86: { description: "Heavy snow showers", icon: "❄️" },
                95: { description: "Thunderstorm", icon: "⛈️" },
                96: { description: "Thunderstorm with light hail", icon: "⛈️" },
                99: { description: "Thunderstorm with heavy hail", icon: "⛈️" }
            };
            
            const weatherInfo = weatherCodeMap[weatherCode] || 
                { description: "Unknown conditions", icon: "🌈" };
            
            // Update weather widget
            if (weatherIcon) {
                weatherIcon.textContent = weatherInfo.icon;
            }
            
            if (temperature) {
                temperature.textContent = `${temp}°C`;
            }
            
            // Add UV index and rain chance to the condition display
            let uvDescription = "Low";
            if (uvIndex > 2 && uvIndex <= 5) uvDescription = "Moderate";
            else if (uvIndex > 5 && uvIndex <= 7) uvDescription = "High";
            else if (uvIndex > 7 && uvIndex <= 10) uvDescription = "Very High";
            else if (uvIndex > 10) uvDescription = "Extreme";
            
            if (condition) {
                condition.innerHTML = `
                    ${weatherInfo.description}<br>
                    Wind: ${windSpeed} km/h<br>
                    UV: ${uvIndex} (${uvDescription})<br>
                    Rain: ${rainChance}%
                `;
            }
            
            // Create hourly forecast chart
            createWeatherForecastChart(data.hourly, weatherChart);
            
            // If we don't have timezone yet, extract it from weather data
            if (!userTimezone && data.timezone) {
                userTimezone = data.timezone;
                const timezoneElement = document.getElementById('timezone');
                if (timezoneElement) {
                    timezoneElement.textContent = userTimezone;
                }
                updateTime();
            }
        })
        .catch(error => {
            console.error("Error fetching weather data:", error);
            clearWeatherWidget();
        });
}

// Function to create weather forecast chart
function createWeatherForecastChart(hourlyData, chartElement) {
    // Clear previous chart
    if (chartElement) {
        chartElement.innerHTML = '';
    }
    
    // Get current hour
    const now = new Date();
    const currentHour = now.getHours();
    
    // Create forecast bars for the next 24 hours
    for (let i = currentHour; i < currentHour + 24; i++) {
        const hourIndex = i % 24;
        const temp = hourlyData.temperature_2m[hourIndex];
        const time = hourIndex + ':00';
        
        // Get weather code for this hour
        const weatherCode = hourlyData.weathercode[hourIndex];
        
        // Map weather code to icon
        const weatherIcons = {
            0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 
            45: "🌫️", 48: "🌫️", 
            51: "🌦️", 53: "🌧️", 55: "🌧️", 
            61: "🌧️", 63: "🌧️", 65: "🌊", 
            80: "🌦️", 81: "🌧️", 82: "🌊"
        };
        
        const icon = weatherIcons[weatherCode] || "🌈";
        
        // Calculate bar height (percentage of max temperature)
        const maxTemp = Math.max(...hourlyData.temperature_2m);
        const minTemp = Math.min(...hourlyData.temperature_2m);
        const range = maxTemp - minTemp;
        const percentage = range > 0 ? ((temp - minTemp) / range) * 100 : 50;
        
        // Create forecast bar
        const bar = document.createElement('div');
        bar.className = 'forecast-bar';
        bar.style.height = `${Math.max(10, percentage)}%`;
        
        // Add time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'forecast-bar-label';
        timeLabel.textContent = time;
        
        // Add temperature value
        const tempValue = document.createElement('div');
        tempValue.className = 'forecast-bar-value';
        tempValue.textContent = `${icon} ${Math.round(temp)}°`;
        
        // Append elements
        bar.appendChild(tempValue);
        bar.appendChild(timeLabel);
        if (chartElement) {
            chartElement.appendChild(bar);
        }
    }
}

// Function to get air quality data using Open-Meteo Air Quality API
function getAirQualityData(latitude, longitude) {
    // Check if location is available
    if (!latitude || !longitude) {
        clearAirQualityWidget();
        return;
    }

    const airQualityIcon = document.querySelector('.air-quality-icon');
    const airQualityIndex = document.querySelector('#air-quality-index');
    const airQualityQuality = document.querySelector('#AQI');
    const airQualityChart = document.getElementById('air-quality-chart');
    
    if (!airQualityIcon || !airQualityIndex || !airQualityQuality) {
        console.error("Air quality elements not found in the DOM");
        return;
    }
    
    // Open-Meteo Air Quality API URL with hourly data
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm10,pm2_5,aerosol_optical_depth&hourly=european_aqi,pm10,pm2_5,aerosol_optical_depth`;
    
    fetch(airQualityUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Air quality data:", data);
            
            // Extract air quality information
            const currentAirQuality = data.current;
            const aqi = currentAirQuality.european_aqi;
            const pm10 = currentAirQuality.pm10;
            const pm2_5 = currentAirQuality.pm2_5;
            const aod = currentAirQuality.aerosol_optical_depth;
            
            // Determine air quality level and icon
            let qualityLevel, icon;
            
            if (aqi <= 20) {
                qualityLevel = "Very Good";
                icon = "🟢";
            } else if (aqi <= 40) {
                qualityLevel = "Good";
                icon = "🟢";
            } else if (aqi <= 60) {
                qualityLevel = "Moderate";
                icon = "🟡";
            } else if (aqi <= 80) {
                qualityLevel = "Poor";
                icon = "🟠";
            } else if (aqi <= 100) {
                qualityLevel = "Very Poor";
                icon = "🔴";
            } else {
                qualityLevel = "Extremely Poor";
                icon = "🟤";
            }
            
            // Update air quality widget
            if (airQualityIcon) {
                airQualityIcon.textContent = icon;
            }
            
            if (airQualityIndex) {
                airQualityIndex.textContent = aqi;
            }
            
            if (airQualityQuality) {
                airQualityQuality.innerHTML = `${qualityLevel}<br> PM2.5: ${pm2_5.toFixed(1)}<br> PM10: ${pm10.toFixed(1)}<br> AOD: ${aod.toFixed(2)}`;
            }
            
            // Create hourly air quality forecast chart
            createAirQualityForecastChart(data.hourly, airQualityChart);
        })
        .catch(error => {
            console.error("Error fetching air quality data:", error);
            clearAirQualityWidget();
        });
}

// Function to create air quality forecast chart
function createAirQualityForecastChart(hourlyData, chartElement) {
    // Clear previous chart
    if (chartElement) {
        chartElement.innerHTML = '';
    }
    
    // Get current hour
    const now = new Date();
    const currentHour = now.getHours();
    
    // Create forecast bars for the next 24 hours
    for (let i = currentHour; i < currentHour + 24; i++) {
        const hourIndex = i % 24;
        const aqi = hourlyData.european_aqi[hourIndex];
        const time = hourIndex + ':00';
        
        // Determine color based on AQI
        let color;
        if (aqi <= 20) color = "#00e400";
        else if (aqi <= 40) color = "#92d050";
        else if (aqi <= 60) color = "#ffff00";
        else if (aqi <= 80) color = "#ff7e00";
        else if (aqi <= 100) color = "#ff0000";
        else color = "#7e0023";
        
        // Calculate bar height (percentage of max AQI, capped at 150)
        const maxAQI = 150; // Cap at 150 for better visualization
        const percentage = Math.min(100, (aqi / maxAQI) * 100);
        
        // Create forecast bar
        const bar = document.createElement('div');
        bar.className = 'forecast-bar air-quality-bar';
        bar.style.height = `${Math.max(10, percentage)}%`;
        bar.style.backgroundColor = color;
        
        // Add time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'forecast-bar-label';
        timeLabel.textContent = time;
        
        // Add AQI value
        const aqiValue = document.createElement('div');
        aqiValue.className = 'forecast-bar-value';
        aqiValue.textContent = Math.round(aqi);
        
        // Append elements
        bar.appendChild(aqiValue);
        bar.appendChild(timeLabel);
        if (chartElement) {
            chartElement.appendChild(bar);
        }
    }
}

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

// Function to initialize the dashboard
function initDashboard() {
    // Update the clock and date
    updateTime();
    
    // Initialize task list with local storage
    initTasks();
    
    // Save notes to local storage
    initNotes();
    
    // Fetch random fact
    fetchRandomFact();
    
    // Fetch Google Trends
    fetchGoogleTrends();
    
    console.log('Dashboard initialized successfully!');
}

// Function to update the time and date displays
function updateTime() {
    const now = new Date();
    const clockElement = document.getElementById('clock');
    const secondsElement = document.getElementById('seconds');
    const dateElement = document.getElementById('date');

    // Time formatting
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // Clock display
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:`;
    }
    
    if (secondsElement) {
        secondsElement.textContent = seconds;
    }

    // Date formatting
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();

    // Update date display
    if (dateElement) {
        dateElement.textContent = `${dayName}, ${monthName} ${date}, ${year}`;
    }
}

// Function to initialize theme toggle
function initThemeToggle() {
    const themeSwitch = document.getElementById('theme-switch');
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeSwitch) {
            themeSwitch.checked = true;
        }
    }
    
    // Add event listener for theme toggle
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Function to initialize tasks with local storage
function initTasks() {
    const taskList = document.querySelector('.task-list');
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Load saved tasks
    if (savedTasks.length > 0) {
        // Clear default tasks
        if (taskList) {
            taskList.innerHTML = '';
        }
        
        // Add saved tasks
        savedTasks.forEach(task => {
            const taskItem = createTaskElement(task.text, task.completed);
            if (taskList) {
                taskList.appendChild(taskItem);
            }
        });
    } else {
        // Set up event listeners for default tasks
        document.querySelectorAll('.task input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', saveTasks);
        });
    }
    
    // Function to create a new task element
    function createTaskElement(text, completed = false) {
        const li = document.createElement('li');
        li.className = 'task';
        
        const id = 'task-' + Date.now();
        
        li.innerHTML = `
            <input type="checkbox" id="${id}" ${completed ? 'checked' : ''}>
            <label for="${id}">${text}</label>
        `;
        
        li.querySelector('input').addEventListener('change', saveTasks);
        
        return li;
    }
    
    // Function to save tasks to local storage
    function saveTasks() {
        const tasks = [];
        
        document.querySelectorAll('.task').forEach(taskElement => {
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            const label = taskElement.querySelector('label');
            
            tasks.push({
                text: label.textContent,
                completed: checkbox.checked
            });
        });
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

// Function to initialize notes with local storage
function initNotes() {
    const notesTextarea = document.querySelector('.notes-content textarea');
    
    // Load saved notes
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        if (notesTextarea) {
            notesTextarea.value = savedNotes;
        }
    }
    
    // Save notes when user types
    if (notesTextarea) {
        notesTextarea.addEventListener('input', function() {
            localStorage.setItem('notes', this.value);
        });
    }
}
