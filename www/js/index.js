/* global x */
window.onerror = function (errorMsg, url, lineNumber) {
    window.alert("ERROR");
    window.alert(errorMsg);
    window.alert(url);
    window.alert(lineNumber);
    return false;
};

var URL = "data.json"; // TODO: change back to: "http://portal.teco.edu/guerilla/guerillaSensingServer/index.php/tsdb_query_data/";
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        main();
    }
};

var button1;
var text1;

function main() 
{
    //button1 = $("#button1");
    text1 = $("#text1");
    //button1.click(onclick);
    $(window).unbind();
    $(window).bind('pageshow resize orientationchange', function(e){
        adjustSize();
    });
    adjustSize();
}

var map;
var markerClusterer;
var markers = [];
var env_mode = "co";
var dataready = false;
var objectsarray = [];
var travel_mode = null;
var _from = null;
var _to = null;
var directionsService = null;
var directionsDisplay = null;
var envmaps = {};
var features = [];
var polylines = [];
// if using this function specify callback function 
// that takes the array of parsed objects as parameter
function getData()
{
    $.getJSON(URL, function(result, status) {
        if (status == "success")
        {
            var objects = parseJSONData(result);
            features = ['co', 'co2', 'dust', 'hum', 'no2', 'o3', 'temp', 'uv'];
            for( var o of objects) {
                var obj = {};
                obj.location = new google.maps.LatLng(parseFloat(o.lat), parseFloat(o.lon));
                for (var i of features)
                {
                   obj[i] = parseFloat(o[i]); 
                }
                objectsarray.push(obj);

            }
            ondataready();
        }
    });
    
}

// returns objects array, each element is an object that correspond to one row of data
// retrieve data by accessing the feature e.g. "time", "sequence_number" ect
// returns raw data
function parseJSONData(data)
{
    var objects = [];
    if (data.length > 1)
    {
        window.alert(data.length + " objects!");
    } 
    else 
    {
        var columns = data[0].columns;
        for (var p of data[0].points)
        {
            var o = { };
            for (var i in columns)
            {
                o[columns[i]] = p[i];
            }
            objects.push(o);
        }
    }
    //text1.text(JSON.stringify(objects));
    return objects;
}

// on window resize
function adjustSize() {
    var h = $('div[data-role="header"]').outerHeight(true);
    var f = $('div[data-role="footer"]').outerHeight(true);
    var w = $(window).height();
    var c = $('#map');
    var c_h = c.height();
    var c_oh = c.outerHeight(true);
    var c_new = w - h - f - c_oh + c_h;
    c.height(c_new);
    if (map)
        google.maps.event.trigger(map, 'resize');
}

// when data base successfully retrieved
function ondataready() 
{
    dataready = true;
 
    for (var i = 0; i < features.length; ++i)
    {    
        var temp = [];
        for( var o of objectsarray) {
            temp.push({location: o.location, weight: o[features[i]] });
        }
        envmaps[features[i]] = temp;
    }
    
    $("input[name='env']").change(function() {
        if ($(this).is(':checked'))
        {
            env_mode = $(this).val();
            refreshMap();
        }
    });
    
    refreshMap();
}

function refreshMap()
{
    if (!dataready)
    {
        window.alert("cannot refresh map because data not ready");
    }
    
    markerClusterer.clearMarkers();
    markers = [];
    for (var dataPoint of envmaps[env_mode])
        markers.push(new google.maps.Marker({
            //icon: icon,
            title: dataPoint.weight.toString(),
            position: dataPoint.location,
            value: dataPoint.weight
        }));
    markerClusterer.addMarkers(markers);
    
    route(_from, _to, travel_mode, directionsService, directionsDisplay);
}

function expandViewportToFitPlace(map, place) {
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];
    // For each place, get the icon, name and location.
    var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
    };

    // Create a marker for each place.
    markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
    }));
    
    if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
    } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
    }
}

function updateContent() {

    if (_from && _from.geometry) {
        expandViewportToFitPlace(map, _from);
    }
    if (_to && _to.geometry) {
        expandViewportToFitPlace(map, _to);
    }
    
    route(_from, _to, travel_mode, directionsService, directionsDisplay);
}

