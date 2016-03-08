
// callback function when Google Maps plugin is ready (see map request in index.html)
// e.g. google.maps... exists now
function onGoogleMapsReady() {
    var mapContainer = $("#map");
    // Create map object with parameters.
	map = new google.maps.Map(mapContainer[0], {
		zoom: 14,										// Initial zoom
		center: { lat: 49.0146208, lng: 8.3949888 },      // Initial routeGetPoint Position.
		mapTypeId: google.maps.MapTypeId.ROADMAP,		// Map type.
		streetViewControl: false,						// Disable all controls
		disableDefaultUI: true,
		zoomControl: false
	});
    
    //idle when map pieces loaded
    google.maps.event.addListenerOnce(map, 'idle', hideLoadingScreen);
    
    // keep Google Maps internal size up-to-date
    function resizeGoogleMaps() { google.maps.event.trigger(map, 'resize'); }
    $(window).unbind().bind('pageshow resize orientationchange', function() { resizeGoogleMaps(); });
    resizeGoogleMaps();
    
    mapContainer.on("touchstart click mousedown", hideSearchFields);
    markerClusterer = new MarkerClusterer(map, [], { 
        gridSize: 50, 
        minimumClusterSize: 1,
        imagePath: "img/m"
    });
    
    // update travel mode on upper navigation button click
    $("a.travel-mode").click(function() {
        var travelModeId = $(this).attr("id");
        changeCurrentTravelMode(travelModeId);
    });
    //set initial travel mode
    changeCurrentTravelMode(google.maps.TravelMode.WALKING);
    
    // update current feature on left nav feature bar change
    $("input[name='env']").change(function() {
        if ($(this).is(':checked'))
            changeCurrentFeature($(this).val());
    });
    //set initial feature
    changeCurrentFeature(DATA_FEATURES[0]);
    
    // update data
    updateDataAsync(onDataUpdated);
    
    initLocationSearchField(map, $("#fromInput"), setFrom, clearFrom);
    initLocationSearchField(map, $("#toInput")  , setTo  , clearTo);
}
// end of async onGoogleMapsReady

function clearFrom() { _from = null; updateMap(false); }
function setFrom(name /* string */, location /* LatLng */)
{
    _from = { name: name, location: location };
    updateMap(true);
}
function clearTo() { _to = null; updateMap(false); }
function setTo(name /* string */, location /* LatLng */)
{
    _to = { name: name, location: location };
    updateMap(true);
}

var map;
var markerClusterer;
var markers = [];
var travel_mode = null; // string
var _from = null; // { name: string, location: LatLng } 
var _to = null;   // { name: string, location: LatLng }  
var current_feature;
var polylines = [];

//called when env data was changed
function onDataUpdated()
{
    updateMarkerClusters();
    updateMap(false);
}

function changeCurrentTravelMode(travelMode)
{
    travel_mode = travelMode;
    $(".travel-mode").removeClass("header-icon-active");
    $("#" + travelMode).addClass("header-icon-active");
    updateMap(false);
}

// refreshes map with all its markers and updates the routing accordingly 
function changeCurrentFeature(feature)
{
    current_feature = feature;
    $("#footer").html("Markers represent: <b>" + featureLabel(current_feature) + "</b>");
    
    updateMarkerClusters();
    updateMap(false);
}

function updateMarkerClusters()
{
    markerClusterer.clearMarkers();
    var markers = [];
    for (var dataPoint of objectsarray)
        markers.push(new google.maps.Marker({
            title: dataPoint[current_feature].toString(),
            position: latLngJ2G(dataPoint.location),
            value: dataPoint[current_feature]
        }));
    markerClusterer.addMarkers(markers);
}

// add marker with given label and info window with place name to given place
function addMarkerAtPlace(
    location /* LatLng */, 
    label /* string */,
    popupContent /* JQuery */)
{
    var marker = new google.maps.Marker({
        position: location, 
        map: map,
        label: label
    });

    marker.addListener("click", function() { showInfoWindow(map, popupContent, marker); });
    markers.push(marker);
}

// updates routing on map dependent on current start and end address
function updateMap(adjustViewPort /* boolean */) {
    closeInfoWindow();
    hideTravelModeButtons();
    
    // clear markers
    for (var marker of markers)
        marker.setMap(null);
    markers = [];

     // clear polylines/routes
    for (var polyline of polylines)
        polyline.setMap(null);
    polylines = [];

    // add markers
    if (_from)
        addMarkerAtPlace(_from.location, "A", createPlaceDescription(_from));
    if (_to)
        addMarkerAtPlace(_to.location, "B", createPlaceDescription(_to));

    // add routes
    if (_from && _to)
    {
        showTravelModeButtons();
        routeAsync(_from, _to, travel_mode, function (routes) { showRoutes(routes, adjustViewPort); });
    }
    else if (adjustViewPort)
    {   // adjust viewport
        if (_from)
            map.setCenter(_from.location);
        if (_to)
            map.setCenter(_to.location);
    }
}

function showRoutes(routes /* DirectionsRoute[] */, adjustViewPort /* boolean */)
{
    var scores = [];
    var bestRouteIndex = chooseBestRoute(routes, current_feature, scores);
    //onPolylineClick(bestRouteIndex, scores);
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0, len = routes.length; i < len; i++) {
        var polyline = new google.maps.Polyline({
            path: [],
            strokeColor: i == bestRouteIndex ? ROUTE_COLOR_BEST : ROUTE_COLOR,
            strokeWeight: ROUTE_WIDTH,
            strokeOpacity: ROUTE_OPACITY
        });
        polylines.push(polyline);
        var legs = routes[i].legs;
        for (var leg of legs) 
            for (var step of leg.steps) 
                for (var nextSegment of step.path) {
                    polyline.getPath().push(nextSegment);
                    bounds.extend(nextSegment);
                }

        polyline.setMap(map);
        var clickHandler = (function (x) { return function(event) { 
            showInfoWindow(map, createRouteDescription(routes[x].legs[0], scores[x]), undefined, event.latLng); } 
        })(i);
        google.maps.event.addListener(polyline, "click", clickHandler);
    } 
    if (adjustViewPort) map.fitBounds(bounds);
}

// calculates routing if start and end address are valid, otherwise clears all routes/polylines
function routeAsync(_from, _to, travel_mode, callback) {
    (new google.maps.DirectionsService).route(
        {
            origin: _from.location,
            destination: _to.location,
            provideRouteAlternatives: true,
            travelMode: travel_mode
        }, 
        function(response, status) {
            if (status === google.maps.DirectionsStatus.OK)
                callback(response.routes);
            else
                window.alert('Failed to Find Directions for ' + travel_mode);
        });
}



