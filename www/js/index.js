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



// This callback function gets called when Map is ready (see map request in index.html)
function initMap() {
    var map = null;
	var fromId = null;
    var toId = null;
    var _from = null;
    var _to = null;
    var travel_mode = google.maps.TravelMode.WALKING;
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
    
   
    // Create a marker and put it on the map.
    getData(function(objects){
        var points = [];
        for( var o of objects) {
            points.push({location: new google.maps.LatLng(parseFloat(o.lat), parseFloat(o.lon)), weight: parseFloat(o.co2 )});
        }
       var heatmap = new google.maps.visualization.HeatmapLayer({
           data : points,
           map : map,
           radius: 100, opacity : 1
       });
    //    for (p of points) {
    //         var marker = new google.maps.Marker({
    //             position: p.location, 
    //             map: map2
    //         });
    //    }
        
    });
    
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setMap(map);
    var searchField1 = $("#fromInput");
    var searchField2 = $("#toInput");
    var markers = [];
    
    // var searchBox1 = new google.maps.places.SearchBox(searchField1[0]);
    // var searchBox2 = new google.maps.places.SearchBox(searchField2[0]);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchField1[0]);
    // map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchField2[0]);
    var autocomplete1 = new google.maps.places.Autocomplete(searchField1[0]);
    autocomplete1.bindTo('bounds', map);
    var autocomplete2 = new google.maps.places.Autocomplete(searchField2[0]);
    autocomplete2.bindTo('bounds', map);
    
    
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
    searchField1.children(".ui-input-clear").click(function() {
        window.alert("works");
        _from = null;
        updateContent();
    });
    searchField2.children(".ui-input-clear").click(function() {
        _to = null;
        updateContent();
    });
    
    
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
        directionsService.route({
            origin: {'placeId': _from.place_id},
                    destination: {'placeId': _to.place_id},
                    travelMode: travel_mode
                    }, 
            function(response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
    }
    
 
        
}