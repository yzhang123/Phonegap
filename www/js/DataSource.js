
function featureLabel(feature)
{
    return $("label[for=" + feature + "]").text(); 
}

var _dataCache = window.localStorage;
function _dataLoad()
{
    var json = _dataCache.getItem(DATA_LOCALSTORAGE_KEY);
    if (json)
        objectsarray = JSON.parse(json);
    else
        console.warn("couldn't find cached data");
}
function _dataSave()
{
    _dataCache.setItem(DATA_LOCALSTORAGE_KEY, JSON.stringify(objectsarray));
}

var objectsarray = [];
_dataLoad();

function latLngJ2G(latLng)
{
    return new google.maps.LatLng(latLng.lat, latLng.lng);
}

// if using this function specify callback function 
// that takes the array of parsed objects as parameter
function updateData(successCallback)
{
    $.ajax({
        dataType: "json",
        url: DATA_URL,
        success: function(jsonData) 
        {
            objectsarray = filterData(parseJSONData(jsonData));
            _dataSave();
            successCallback();
        }
    });
}

// lets through only latest data measured at about the same position
function filterData(data) {
    // sort from new to old
    data = data.sort(function(a, b) { return b.time - a.time; });
    
    // throws away measurements that are up to 8m away from a more recent measurement
    var keys = [];
    function isUnique(elem)
    {
        var key = elem.location.lat.toFixed(4) + " " + elem.location.lng.toFixed(4);
        if (keys.indexOf(key) != -1)
            return false; // found key => not unique
            
        keys.push(key);
        return true;
    }
    return data.filter(isUnique);
}

// returns objects array, each element is an object that correspond to one row of data
// retrieve data by accessing the feature e.g. "time", "sequence_number" ect
// returns raw data
function parseJSONData(data)
{
    if (data.length != 1)
        console.warn("Unexpected data format: expected singleton JSON array!");
    data = data[0];

    var objects = [];
    var columns = data.columns;
    for (var row of data.points)
    {
        // convert row to object
        var rawObj = { };
        for (var i in columns)
            rawObj[columns[i]] = row[i];
       
        // parse object
        var parsedObj = { };
        parsedObj.location = { lat: parseFloat(rawObj.lat), lng: parseFloat(rawObj.lon) };
        for (var i of DATA_FEATURES)
            parsedObj[i] = parseFloat(rawObj[i]);
                    
        objects.push(parsedObj);
    }
    return objects;
}


// returns nearest values for a position
function getFeaturesAt(position)
{
    if (objectsarray.length == 0)
        window.alert("no data points in data base");

    var nearestSensor = objectsarray[0];
    var minDist = getDistanceFromLatLon(latLngJ2G(nearestSensor.location), position);
    for (var obj of objectsarray)
    {
        var dist = getDistanceFromLatLon(latLngJ2G(obj.location), position);
        if (dist < minDist)
        {
            minDist = dist;
            nearestSensor = obj;
        }
    }

    return nearestSensor;
}