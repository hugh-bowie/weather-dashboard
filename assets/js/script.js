// Set global variables
var API_KEY = '8ca142d1a7345f046198707f1022c899';
var currentCity;
var lastCity;

// Error handleing for fetch
var handleErrors = (response) => {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}


// Get & display the current conditions
var getCurrentConditions = (event) => {
    // get city name from search box
    let city = $('#search-city').val();
    currentCity = $('#search-city').val();
    // Set the queryURL
    let queryURL = 'https://api.openweathermap.org/data/2.5/weather?q=' + city + '&units=imperial' + '&appid=' + API_KEY;
    fetch(queryURL)
        .then(handleErrors)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            // Save city => local storage
            saveCity(city);
            $('#search-error').text('');
            // Create icon for current weather 
            let currentWeatherIcon = 'https://openweathermap.org/img/w/' + response.weather[0].icon + '.png';
            // Offset UTC timezone - using moment.js
            let currentTimeUTC = response.dt;
            let currentTimeZoneOffset = response.timezone;
            let currentTimeZoneOffsetHours = currentTimeZoneOffset / 60 / 60;
            let currentMoment = moment.unix(currentTimeUTC).utc().utcOffset(currentTimeZoneOffsetHours);
            // Render cities list
            renderCities();
            // Obtain the 5day forecast for the searched city
            getFiveDayForecast(event);
            // Set header text to the found city name
            $('#header-text').text(response.name);
            // HTML Literal for results
            let currentWeatherHTML = `
            <h3>${response.name} ${currentMoment.format('(MM/DD/YY)')}<img src='${currentWeatherIcon}'></h3>
            <ul class='list-unstyled'>
                <li>Temperature: ${response.main.temp}&#8457;</li>
                <li>Humidity: ${response.main.humidity}%</li>
                <li>Wind Speed: ${response.wind.speed} mph</li>
                <li id='uvIndex'>UV Index: </li>
            </ul>`;
            // Append results to the DOM
            $('#current-weather').html(currentWeatherHTML);
            // Get the lat long for the UV search
            let lat = response.coord.lat;
            let lon = response.coord.lon;
            let uvQueryURL = `https://api.openweathermap.org/data/2.5/uvi?appid=${API_KEY}&lat=${lat}&lon=${lon}`;
            // Fetch UV info => set the color display for the UV indx
            fetch(uvQueryURL)
                .then(handleErrors)
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    let uvIndex = response.value;
                    $('#uvIndex').html(`UV Index: <span id='uvVal'> ${uvIndex}</span>`);
                    if (uvIndex >= 0 && uvIndex < 3) {
                        $('#uvVal').attr('class', 'low');
                    } else if (uvIndex >= 3 && uvIndex < 8) {
                        $('#uvVal').attr('class', 'medium');
                    } else if (uvIndex >= 8) {
                        $('#uvVal').attr('class', 'high');
                    }
                });
        })
}


// obtain five day forecast + display to HTML
var getFiveDayForecast = (event) => {
    let city = $('#search-city').val();
    // URL for API search using forecast search
    let queryURL = 'https://api.openweathermap.org/data/2.5/forecast?q=' + city + '&units=imperial' + '&appid=' + API_KEY;
    // Fetch from API
    fetch(queryURL)
        .then(handleErrors)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            // HTML template literal
            let fiveDayForecastHTML = `
        <h2>5-Day Forecast:</h2>
        <div id='fiveDayForecastUl' class='d-inline-flex flex-wrap '>`;
            // Loop over the 5 day forecast and build the template HTML using UTC offset and Open Weather Map icon
            for (let i = 0; i < response.list.length; i++) {
                let dayData = response.list[i];
                let dayTimeUTC = dayData.dt;
                let timeZoneOffset = response.city.timezone;
                let timeZoneOffsetHours = timeZoneOffset / 60 / 60;
                let thisMoment = moment.unix(dayTimeUTC).utc().utcOffset(timeZoneOffsetHours);
                let iconURL = 'https://openweathermap.org/img/w/' + dayData.weather[0].icon + '.png';
                // Only displaying mid-day forecasts
                if (thisMoment.format('HH:mm:ss') === '11:00:00' || thisMoment.format('HH:mm:ss') === '12:00:00' || thisMoment.format('HH:mm:ss') === '13:00:00') {
                    fiveDayForecastHTML += `
                <div class='weather-card card m-2 p0'>
                    <ul class='list-unstyled p-3'>
                        <li>${thisMoment.format('MM/DD/YY')}</li>
                        <li class='weather-icon'><img src='${iconURL}'></li>
                        <li>Temp: ${dayData.main.temp}&#8457;</li>
                        <br>
                        <li>Humidity: ${dayData.main.humidity}%</li>
                    </ul>
                </div>`;
                }
            }
            // Build the HTML template
            fiveDayForecastHTML += `</div>`;
            // Append the five-day forecast to DOM
            $('#five-day-forecast').html(fiveDayForecastHTML);
        })
}

//save the city to localStorage
var saveCity = (newCity) => {
    let cityExists = false;
    // Check if City exists in local storage
    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage['cities' + i] === newCity) {
            cityExists = true;
            break;
        }
    }
    // Save to localStorage if city is new
    if (cityExists === false) {
        localStorage.setItem('cities' + localStorage.length, newCity);
    }
}

// Render the list of searched cities
var renderCities = () => {
    $('#city-results').empty();
    // If localStorage is empty
    if (localStorage.length === 0) {
        if (lastCity) {
            $('#search-city').attr('value', lastCity);
        } else {
            $('#search-city').attr('value', 'Boca Raton');
        }
    } else {
        // Build key of last city written to localStorage
        let lastCityKey = 'cities' + (localStorage.length - 1);
        lastCity = localStorage.getItem(lastCityKey);
        // Set search input to last city searched
        $('#search-city').attr('value', lastCity);
        // Append stored cities to page
        for (let i = 0; i < localStorage.length; i++) {
            let city = localStorage.getItem('cities' + i);
            let cityEl;
            // Set to lastCity if currentCity not set
            if (currentCity === '') {
                currentCity = lastCity;
            }
            // Set button class to active for currentCity
            if (city === currentCity) {
                cityEl = `<button type='button' class='list-group-item list-group-item-action active'>${city}</button></li>`;
            } else {
                cityEl = `<button type='button' class='list-group-item list-group-item-action'>${city}</button></li>`;
            }
            // Append city to page
            $('#city-results').prepend(cityEl);
        }
        // Add a 'clear' button to page if cities list exists
        if (localStorage.length > 0) {
            $('#clear-storage').html($('<a id="clear-storage" href="#">clear</a>'));
        } else {
            $('#clear-storage').html('');
        }
    }

}

// city new search button event listener
$('#search-button').on('click', (event) => {
    event.preventDefault();
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// searched cities buttons event listener
$('#city-results').on('click', (event) => {
    event.preventDefault();
    $('#search-city').val(event.target.textContent);
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// Clear old searched cities from localStorage event listener
$('#clear-storage').on('click', (event) => {
    localStorage.clear();
    renderCities();
});

// Display searched cities
renderCities();

// Get current conditions
getCurrentConditions();
