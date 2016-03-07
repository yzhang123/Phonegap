// gives meaning to quick action buttons inside location search fields
function initLocationSearchField(
    map          /* Map */,
    inputElement /* JQuery */, 
    setValue     /* (string, LatLng) => void */,
    clearValue   /* ()               => void */)
{
    // autocompletion
    var autocomplete = new google.maps.places.Autocomplete(inputElement[0]);
    autocomplete.bindTo('bounds', map);
    autocomplete.addListener('place_changed', function() {
        var place = autocomplete.getPlace(); /* PlaceResult */
        setValue(place.name, place.geometry.location);
    });
    
    // attach quick actions (gives meaning to the button inside the search field)
    inputElement.next(".ui-input-clear").preBind("click", function(event) {
        if ($(this).hasClass("ui-input-clear-hidden")) // => geolocate
        {
            // stop further event handlers on the same button (in this case clearing the field) 
            // since we use the same button for 2 purposes: clear and locate
            event.stopImmediatePropagation();
            getCurrentLocation(function(result /* GeocoderResult */) {
                inputElement.val(result.formatted_address);
                inputElement.trigger("input");
                setValue(result.formatted_address, result.geometry.location);
            });
        }
        else
            clearValue();
    });
}

// show/hide UI elements
function hideSplash()
{
    $("#loading-screen").hide();
}
function hideSearchFields()
{
    $("#dropDownContainer").removeClass("tableVisible");
}
function toggleSearchFields() 
{
    //var arrow = $("#dropDownTable"); 
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
        .append(createTableRow(featureLabel(current_feature), score.toFixed(1)))
        .append(createTableRow("Travel mode", travel_mode));
    if (route.distance)
        content.append(createTableRow("Distance", (route.distance.value / 1000).toFixed(2) + " km"));
    if (route.duration)
        content.append(createTableRow("Duration", (route.duration.value / 60).toFixed(2) + " min"));
    return content;
}