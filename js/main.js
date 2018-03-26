(function () {

  var textAttributes = ['County', 'State'];
  var numericalAttributeObject = [

    {
      attrName: 'PCT_LACCESS_POP15',
      attrDisplayText: 'Population, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_LOWI15',
      attrDisplayText: 'Low income & low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_HHNV15',
      attrDisplayText: 'Households, no car & low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_SNAP15',
      attrDisplayText: 'SNAP households, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_CHILD15',
      attrDisplayText: 'Children, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_SENIORS15',
      attrDisplayText: 'Seniors, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_BLACK15',
      attrDisplayText: 'Black, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_WHITE15',
      attrDisplayText: 'White, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_HISP15',
      attrDisplayText: 'Hispanic, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_MULTIR15',
      attrDisplayText: 'Multiracial, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_NHASIAN15',
      attrDisplayText: 'Asian, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_NHNA15',
      attrDisplayText: 'American Indian or Alaska Native, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_NHPI15',
      attrDisplayText: 'Hawaiian or Pacific Islander, low access to store (%), 2015'
    },
    {
      attrName: 'PCT_LACCESS_SNAP15',
      attrDisplayText: 'SNAP households, low access to store (%), 2015'
    },
    {
      attrName: 'POVRATE15',
      attrDisplayText: 'Poverty Rate, 2015'
    },
    {
      attrName: 'PCT_OBESE_ADULTS13',
      attrDisplayText: 'Adult Obesity Rate, 2013'
    },
    {
      attrName: 'PCT_DIABETES_ADULTS13',
      attrDisplayText: 'Adult Diabetes Rate, 2013'
    }
  ];

  //initial attribute
  var expressed = numericalAttributeObject[16].attrName;
  var expressedDisplayText = numericalAttributeObject[16].attrDisplayText;

  var colorClasses = [
      '#d5f9ed',
    '#94c2ba',
    '#5a95a0',
    '#326770',
    '#21444b'];

  //chart frame dimensions
  var chartWidth = window.innerWidth * 0.425,
      chartHeight = 473,
      leftPadding = 25,
      rightPadding = 2,
      topBottomPadding = 5,
      chartInnerWidth = chartWidth - leftPadding - rightPadding,
      chartInnerHeight = chartHeight - topBottomPadding * 2,
      translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

  //create a scale to size bars proportionally to frame and for axis
  var yScale = d3.scaleLinear()
      .range([463, 0])
      .domain([0, 100]);

  window.onload = setMap;

//set up choropleth map
  function setMap() {

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 500;

    //create new svg container for the map
    var map = d3.select(".mainContainer")
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

      // /join csv data to GeoJSON enumeration units
      oregonCounties = joinData(oregonCounties, csvData, 'GEO_ID', 'GEO_ID', textAttributes, numericalAttributeObject);

      //create the color scale
      // var colorScale = makeQuintileColorScale(csvData, colorClasses);
      // var colorScale = makeEqualIntervalColorScale(csvData, colorClasses);
      var colorScale = makeNaturalBreaksColorScale(csvData, colorClasses);

      //add enumeration units to the map
      setCountyEnumerationUnits(oregonCounties, 'GEO_ID', map, path, colorScale);
      //add coordinated visualization to the map
      setChart(csvData, 'GEO_ID', colorScale);
      createDropdown(csvData);
    }
  }

  function joinData(geojsonFeatures, csvData, geojsonKeyString, csvKeyString, textAttrs, numAttrs) {
    for (var i = 0; i < csvData.length; i++) {
      var csvEnumerationUnit = csvData[i];
      var csvKey = csvEnumerationUnit[csvKeyString];

      //loop through geojson regions to find correct region
      for (var a = 0; a < geojsonFeatures.length; a++) {

        var geojsonProps = geojsonFeatures[a].properties;
        var geojsonKey = geojsonProps[csvKeyString];

        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey === csvKey) {
          textAttrs.forEach(function (attr) {
            geojsonProps[attr] = csvEnumerationUnit[attr];
          });
          numAttrs.forEach(function (attr) {
            geojsonProps[attr.attrName] = parseFloat(csvEnumerationUnit[attr.attrName]);
          });
        }
      }
    }
    return geojsonFeatures;
  }

  function setCountyEnumerationUnits(countyUnits, primaryKey, map, path, colorScale) {
    var counties = map.selectAll(".counties")
        .data(countyUnits)
        .enter()
        .append("path")
        .attr("class", function (d) {
          return "counties " + 'id'+ d.properties[primaryKey];
        })
        .attr("d", path)
        .style("fill", function(d) {
          return choropleth(d.properties, colorScale);
        }).on("mouseover", function(d) {
          highlight(d.properties, primaryKey);
        })
        .on("mouseout", function(d){
          dehighlight(d.properties, primaryKey);
        });

    var desc = counties.append("desc")
        .text('{"stroke": "#fff", "stroke-width": "0.5px"}');
  }