function route(_from, _to, travel_mode,
                directionsService, directionsDisplay) {
    var fromValid = _from && _from.place_id;
    var toValid = _to && _to.place_id;
    
    // clear polylines/routes
    polylines.forEach(function(polyline) {
       polyline.setMap(null); 
    });
    
    if (!fromValid || !toValid) {
        directionsDisplay.setDirections(null);
        return;
    }
    // clear markers
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];
    
    // new start and end markers
    markers.push(new google.maps.Marker({
        position: _from.geometry.location, 
        map: map,
        label: "A",
        title: _from.name
    }));
    markers.push(new google.maps.Marker({
        position: _to.geometry.location, 
        map: map,
        label: "B",
        title: _to.name
    }));
    var directionRequest = {
        origin: {'placeId': _from.place_id},
        destination: {'placeId': _to.place_id},
        provideRouteAlternatives: true,
        travelMode: travel_mode
    }
    directionsService.route(
        directionRequest, 
        function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                //directionsDisplay.setDirections(response);
                var scores = [];
                var bestRouteIndex = chooseBestRoute(response, map, scores);
                for (var i = 0, len = response.routes.length; i < len; i++) {
                    var polyline = new google.maps.Polyline({
                        path: [],
                        strokeColor: i == bestRouteIndex ? "#FF0000" : "#0088FF",
                        strokeWeight: 6,
                        strokeOpacity: 0.6
                    });
                    polylines.push(polyline);
                    var bounds = new google.maps.LatLngBounds();
                    var legs = response.routes[i].legs;
                    for (var leg of legs) {
                        for (var step of leg.steps) {
                            for (var nextSegment of step.path) {
                                polyline.getPath().push(nextSegment);
                                bounds.extend(nextSegment);
                            }
                        }
                    }
                    polyline.setMap(map);
                    map.fitBounds(bounds);
                    var clickHandler = (function (x) { return function() { onPolylineClick(x, scores); } })(i);
                    google.maps.event.addListener(polyline, "click", clickHandler);
                } 
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
}

// i-th polyline/ route is clicked, display its score extracted from scores
function onPolylineClick(i, scores)
{
    $("#footer").text(env_mode + ": " + scores[i]);
}
    
// // takes a directionsResult object as argument
function chooseBestRoute(directionResult, map, scores) {
    // number of alternative routes
    var n_routes = directionResult.routes.length;
    var bestRouteIndex;
    var bestEnvScore;
    for (var route = 0; route < n_routes; route++) {
        var currentRoute = directionResult.routes[route].legs[0];
        var score = average(currentRoute, nearestSensor, env_mode);
        scores.push(score);
        if (route == 0 || score < bestEnvScore)
        {
            bestRouteIndex = route;
            bestEnvScore = score;
        }
    }
    //var n = 1/10;
    // for (var i = 0; i <= 1; i+=n) {
    //     markers.push(new google.maps.Marker({
    //             map: map,
    //             position: LatLong(directionResult.routes[bestRouteIndex].legs[0], i)
    //     }));
    // }
    
    onPolylineClick(bestRouteIndex, scores);
    return bestRouteIndex;
}

function average(route, func, envmode)
{
    var points = [];
    var resolution = 10;
    var sumInfluence = 0;
    for (var i = 0; i <= resolution; i++) {
        var point = LatLong(route, i / resolution);
        points.push(point);
        if (!point)
        {
            window.alert("point undefined "+ i );
        }
        sumInfluence += func(objectsarray, envmode, point);
    }
    return sumInfluence / (resolution + 1);
}

// evaluate environment influence at position  according to envmode feature, e.g. "o2"
function weightedsquareEvaluation(objects, envmode, position)
{
    if (objects.length == 0) {
        window.alert("no data points in data base");
    }
    var minInfluenceDist = 1000;
    var sumInfluence = 0;
    for (var obj of objects)
    {

        var dist = getDistanceFromLatLon(obj.location, position);
        if (dist < minInfluenceDist)
        {
            sumInfluence += obj[envmode]/(dist * dist);
        }
    }
    
    return sumInfluence;
}

function nearestSensor(objects, envmode, position)
{
    if (objects.length == 0) {
        window.alert("no data points in data base");
    }
    var nearestSensor = objects[0];
    var minDist = getDistanceFromLatLon(nearestSensor.location, position);
    for (var obj of objects)
    {
        var dist = getDistanceFromLatLon(obj.location, position);
        if (dist < minDist)
        {
            minDist = dist;
            nearestSensor = obj;
        }
    }
    
    return nearestSensor[envmode];
}

