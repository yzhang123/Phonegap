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
var map;

function main() 
{
    button1 = $("#button1");
    text1 = $("#text1");
    map = $("#map");
    button1.click(onclick);
    
}

function onclick()
{
    $.getJSON(URL, function(result, status) {
        if (status == "success")
        {
            parseJSONData(result);
        }
    });
    
}


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

function max_height(){
    var h = $('div[data-role="header"]').outerHeight(true);
    var f = $('div[data-role="footer"]').outerHeight(true);
    var w = $(window).height();
    var c = $('div[data-role="content"]');
    var c_h = c.height();
    var c_oh = c.outerHeight(true);
    var c_new = w - h - f - c_oh + c_h;
    var total = h + f + c_oh;
    if(c_h<c.get(0).scrollHeight){
        c.height(c.get(0).scrollHeight);
    }else{
        c.height(c_new);
    }
}


// This callback function gets called when Map is ready (see map request in index.html)
function initMap() {
	
	// Create map object with parameters.
	var map = new google.maps.Map(map[0], {
		zoom: 13,										// Initial zoom
		center: {lat: 37.775, lng: -122.434}, 			// Initial LatLong Position.
		mapTypeId: google.maps.MapTypeId.ROADMAP,		// Map type.
		streetViewControl: false,						// Disable all controls
		disableDefaultUI: true,
		zoomControl: false
	});
	
	
}