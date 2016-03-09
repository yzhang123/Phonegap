// route polyline style
var ROUTE_COLOR_BEST = "#00CC00";
var ROUTE_COLOR = "#0088FF";
var ROUTE_WIDTH = 8;
var ROUTE_OPACITY = 0.6;

// routing
var NUMBER_SAMPLES_PER_ROUTE = 10;

// Geolocation
var GEOLOCATION_MSG = "Geolocating... click here to cancel";
var GEOLOCATION_ERROR_MSG = "Geolocation timed out!";
var GEOLOCATION_TIMEOUT_MS = 8000;

// data
var LOCALSTORAGE_KEY_DATA = "guerillaSensingServer_cache";
var LOCALSTORAGE_KEY_TUTORIAL = "tutorial_shown";
//var DATA_URL = "data.json";
var DATA_URL = "http://portal.teco.edu/guerilla/guerillaSensingServer/index.php/tsdb_query_data/";
var DATA_FEATURES = ['co', 'co2', 'dust', 'height', 'hum', 'no2', 'o3', 'temp', 'uv'];