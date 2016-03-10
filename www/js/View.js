// extends standard search field by wanted behaviour.
function initLocationSearchField(
    map          /* Map */,
    inputElement /* JQuery */, 
    setPlace     /* (string, LatLng) => void */,
    clearPlace   /* ()               => void */)
{
    var nestedButton = inputElement.next(".ui-input-clear");
    
    // autocompletion
    var autocomplete = new google.maps.places.Autocomplete(inputElement[0]);
    autocomplete.bindTo('bounds', map);
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace(); /* PlaceResult */
        setPlace(place.name, place.geometry.location);
    });
    
    var placeHolder = inputElement.attr("placeholder");
    
    // GPS retrieval
    var gpsTimoutHandle = null;
    function triggerGPSlookup()
    {
        cancelGPSlookup(); // for cleanup
        nestedButton.css("opacity", 0);
        inputElement.attr("placeholder", GEOLOCATION_MSG);
        gpsTimoutHandle = setTimeout(gpsTimeout, GEOLOCATION_TIMEOUT_MS);
        getCurrentLocation(function(result /* GeocoderResult */) {
            if (gpsTimoutHandle !== null)
            {
                cancelGPSlookup(); // for cleanup of timeout
                inputElement.val(result.formatted_address);
                inputElement.trigger("input");
                setPlace(result.formatted_address, result.geometry.location);
            }
        });
    }
    function cancelGPSlookup()
    {
        //reset of From /To
        inputElement.attr("placeholder", placeHolder);
        if (gpsTimoutHandle !== null)
        {
            nestedButton.css("opacity", 1);
            clearTimeout(gpsTimoutHandle);
            gpsTimoutHandle = null;
        }
    }
    function gpsTimeout()
    {
        cancelGPSlookup();
        inputElement.attr("placeholder", GEOLOCATION_ERROR_MSG);
    }
    inputElement.click(cancelGPSlookup); // if the user changes her/his mind...
    
    // attach quick actions (gives meaning to the button inside the search field)
    nestedButton.preBind("click", function(event) {
        if (nestedButton.hasClass("ui-input-clear-hidden")) // => geolocate
        {
            // stop further event handlers on the same button (in this case clearing the field) 
            // since we use the same button for 2 purposes: clear and locate
            event.stopImmediatePropagation();
            triggerGPSlookup();
        }
        else
            clearPlace();
    });
}

// show/hide UI elements
function hideLoadingScreen()
{
    $("#loading-screen").hide();
}
function hideTravelModeButtons()
{
    $(".travel-mode").hide();
}
function showTravelModeButtons()
{
    $(".travel-mode").show();
}
function hideSearchFields()
{
    $("#dropDownContainer").removeClass("tableVisible");
}
function toggleSearchFields() 
{
    $("#dropDownContainer").toggleClass("tableVisible");
}
function toggleClusterIcons()
{
    if ($("#envmap-toggle").is(":checked"))
        $("#map").removeClass("hideClusterIcons");
    else
        $("#map").addClass("hideClusterIcons");
}

// description generators
function createTableRow(col1, col2)
{
    return $("<tr>")
        .append($("<td>").text(col1))
        .append($("<td>").text(col2));
}
function createPlaceDescription(place /* { name: string, location: LatLng } */) /* JQuery */
{
    var features = getFeaturesAt(place.location);
    return $("<span>")
        .append(place.name)
        .append($("<br>"))
        .append(featureLabel(current_feature) + ": " + features[current_feature])
}
function createRouteDescription(route, score)
{
    var content = $("<table>").addClass("route-info-window")
        .append(createTableRow(featureLabel(current_feature), score.toFixed(1)).addClass("bold-row"))
        .append(createTableRow("Travel mode", travel_mode));
    if (route.distance)
        content.append(createTableRow("Distance", (route.distance.value / 1000).toFixed(2) + " km"));
    if (route.duration)
        content.append(createTableRow("Duration", (route.duration.value / 60).toFixed(2) + " min"));
    return content;
}