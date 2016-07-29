function draw_timeseries(graph_data, attr_name)

{

   $( "#timeseries_g" ).empty();
 //$( "#timeseries_g" ).append(  '<h4 class="graph_title" >Attribute: '+attr_name+'</h4>');


// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 30, bottom: 40, left: 50},
width = 550 - margin.left - margin.right,
height = 270 - margin.top - margin.bottom;

// Parse the date / time
//var parseDate = d3.time.format("%d-%b-%y").parse;
//var formatTime = d3.time.format("%e %B");

// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Define the axes
var xAxis = d3.svg.axis().scale(x)
    .orient("bottom").ticks(5);

var yAxis = d3.svg.axis().scale(y)
    .orient("left").ticks(5);

function make_x_axis() {
    return d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(5)
}
function make_y_axis() {
    return d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(5)
}

// Define the line
var valueline = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.value); });

// Define the div for the tooltip

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>date: </strong><span style='color:red'>" + toLocaleFormat(d.date)+" </span>" +"<strong>, "+ attr_name +": </strong><span style='color:red'>" + d.value + "</span>";
  //return "<strong>Name:</strong> <span style='color:red'>" + d.name + "</span>";
  })
// Adds the svg canvas
var svg = d3.select("#timeseries_g")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("clsss", "right")
    .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

svg.call(tip);
    // Scale the range of the data
    x.domain(d3.extent( graph_data, function(d) { return d.date; }));
    y.domain([0, d3.max(graph_data, function(d) { return d.value; })]);

    // Add the valueline path.
    svg.append("path")
        .attr("class", "line")
        .attr("d", valueline(graph_data));

    // Add the scatterplot
    svg.selectAll("dot")
        .data(graph_data)
    .enter().append("circle")
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(d.value); })
        .on("mouseover", function(d) {
            tip.show(d);
            })
        .on("mouseout", function(d) {
             tip.hide(d);
        });

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

// Add the text label for the x axis
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Date");

    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

// Add the text label for the Y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .style("color", "red")
        .text(attr_name);

svg.append("g")
    .attr("class", "grid")
    .attr("transform", "translate(0," + height + ")")
    .call(make_x_axis()
    .tickSize(-height, 0, 0)
    .tickFormat("")
)

svg.append("g")
    .attr("class", "grid")
    .call(make_y_axis()
    .tickSize(-width, 0, 0)
    .tickFormat("")
)

/*
// add graph label
svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Attribute: "+attr_name);
*/
 //   $( "#timeseries_g" ).append(  '<h4 style="text-align:center" >Attribute: '+attr_name+' timeseries</h4>');



}