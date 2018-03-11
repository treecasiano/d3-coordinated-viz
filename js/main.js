//begin script when window loads
window.onload = setMap;

/*a D3 generator is a function that is returned by a D3 generator method and stored in a local variable.
Any D3 projection method will return a projection generator, which must then be fed into the d3.geo.path() method
to produce another generator—the path generator.
Finally, the path generator is accessed within a selection block to draw the spatial data as path strings
of the d attributes of SVG <path> elements. */

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
    console.log(csvData);
    console.log(oregonCounties);

    // add Oregon counties to map
    var counties = map.selectAll(".counties")
        .data(oregonCounties)
        .enter()
        .append("path")
        .attr("class", function(d){
          return "counties " + d.properties.GEO_ID;
        })
        .attr("d", path);
  }
}