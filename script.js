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
                locationElement.textContent = `Lat: ${userLatitude.toFixed(2)}°, Lon: ${userLongitude.toFixed(2)}°`;
                
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
                locationElement.textContent = "Location unavailable";
                locationCityElement.textContent = "No location";
                
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
        locationElement.textContent = "Geolocation not supported";
        locationCityElement.textContent = "No location";
        
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
                locationCityElement.textContent = `${userCity}, ${userCountry}`;
                
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
                timezoneElement.textContent = `${userCity} time (${userTimezone})`;
                
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
            locationCityElement.textContent = "Location details unavailable";
            timezoneElement.textContent = "Local time";
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
            weatherIcon.textContent = weatherInfo.icon;
            temperature.textContent = `${temp}°C`;
            
            // Add UV index and rain chance to the condition display
            let uvDescription = "Low";
            if (uvIndex > 2 && uvIndex <= 5) uvDescription = "Moderate";
            else if (uvIndex > 5 && uvIndex <= 7) uvDescription = "High";
            else if (uvIndex > 7 && uvIndex <= 10) uvDescription = "Very High";
            else if (uvIndex > 10) uvDescription = "Extreme";
            
            condition.innerHTML = `
                ${weatherInfo.description} (${windSpeed} km/h wind)<br>
                UV: ${uvIndex} (${uvDescription})<br>
                Rain: ${rainChance}%
            `;
            
            // Create hourly forecast chart
            createWeatherForecastChart(data.hourly, weatherChart);
            
            // If we don't have timezone yet, extract it from weather data
            if (!userTimezone && data.timezone) {
                userTimezone = data.timezone;
                const timezoneElement = document.getElementById('timezone');
                timezoneElement.textContent = userTimezone;
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
    chartElement.innerHTML = '';
    
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
        chartElement.appendChild(bar);
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
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone&hourly=european_aqi,pm10,pm2_5`;
    
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
            airQualityIcon.textContent = icon;
            airQualityIndex.textContent = aqi;
            airQualityQuality.textContent = `${qualityLevel} (PM2.5: ${pm2_5.toFixed(1)}, PM10: ${pm10.toFixed(1)})`;
            
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
    chartElement.innerHTML = '';
    
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
        chartElement.appendChild(bar);
    }
}

// Function to initialize the dashboard
function initDashboard() {
    // Update the clock and date
    updateTime();
    
    // Initialize Pomodoro timer
    initPomodoro();
    
    // Initialize task list with local storage
    initTasks();
    
    // Save notes to local storage
    initNotes();
    
    console.log('Dashboard initialized successfully!');
}

// Function to update the time and date displays
function updateTime() {
    const clockElement = document.getElementById('clock');
    const secondsElement = document.getElementById('seconds');
    const dateElement = document.getElementById('date');
    const timezoneElement = document.getElementById('timezone');
    
    if (clockElement && secondsElement) {
        const now = new Date();
        
        // If we have user timezone, use it for displaying time
        let timeString, secondsString;
        if (userTimezone) {
            try {
                const options = { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false,
                    timeZone: userTimezone 
                };
                
                timeString = now.toLocaleTimeString('en-US', options);
                
                // Get seconds separately
                secondsString = now.toLocaleTimeString('en-US', {
                    second: '2-digit',
                    timeZone: userTimezone
                }).slice(-2);
                
                // Update timezone display if element exists
                if (timezoneElement && userCity) {
                    timezoneElement.textContent = `${userCity} time (${userTimezone})`;
                } else if (timezoneElement) {
                    timezoneElement.textContent = userTimezone;
                }
            } catch (e) {
                console.error("Error formatting time with timezone:", e);
                // Fallback if timezone is invalid
                timeString = now.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false
                });
                secondsString = now.getSeconds().toString().padStart(2, '0');
                
                if (timezoneElement) {
                    timezoneElement.textContent = "Local time";
                }
            }
        } else {
            timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
            secondsString = now.getSeconds().toString().padStart(2, '0');
            
            if (timezoneElement) {
                timezoneElement.textContent = "Local time";
            }
        }
        
        clockElement.textContent = timeString;
        secondsElement.textContent = secondsString;
    }
    
    updateCalendar();
}

// Function to update the calendar display
function updateCalendar() {
    const dateElement = document.getElementById('date');
    
    if (dateElement) {
        const now = new Date();
        
        // If we have user timezone, use it for displaying date
        let dateString;
        if (userTimezone) {
            try {
                const options = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    timeZone: userTimezone
                };
                
                dateString = now.toLocaleDateString('en-US', options);
            } catch (e) {
                console.error("Error formatting date with timezone:", e);
                // Fallback if timezone is invalid
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateString = now.toLocaleDateString(undefined, options);
            }
        } else {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateString = now.toLocaleDateString(undefined, options);
        }
        
        dateElement.textContent = dateString;
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
        themeSwitch.checked = true;
    }
    
    // Add event listener for theme toggle
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

// Function to initialize Pomodoro timer
function initPomodoro() {
    const timerElement = document.getElementById('timer');
    const startButton = document.getElementById('start-timer');
    
    let timeLeft = 25 * 60; // 25 minutes in seconds
    let timerInterval;
    let isRunning = false;
    
    // Format time as MM:SS
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }
    
    // Update timer display
    function updateTimer() {
        timeLeft--;
        timerElement.textContent = formatTime(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerElement.textContent = "00:00";
            startButton.textContent = "Start";
            isRunning = false;
            
            // Play notification sound or show notification
            alert("Pomodoro session completed!");
            
            // Reset timer
            timeLeft = 25 * 60;
            timerElement.textContent = formatTime(timeLeft);
        }
    }
    
    // Start/pause timer
    startButton.addEventListener('click', function() {
        if (!isRunning) {
            timerInterval = setInterval(updateTimer, 1000);
            startButton.textContent = "Pause";
            isRunning = true;
        } else {
            clearInterval(timerInterval);
            startButton.textContent = "Resume";
            isRunning = false;
        }
    });
}

// Function to initialize tasks with local storage
function initTasks() {
    const taskList = document.querySelector('.task-list');
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Load saved tasks
    if (savedTasks.length > 0) {
        // Clear default tasks
        taskList.innerHTML = '';
        
        // Add saved tasks
        savedTasks.forEach(task => {
            const taskItem = createTaskElement(task.text, task.completed);
            taskList.appendChild(taskItem);
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
        notesTextarea.value = savedNotes;
    }
    
    // Save notes when user types
    notesTextarea.addEventListener('input', function() {
        localStorage.setItem('notes', this.value);
    });
}
