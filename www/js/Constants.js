// route polyline style
var ROUTE_COLOR_BEST = "#FF0000";
var ROUTE_COLOR = "#0088FF";
var ROUTE_WIDTH = 8;
var ROUTE_OPACITY = 0.6;

// data
var DATA_LOCALSTORAGE_KEY = "guerillaSensingServer_cache";
var DATA_URL = "data.json"; // TODO: change back to: "http://portal.teco.edu/guerilla/guerillaSensingServer/index.php/tsdb_query_data/";
var DATA_FEATURES = ['co', 'co2', 'dust', 'height', 'hum', 'no2', 'o3', 'temp', 'uv'];