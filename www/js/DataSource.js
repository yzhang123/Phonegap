
var URL = "data.json"; // TODO: change back to: "http://portal.teco.edu/guerilla/guerillaSensingServer/index.php/tsdb_query_data/";

var features = ['co', 'co2', 'dust', 'height', 'hum', 'no2', 'o3', 'temp', 'uv'];
function featureLabel(feature)
{
    return $("label[for=" + feature + "]").text(); 
}

var objectsarray = [];
var envmaps = {};

// if using this function specify callback function 
// that takes the array of parsed objects as parameter
function updateData(successCallback)
{
    $.ajax({
        dataType: "json",
        url: URL,
        success: function(result) 
        {
            var objects = parseJSONData(result);
            objects = filterData(objects);
            objectsarray = [];
            for (var o of objects) {
                var obj = {};
                obj.location = new google.maps.LatLng(parseFloat(o.lat), parseFloat(o.lon));
                for (var i of features)
                    obj[i] = parseFloat(o[i]);
                objectsarray.push(obj);
            }
            
            for (var feature of features)
            {    
                var temp = [];
                for (var o of objectsarray)
                    temp.push({ location: o.location, weight: o[feature] });
                envmaps[feature] = temp;
            }
            successCallback();
        }
    });
}

// lets through only latest data measured at about the same position
function filterData(data) {
    // sort from new to old
    data = data.sort(function(a, b) { return b.time - a.time; });
    
    // throws away data measurements that are up to 8m away from a more recent measurement
    var keys = [];
    function isUnique(elem)
    {
        var key = parseFloat(elem.lat).toFixed(4) + " " + parseFloat(elem.lon).toFixed(4);
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
    if (data.length > 1)
        console.warn("Unexpected data format: JSON array contains more than one element!");

    var objects = [];
    var columns = data[0].columns;
    for (var p of data[0].points)
    {
        // convert row to object
        var o = { };
        for (var i in columns)
            o[columns[i]] = p[i];
        objects.push(o);
    }
    return objects;
}