//functions to create color scale generator
  function makeQuintileColorScale(data, colorClasses) {
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i = 0; i < data.length; i++) {
      var val = parseFloat(data[i][expressed]);
      domainArray.push(val);
    }

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
  }

  function makeEqualIntervalColorScale(data, colorClasses) {
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
      d3.min(data, function (d) {
        return parseFloat(d[expressed]);
      }),
      d3.max(data, function (d) {
        return parseFloat(d[expressed]);
      })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);

    return colorScale;
  }

  function makeNaturalBreaksColorScale(data, colorClasses) {

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i = 0; i < data.length; i++) {
      var val = parseFloat(data[i][expressed]);
      domainArray.push(val);
    }

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);

    //reset domain array to cluster minimums
    domainArray = clusters.map(function (d) {
      return d3.min(d);
    });

    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
    return colorScale;
  }

  //test for data value and return color
  function choropleth(props, colorScale) {
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val === 'number' && !isNaN(val)) {
      return colorScale(val);
    } else {
      return "#CCC";
    }
  }

  //create coordinated bar chart
  function setChart(csvData, primaryKey, colorScale) {
    //create a second svg element to hold the bar chart
    var chart = d3.select(".mainContainer")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
          return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
          return "bar " + 'id' + d[primaryKey];
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", function(d) {
            highlight(d, primaryKey);
        })
        .on("mouseout", function(d){
          dehighlight(d, primaryKey);
        });

    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

      updateChart(bars, csvData.length, colorScale);

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("" + expressedDisplayText);

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
  }

  function createDropdown(csvData) {
    //add select element
    var dropdown = d3.select(".selectBox__container")
        .append("select")
        .attr("class", "dropdown")
        .on('change', function() {
          changeAttribute(this.value, csvData);
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(numericalAttributeObject)
        .enter()
        .append("option")
        .attr("value", function(d){ return d.attrName })
        .text(function(d){ return d.attrDisplayText });
  }

  function changeAttribute(attribute, csvData) {
    //change the expressed attribute
    expressed = attribute;
    var expressedObj = numericalAttributeObject.find(function(obj) {
      return obj.attrName === attribute;
    });
    expressedDisplayText = expressedObj.attrDisplayText;
    //recreate the color scale
    var colorScale = makeNaturalBreaksColorScale(csvData, colorClasses);

    //recolor enumeration units
    var counties = d3.selectAll(".counties")
        .transition()
        .duration(1000)
        .style("fill", function(d) {
          return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
    //re-sort bars
        .sort(function(a, b) {
          return b[expressed] - a[expressed];
        })
        .transition()
        .delay(function(d, i){
          return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);
  }

  function updateChart(bars, n, colorScale) {
    //position bars
    bars.attr("x", function(d, i){
      return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
        .attr("height", function(d, i){
          return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
          return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
          return choropleth(d, colorScale);
        });

    var chartTitle = d3.select(".chartTitle")
        .text(expressedDisplayText);
  }

  //function to highlight enumeration units and bars
  function highlight(props, attr) {
    //change stroke
    var selected = d3.selectAll(".id" + props[attr])
        .style("stroke", "yellowgreen")
        .style("stroke-width", 5);
  }

  function dehighlight(props, primaryKey) {
    var selected = d3.selectAll(".id" + props[primaryKey])
        .style("stroke", function(){
          return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
          return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName) {
      var styleText = d3.select(element)
          .select("desc")
          .text();

      var styleObject = JSON.parse(styleText);

      return styleObject[styleName];
    }
  }



})();


