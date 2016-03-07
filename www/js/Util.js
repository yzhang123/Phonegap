// for debugging errors on phone
window.onerror = function (errorMsg, url, lineNumber) {
    // window.alert("ERROR" +
    //     "\n Message: " + errorMsg +
    //     "\n URL: " + url +
    //     "\n Line#: " + lineNumber);
    return false;
};


// retrieves current location
function getCurrentLocation(callback /* GeocoderResult => void */)
{
    var geocoder = new google.maps.Geocoder;
    if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(
            function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
        
                geocoder.geocode({'location': pos}, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK && results[0])
                        callback(results[0]);
                });
            }, 
            function() { window.alert("The Geolocation service failed."); });
    else
        window.alert("Your browser doesn't support geolocation");
}

// calculates direct distance between two latlng coordinates
function getDistanceFromLatLon(point1 /* Google LatLng */, point2 /* Google LatLng */) {
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

// enqueue event handler IN FRONT of existing handlers
$.fn.preBind = function (type, data, fn) {
    this.each(function () {
        var $this = $(this);

        $this.bind(type, data, fn);

        var currentBindings = $._data(this, 'events')[type];
        if ($.isArray(currentBindings)) {
            currentBindings.unshift(currentBindings.pop());
        }
    });
    return this;
};