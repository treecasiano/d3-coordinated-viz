(function(){

//pseudo-global variables
  var textAttributes = ['County', 'State'];
  var numericalAttributes = ['CHILDPOVRATE15',
    'FOODINSEC_13_15',
    'PCT_DIABETES_ADULTS13',
    'PCT_LACCESS_BLACK15',
    'PCT_LACCESS_CHILD15',
    'PCT_LACCESS_HHNV15',
    'PCT_LACCESS_HISP15',
    'PCT_LACCESS_LOWI15',
    'PCT_LACCESS_MULTIR15',
    'PCT_LACCESS_NHASIAN15',
    'PCT_LACCESS_NHNA15',
    'PCT_LACCESS_NHPI15',
    'PCT_LACCESS_POP15',
    'PCT_LACCESS_SENIORS15',
    'PCT_LACCESS_SNAP15',
    'PCT_LACCESS_WHITE15',
    'PCT_OBESE_ADULTS13',
    'POVRATE15',
    'VLFOODSEC_13_15'
  ];

  //initial attribute
  var expressed = numericalAttributes[0];

window.onload = setMap;


//set up choropleth map
function setMap() {

  //map frame dimensions
  var width = 960,
      height = 800;

  //create new svg container for the map
  var map = d3.select("body")
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

  //create state plane projection centered on Oregon
  var projection = d3.geoAlbers()
      .center([-120.55, 43.80])
      .rotate([0, 0, 0])
      .parallels([-43, 43])
      .scale(6000)
      .translate([width / 2, height / 2]);

  var path = d3.geoPath()
      .projection(projection);

  //use queue to parallelize asynchronous data loading
  d3.queue()
      .defer(d3.csv, "data/foodAccessOregonCounties.csv") //load attributes from csv
      .defer(d3.json, "data/oregonCounties.topojson") //load background spatial data
      .await(cb);

  function cb(error, csvData, oregonTopojson) {
      //translate TopoJSON
    var oregonCounties = topojson.feature(oregonTopojson, oregonTopojson.objects.oregonCounties).features;
  //join csv data to GeoJSON enumeration units
    oregonCounties = joinData(oregonCounties, csvData, 'GEO_ID', 'GEO_ID', textAttributes, numericalAttributes);
    //add enumeration units to the map
    setCounties(oregonCounties, 'GEO_ID', map, path);
    console.log(csvData);
    console.log(oregonCounties);
  }
}

  function joinData(geojsonFeatures, csvData, geojsonKeyString, csvKeyString, textAttrsArray, numAttrsArray){
    for (var i = 0; i < csvData.length; i++) {
      var csvEnumerationUnit = csvData[i];
      var csvKey = csvEnumerationUnit[csvKeyString];

      //loop through geojson regions to find correct region
      for (var a = 0; a < geojsonFeatures.length; a++) {

        var geojsonProps = geojsonFeatures[a].properties;
        var geojsonKey = geojsonProps[csvKeyString];

        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey === csvKey) {
          textAttrsArray.forEach(function(attr) {geojsonProps[attr] = csvEnumerationUnit[attr];});
          numAttrsArray.forEach(function(attr) {geojsonProps[attr] = parseFloat(csvEnumerationUnit[attr]);});
        }
      }
    }
    return geojsonFeatures;
  }

  function setCounties(countyUnits, primaryKey, map, path) {
    var counties = map.selectAll(".counties")
        .data(countyUnits)
        .enter()
        .append("path")
        .attr("class", function (d) {
          return "counties " + d.properties[primaryKey];
        })
        .attr("d", path);
  }

})();