// This callback function gets called when Map is ready (see map request in index.html)
function initMap() {
    travel_mode = google.maps.TravelMode.WALKING;
    // Create map object with parameters.
	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 14,										// Initial zoom
		center: {lat: 49.0128925 , lng: 8.4240023}, 			// Initial LatLong Position.
		mapTypeId: google.maps.MapTypeId.ROADMAP,		// Map type.
		streetViewControl: false,						// Disable all controls
		disableDefaultUI: true,
		zoomControl: false
	});
    markerClusterer = new MarkerClusterer(map, [], { 
        gridSize: 50, 
        minimumClusterSize: 1,
        imagePath: "img/m"
    });
    
    // google.maps.event.addListener(map, 'idle', function() {
    //     google.maps.event.trigger(map, 'resize');
    // });
    
    //    for (p of points) {
    //         var marker = new google.maps.Marker({
    //             position: p.location, 
    //             map: map2
    //         });
    //    }
    
    // function call getData, async code
    getData();
    
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    var searchField1 = $("#fromInput");
    var searchField2 = $("#toInput");
    var autocomplete1 = new google.maps.places.Autocomplete(searchField1[0]);
    autocomplete1.bindTo('bounds', map);
    var autocomplete2 = new google.maps.places.Autocomplete(searchField2[0]);
    autocomplete2.bindTo('bounds', map);
    // if from input text field adress is changed
    autocomplete1.addListener('place_changed', function() {
        _from = autocomplete1.getPlace();
        updateContent();
    });
    // if to input text field adress is changed
    autocomplete2.addListener('place_changed', function() {
        _to = autocomplete2.getPlace();
        updateContent();
    });
    
    // update view when deleting on address field
    searchField1.next(".ui-input-clear").click(function() {
        _from = null;
        updateContent();
    });
    searchField2.next(".ui-input-clear").click(function() {
        _to = null;
        updateContent();
    });
}
// end of async initMap


// Directionsleg object = route, interpol [0,1]
function LatLong(route, interpol) {
    var totalDistance = route.distance.value;
    if (interpol < 0 || interpol > 1) return;
    if (totalDistance) {
        // distance from starting point of route to search point indicated by interpol
        var startToSearchDistance = totalDistance * interpol;      
        for (var s = 0, currentDistance = 0; s < route.steps.length; s++) {
            var step = route.steps[s];
            if (currentDistance + step.distance.value > startToSearchDistance) {
                // search point on this step line
                for (var p = 0; p < step.path.length - 1; p++)
                {
                    var pathPointA = step.path[p];// LatLng object
                    var pathPointB = step.path[p + 1];// LatLng object
                    var distance = getDistanceFromLatLon(pathPointA, pathPointB);
                    
                    if (distance + currentDistance > startToSearchDistance)
                    {
                        // search point found on this path
                        var restDistanceFactor = (startToSearchDistance - currentDistance) / distance;
                        var result = new google.maps.LatLng(
                            pathPointA.lat() + restDistanceFactor * (pathPointB.lat() - pathPointA.lat()),
                            pathPointA.lng() + restDistanceFactor * (pathPointB.lng() - pathPointA.lng()));
                        //window.alert(JSON.stringify(result) + " dist = " + distance + " p=" + p);
                        return result;
                    }
                    else
                    {
                        currentDistance += distance;
                    }
                        
                }
                return step.end_location;
            }
            else 
            {
                currentDistance += step.distance.value;
            }
        }
    }
    return route.end_location;
}

function getDistanceFromLatLon(point1, point2) {
  if (!point1 || !point2)
  {
      window.alert("getDistanceFromLatLon got undefined points");
  }
  var lat1 = point1.lat();
  var lon1 = point1.lng();
  var lat2 = point2.lat();
  var lon2 = point2.lng();
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

// called when drop down button is clicked - opens text fields for routing
function dropDownTable() {
    var arrow = $("#dropDownTable"); 
    var dropDownContainer = $("#dropDownContainer");
    if (arrow.hasClass("ui-icon-carat-d"))
    {
        arrow.removeClass("ui-icon-carat-d");    
        arrow.addClass("ui-icon-carat-u");
        // show table
        dropDownContainer.addClass("tableVisible");
    }
    else 
    {
        arrow.removeClass("ui-icon-carat-u");    
        arrow.addClass("ui-icon-carat-d");
        // delete table
        dropDownContainer.removeClass("tableVisible");
    }
    
}

function toggleOnchange()
{
    var toggle = $("#envmap-toggle");
    if (toggle.is(":checked")) {
        $("#map").removeClass("hideClusterIcons");
    } 
    else
    {
        $("#map").addClass("hideClusterIcons");
    }
}