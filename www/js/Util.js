// for debugging errors on phone
window.onerror = function (errorMsg, url, lineNumber) {
    // window.alert("ERROR" +
    //     "\n Message: " + errorMsg +
    //     "\n URL: " + url +
    //     "\n Line#: " + lineNumber);
    return false;
};

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