var activeInfoWindow = null;

function showInfoWindow(
    map      /* Map */, 
    content  /* JQuery */, 
    marker   /* Marker? */,
    position /* LatLng? */)
{
    closeInfoWindows();
    
    var infoWindow = new google.maps.InfoWindow();
    infoWindow.setContent(content[0]);
    if (position)
        infoWindow.setPosition(position);
    activeInfoWindow = infoWindow;
    infoWindow.open(map, marker);     
}

function closeInfoWindows(infoWindow)
{
    if (activeInfoWindow) activeInfoWindow.close();
}