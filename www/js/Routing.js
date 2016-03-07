
function getDistanceFromLatLon(point1 /* LatLng */, point2 /* LatLng */) {
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

// Directionsleg object = route, interpol [0,1]
function routeGetPoint(route, interpol) {
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

function routeAverageFeature(route, feature)
{
    var resolution = 10;
    var sumInfluence = 0;
    for (var i = 0; i <= resolution; i++) {
        var point = routeGetPoint(route, i / resolution);
        if (!point)
            window.alert("point undefined " + i);
        sumInfluence += getFeaturesAt(point)[feature];
    }
    return sumInfluence / (resolution + 1);
}