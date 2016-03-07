
// returns Google LatLng position on a route defined by interpol.
function routeGetPoint(route /* Directionsleg */, interpol /*[0,1] */) {
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

// returns average feature pollution score of given route.
function routeAverageFeature(route, feature)
{
    var sumInfluence = 0;
    for (var i = 0; i <= NUMBER_SAMPLES_PER_ROUTE; i++) {
        var point = routeGetPoint(route, i / NUMBER_SAMPLES_PER_ROUTE);
        if (!point)
            window.alert("point undefined " + i);
        sumInfluence += getFeaturesAt(point)[feature];
    }
    return sumInfluence / (NUMBER_SAMPLES_PER_ROUTE + 1);
}

    
// Calculates feature scores for every route and 
// returns best route index
function chooseBestRoute(
                        routes /* DirectionsRoute[] */,
                        feature,
                        scores /* number[] */) 
{
    // number of alternative routes
    var bestRouteIndex;
    var bestEnvScore;
    for (var route = 0; route < routes.length; route++)
    {
        var currentRoute = routes[route].legs[0];
        var score = routeAverageFeature(currentRoute, feature);
        scores.push(score);
        if (route == 0 || score < bestEnvScore)
        {
            bestRouteIndex = route;
            bestEnvScore = score;
        }
    }
    return bestRouteIndex;
}