//begin script when window loads
window.onload = setMap;

//set up choropleth map
function setMap(){
  //use queue to parallelize asynchronous data loading
  d3.queue()
      .defer(d3.csv, "data/foodAccessOregonCounties.csv") //load attributes from csv
      .defer(d3.json, "data/oregonCounties.topojson") //load background spatial data
      .await(cb);

  function cb(error, csvData, oregonTopojson) {
    //translate TopoJSON
    var oregonCounties = topojson.feature(oregonTopojson, oregonTopojson.objects.oregonCounties);
    console.log(csvData);
    console.log(oregonCounties);
  }
}