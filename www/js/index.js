window.onerror = function (errorMsg, url, lineNumber) {
    window.alert("ERROR");
    window.alert(errorMsg);
    window.alert(url);
    window.alert(lineNumber);
    return false;
};

var URL = "http://portal.teco.edu/guerilla/guerillaSensingServer/index.php/tsdb_query_data/";
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
        max_height();
    });
    max_height();
}

function onclick(callback)
{
    $.getJSON(URL, function(result, status) {
        if (status == "success")
        {
            callback(parseJSONData(result));
        }
    });
    
}

// if using this function specify callback function 
// that takes the array of parsed objects as parameter
function getData(callback)
{
    $.getJSON(URL, function(result, status) {
        if (status == "success")
        {
            callback(parseJSONData(result));
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

function max_height() {
    var h = $('div[data-role="header"]').outerHeight(true);
    var f = $('div[data-role="footer"]').outerHeight(true);
    var w = $(window).height();
    var c = $('#map');
    var c_h = c.height();
    var c_oh = c.outerHeight(true);
    var c_new = w - h - f - c_oh + c_h;
    c.height(c_new);
}

var map;
var markers = [];
var env_mode = "dust";
var dataready = false;
var data = [];
var heatmap = null;
var travel_mode = null;
var _from = null;
var _to = null;
var directionsService = null;
var directionsDisplay = null;
// when data base successfully retrieved
function ondataready(objects) 
{
    dataready = true;
    for( var o of objects) {
        data.push({location: new google.maps.LatLng(parseFloat(o.lat), parseFloat(o.lon)), weight: parseFloat(o[env_mode] )});
    }
    heatmap = new google.maps.visualization.HeatmapLayer({
            data : data,
            map : map,
            radius: 100, opacity : 1
    });
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
    if (!fromValid || !toValid) {
        directionsDisplay.setDirections(null);
        return;
    }
    markers.forEach(function(marker) {
        marker.setMap(null);
    });
    markers = [];
    var directionRequest = {
        origin: {'placeId': _from.place_id},
        destination: {'placeId': _to.place_id},
        provideRouteAlternatives: true,
        travelMode: travel_mode
    }
    directionsService.route(directionRequest, 
                            function(response, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                    chooseBestRoute(response, map);
                                    for (var i = 0, len = response.routes.length; i < len; i++) {
                                        new google.maps.DirectionsRenderer({
                                            map: map,
                                            directions: response,
                                            routeIndex: i
                                        });
                                    }
                                    //directionsDisplay.setDirections(response);
                                } else {
                                    window.alert('Directions request failed due to ' + status);
                                }
                            });
}

    

// // takes a directionsResult object as argument
function chooseBestRoute(directionResult, map) {
    // number of alternative routes
    var n_routes = 1;//directionResult.routes.length;
    for (var route = 0; route < n_routes; route++) {
        var currentRoute = directionResult.routes[route].legs[0];
        // for (var step = 0; step < currentRoute.steps.length; step++) {
        //     markers.push(new google.maps.Marker({
        //             map : map,
        //             position :  currentRoute.steps[step].start_location
        //     }));
        // }
        var n = 1/10;
        for (var i = 0; i <= 1; i+=n) {
            markers.push(new google.maps.Marker({
                    map: map,
                    position: LatLong(currentRoute, i)
            }));
        }
    }
    

}

// Directionsleg object = route, interpol [0,1]
function LatLong(route, interpol) {
    var totalDistance = route.distance.value;
    if (interpol < 0 || interpol > 1) return;
    if (totalDistance) {
        // distance from starting point of route to search point indicated by interpol
        var startToSearchDistance = totalDistance * interpol;
        var startPoint = route.start_location;       
        for (var s = 0, currentDistance = 0; s < route.steps.length; s++) {
            var step = route.steps[s];
            if (currentDistance + step.distance.value > startToSearchDistance) {
                // search point on this step line
                for (var p = 0; p < step.path.length - 1; p++)
                {
                    var pathPointA = step.path[p];// LatLng object
                    var pathPointB = step.path[p + 1];// LatLng object
                    var distance = getDistanceFromLatLon(
                        pathPointA.lat(), pathPointA.lng(), 
                        pathPointB.lat(), pathPointB.lng());
                    
                    if (distance + currentDistance > startToSearchDistance)
                    {
                        // search point found on this path
                        var restDistanceFactor = (startToSearchDistance - currentDistance) / distance;
                        var result = new google.maps.LatLng(
                            pathPointA.lat() + restDistanceFactor * (pathPointB.lat() - pathPointA.lat()),
                            pathPointA.lng() + restDistanceFactor * (pathPointB.lng() - pathPointA.lng()));
                        
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
    
    google.maps.event.addListenerOnce(map, 'idle', function() {
        google.maps.event.trigger(map, 'resize');
    })
    
    //    for (p of points) {
    //         var marker = new google.maps.Marker({
    //             position: p.location, 
    //             map: map2
    //         });
    //    }
    
    // function call getData
    getData(function(objects){
        ondataready(objects);
        
    });
    
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
    
    // not working yet
    searchField1.children(".ui-input-clear").click(function() {
        window.alert("works");
        _from = null;
        updateContent();
    });
    searchField2.children(".ui-input-clear").click(function() {
        _to = null;
        updateContent();
    });
    
    


}
// end of async initMap


function getDistanceFromLatLon(lat1,lon1,lat2,lon2) {
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