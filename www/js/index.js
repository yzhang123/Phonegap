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
    onDeviceReady: function() {
        main();
    }
};

function main() 
{
    $(window).unbind();
    $(window).bind('pageshow resize orientationchange', function() { adjustSize(); });
    adjustSize();

    $("input[name='env']").change(function() {
        if ($(this).is(':checked'))
        {
            env_mode = $(this).val();
            refreshMap();
        }
    });
    
    $("#map").click(function() { $("#dropDownContainer").removeClass("tableVisible"); });
}

var map;
var markerClusterer;
var markers = [];
var travel_mode = null;
var _from = null;
var _to = null;
var directionsService = null;
var env_mode = features[0];
var polylines = [];

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

// refreshes map with all its markers and updates the routing accordingly 
function refreshMap()
{
    closeInfoWindows();
    $("#footer").text(featureLabel(env_mode));
    
    markerClusterer.clearMarkers();
    var markers = [];
    for (var dataPoint of envmaps[env_mode])
        markers.push(new google.maps.Marker({
            title: dataPoint.weight.toString(),
            position: dataPoint.location,
            value: dataPoint.weight
        }));
    markerClusterer.addMarkers(markers);
    
    updateContent(false);
}

function expandViewportToFitPlace(map, place) 
{
    if (place.geometry.viewport)
        map.fitBounds(place.geometry.viewport);
    else
        map.setCenter(place.geometry.location);
}

// add marker with given label and info window with place name to given place
function addMarkerAtPlace(place, markerlabel)
{
     var marker = new google.maps.Marker({
        position: place.geometry.location, 
        map: map,
        label: markerlabel
    });

    var env_value = nearestSensorValue(objectsarray, env_mode, place.geometry.location);
    marker.addListener("click", function()
        {
            showInfoWindow($("<span>")
                .append(place.name)
                .append($("<br>"))
                .append(env_value), marker);  
        });
    markers.push(marker);
}
// updates routing on map dependent on current start and end address
function updateContent(adjustViewPort) {
    // clear markers
    for (var marker of markers)
        marker.setMap(null);
    markers = [];

     // clear polylines/routes
    for (var polyline of polylines)
        polyline.setMap(null);

    // add markers
    if (_from && _from.geometry)
        addMarkerAtPlace(_from, "A");
    if (_to && _to.geometry)
        addMarkerAtPlace(_to, "B");

    // add routes
    if (_from && _to)
        route(_from, _to, travel_mode, adjustViewPort, directionsService);
    else if (adjustViewPort)
    {   // adjust viewport
        if (_from && _from.geometry)
            expandViewportToFitPlace(map, _from);
        if (_to && _to.geometry)
            expandViewportToFitPlace(map, _to);
    }
}

// calculates routing if start and end address are valid, otherwise clears all routes/polylines
function route(_from, _to, travel_mode, adjustViewPort, directionsService) {
    var directionRequest = {
        origin: { 'placeId': _from.place_id },
        destination: { 'placeId': _to.place_id },
        provideRouteAlternatives: true,
        travelMode: travel_mode
    }
    directionsService.route(
        directionRequest, 
        function(response, status) {
            if (status === google.maps.DirectionsStatus.OK) {
                var scores = [];
                var bestRouteIndex = chooseBestRoute(response, map, scores);
                var bounds = new google.maps.LatLngBounds();
                for (var i = 0, len = response.routes.length; i < len; i++) {
                    var polyline = new google.maps.Polyline({
                        path: [],
                        strokeColor: i == bestRouteIndex ? "#FF0000" : "#0088FF",
                        strokeWeight: 8,
                        strokeOpacity: 0.6
                    });
                    polylines.push(polyline);
                    var legs = response.routes[i].legs;
                    for (var leg of legs) 
                        for (var step of leg.steps) 
                            for (var nextSegment of step.path) {
                                polyline.getPath().push(nextSegment);
                                bounds.extend(nextSegment);
                            }

                    polyline.setMap(map);
                    var clickHandler = (function (x) { return function(event) { onPolylineClick(event, response.routes[x].legs[0], x, scores); } })(i);
                    google.maps.event.addListener(polyline, "click", clickHandler);
                } 
                if (adjustViewPort) map.fitBounds(bounds);
            } else {
                window.alert('Failed to Find Directions for ' + travel_mode);
            }
        });
}

function createTableRow(col1, col2)
{
    return $("<tr>")
        .append($("<td>").text(col1))
        .append($("<td>").text(col2));
}
// i-th polyline/ route is clicked, display its score extracted from scores
function onPolylineClick(event, route, i, scores)
{
    var content = $("<table>").addClass("route-info-window")
        .append(createTableRow(featureLabel(env_mode), scores[i].toFixed(1)))
        .append(createTableRow("Route Nr.",  i))
        .append(createTableRow("Travel mode",  travel_mode));
    if (route.distance)
        content.append(createTableRow("Distance", (route.distance.value / 1000).toFixed(2) + " km"));
    if (route.duration)
        content.append(createTableRow("Duration", (route.duration.value / 60).toFixed(2) + " min"));
    showInfoWindow(content, undefined, event.latLng);
}
    
// // takes a directionsResult object as argument
function chooseBestRoute(directionResult, map, scores) {
    // number of alternative routes
    var n_routes = directionResult.routes.length;
    var bestRouteIndex;
    var bestEnvScore;
    for (var route = 0; route < n_routes; route++)
    {
        var currentRoute = directionResult.routes[route].legs[0];
        var score = average(currentRoute, nearestSensorValue, env_mode);
        scores.push(score);
        if (route == 0 || score < bestEnvScore)
        {
            bestRouteIndex = route;
            bestEnvScore = score;
        }
    }
    //onPolylineClick(bestRouteIndex, scores);
    return bestRouteIndex;
}

function average(route, func, envmode)
{
    var resolution = 10;
    var sumInfluence = 0;
    for (var i = 0; i <= resolution; i++) {
        var point = LatLong(route, i / resolution);
        if (!point)
            window.alert("point undefined " + i);
        sumInfluence += func(objectsarray, envmode, point);
    }
    return sumInfluence / (resolution + 1);
}

// evaluate environment influence at position  according to envmode feature, e.g. "o2"
function weightedsquareEvaluation(objects, envmode, position)
{
    if (objects.length == 0)
        window.alert("no data points in data base");

    var minInfluenceDist = 1000;
    var sumInfluence = 0;
    for (var obj of objects)
    {
        var dist = getDistanceFromLatLon(obj.location, position);
        if (dist < minInfluenceDist)
            sumInfluence += obj[envmode] / (dist * dist);
    }

    return sumInfluence;
}

// returns nearestSensorValue at a position
function nearestSensorValue(objects, envmode, position)
{
    if (objects.length == 0)
        window.alert("no data points in data base");

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
		center: { lat: 49.0146208, lng: 8.3949888 },      // Initial LatLong Position.
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
    
    google.maps.event.addListenerOnce(map, 'idle', function() { 
        $("#loading-screen").css("display", "none");
    });
    
    // function call updateData, async code
    updateData(refreshMap);
    
    $("a.travel-mode").click(function() {
        var travelModeId = $(this).attr("id");
        travel_mode = google.maps.TravelMode[travelModeId];
        updateContent(false);
    });
    directionsService = new google.maps.DirectionsService;
    var searchField1 = $("#fromInput");
    var searchField2 = $("#toInput");
    var autocomplete1 = new google.maps.places.Autocomplete(searchField1[0]);
    autocomplete1.bindTo('bounds', map);
    var autocomplete2 = new google.maps.places.Autocomplete(searchField2[0]);
    autocomplete2.bindTo('bounds', map);
    // if from input text field adress is changed
    autocomplete1.addListener('place_changed', function() {
        _from = autocomplete1.getPlace();
        updateContent(true);
    });
    // if to input text field adress is changed
    autocomplete2.addListener('place_changed', function() {
        _to = autocomplete2.getPlace();
        updateContent(true);
    });
    
    // update view when deleting on address field
    searchField1.next(".ui-input-clear").preBind("click", function(event) {
        if ($(this).hasClass("ui-input-clear-hidden"))
        {
            // stop further event handlers on the same button, in this case clearing the field since we use the same button for 2 purposes, i.e. clear and locate
            event.stopImmediatePropagation();
            getCurrentLocation(function(location) {
                searchField1.val(location);
                searchField1.trigger("input");
            });
        }
        else 
        {    
            _from = null;
            updateContent(false);
        }
    });
    searchField2.next(".ui-input-clear").preBind("click", function(event) {
        if ($(this).hasClass("ui-input-clear-hidden"))
        {
            event.stopImmediatePropagation();
            getCurrentLocation(function(location) {
                searchField2.val(location);
                searchField2.trigger("input");
            });
        }
        else 
        {    
            _to = null;
            updateContent(false);
        }
    });
}
// end of async initMap


// returns current autocomplete address
function getCurrentLocation(callback)
{
    var geocoder = new google.maps.Geocoder;
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
    
            geocoder.geocode({'location': pos}, function(results, status) {
                if (status === google.maps.GeocoderStatus.OK) {
                    if (results[0]) {
                        callback(results[0].formatted_address);
                    }
                }
            });
        }, function() {
            var infowindow = new google.maps.InfoWindow({map: map});
            handleLocationError(true, infowindow, map.getCenter());
        });
        // return "currentLocation";    
    }
    else
    {
        // Browser doesn't support Geolocation
        var infowindow = new google.maps.InfoWindow({map: map});
        handleLocationError(false, infowindow, map.getCenter());    
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser doesn\'t support geolocation.');
}
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
                        currentDistance += distance;
                }
                return step.end_location;
            }
            else 
                currentDistance += step.distance.value;
        }
    }
    return route.end_location;
}

function getDistanceFromLatLon(point1, point2) {
    if (!point1 || !point2)
        window.alert("getDistanceFromLatLon got undefined points");
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
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d * 1000;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

// called when drop down button is clicked - opens text fields for routing
function dropDownTable() {
    //var arrow = $("#dropDownTable"); 
    $("#dropDownContainer").toggleClass("tableVisible");
}

function toggleOnchange()
{
    if ($("#envmap-toggle").is(":checked"))
        $("#map").removeClass("hideClusterIcons");
    else
        $("#map").addClass("hideClusterIcons");
}