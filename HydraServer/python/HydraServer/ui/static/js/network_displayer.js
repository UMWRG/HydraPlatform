var toLocaleFormat = d3.time.format("%Y-%m-%d");

var current_res=null;

var display=true;
var cur_table=null;


var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

    var width  = (900- margin.left - margin.right),
    height = (700-margin.top - margin.bottom);
    colors = d3.scale.category10();

    //`ransform functions, used to convert the Hydra coordinates
    //to coodrinates on the d3 svg
  var yScale = d3.scale.linear()
                           .domain([min_y, max_y ])
                           .range([height,0]);
  var xScale = d3.scale.linear()
                          .domain([min_x, max_x])
                          .range([0,width]);

//Set up the colour scale
var color = d3.scale.category20();

var drag = d3.behavior.drag()
        .origin(function (d) { return d; })
         .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();

    d.fixed |= 2;
}
function dragged(d) {

    var mouse = d3.mouse(svg.node());
    d.x = xScale.invert(mouse[0]);
    d.y = yScale.invert(mouse[1]);
    d.px = d.x;
    d.py = d.y;
    force.resume();
}

function dragended(d)
{
    d.fixed &= ~6;
    update_node(d.id, d.name, d.x, d.y);

 }

 //Set up the force layout
var force = d3.layout.force()

    .size([width + margin.left + margin.right, height+ margin.top + margin.bottom])

    .on("tick", tick);
force.gravity(0);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>name: </strong><span style='color:red'>" + d.name+" </span>" +"<strong>type: </strong><span style='color:red'>" + d.type + "</span>";
  })


var zoomer = d3.behavior.zoom().x(self.xScale).y(self.yScale).scaleExtent([0.1, 8]).on("zoom", zoom);

//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height+ margin.top + margin.bottom)
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
    .attr("clsss", "left")
    .call(zoomer)
    // disable zooming with mouse double clink
    .on("dblclick.zoom", null)
    .call(tip);


//Creates the graph data structure out of the json data
force.nodes(nodes_)
    .links(links_)
    .start();

//Create all the line svgs but without locations yet
var link = svg.selectAll("links_")
    .data(links_)
    .enter().append("line")
    .attr("class", "link")
      .style("marker-end", 'None')
    .style("stroke-width", 1.8)
     .style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .on('mouseover', mouse_in) //Added
    .on('mouseout', link_mouse_out) //Added
    .on("click", links_mouse_click);

//Do the same with the circles for the nodes - no
var node = svg.selectAll("nodes_")
    .data(nodes_)
    .enter().append("circle")
    .attr("class", "node")
    .attr("id", function(d) {return d.id;})
    .attr("r", 9)
    .style("fill", function (d) {
    return color(d.group);
})
    .on('mouseover', mouse_in) //Added
    .on('mouseout', node_mouse_out) //Added
    .on("click", nodes_mouse_click)
        .on("dblclick", nodes_mouse_double_click);

 var text = svg.append("g").selectAll("node")
    .data(nodes_)
    .enter().append("text")
    .text(function(d) { return d.name; })
    .style("visibility", "hidden");

// Per-type markers, as they don't inherit styles.
svg.append("defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "#4679BD")
    .style("opacity", "0.6");

force.on("tick",tick);

function tick() {
  zoom();
  force.stop();
    }

    function zoom (){
    link
   .attr('x1', function (d) { return self.xScale(d.source.x); })
   .attr('y1', function (d) { return self.yScale(d.source.y); })
   .attr('x2', function (d) { return self.xScale(d.target.x); })
   .attr('y2', function (d) { return self.yScale(d.target.y); })

 node.attr("transform", function (d) {
            return "translate(" + self.xScale(d.x) + "," + self.yScale(d.y) + ")";
        });

 text.attr("transform", function (d) {
            return "translate(" + self.xScale(d.x)+14 + "," + self.yScale(d.y) + ")";
        });
    }

function nodes_mouse_double_click(d)
{
  d3.selectAll('.node')  //here's how you get all the nodes
    .each(function(d) {
    d3.select(this).classed("fixed", d.fixed = true);
    d3.select(this).on(".drag", null);
    });
           d3.select(this).call(drag);
}
 function nodes_mouse_click(d) {
   // unenlarge target node

   tip.hide(d);
   svg.selectAll("line").style("stroke-width", 1.8);
   svg.selectAll(".node").attr("r", 9);
   d3.select(this).attr("r", 12);
   document.getElementById('search').value=d.name;
   display_node_attributes(d);
   }
   function display_node_attributes(d)
   {
    $( "#data" ).empty();
     $("#timeseries_g" ).empty();

   current_res=d;
   var table = $('<table></table>').addClass('foo');

  var count=0;


   for (i in nodes_attrs)
   {
     if (d.id==nodes_attrs[i].id)
     {
     if(count==0)
       $( "#data" ).append(  '<h4>Attributes for node: '+d.name+'</h4>');
       createDataTableHeading()
       count+=1;
     createResourceAttributesTable (nodes_attrs[i]);
     }
   }
}
 function links_mouse_click(d) {

   svg.selectAll("line").style("stroke-width", 1.8);
   svg.selectAll(".node").attr("r", 9);
   d3.select(this).style("stroke-width", 3);
  document.getElementById('search').value=d.name;
   tip.hide(d);
   display_link_attributes(d)
   }

function display_link_attributes(d) {
 $( "#data" ).empty();
   $( "#timeseries_g" ).empty();
   var count=0;
   current_res=d;
   for (i in links_attrs)
   {
     if (d.id==links_attrs[i].id)
     {
     if(count==0)
       $( "#data" ).append(  '<h4>Attributes for link: '+d.name+'</h4>');
       count+=1;
     createResourceAttributesTable (links_attrs[i]);
     }
   }
   d3.select(this).style('stroke',  function(d) {get_node_attributes(d.id, d.node_name)});
}

function node_mouse_out(d) {
   if(current_res == null || d!=current_res)
   {
      tip.hide(d);
      d3.select(this).style('stroke', '#999');
   }

    }

function mouse_in(d) {
   // show  resource tip and change border
   if(display)
{
   tip.show(d);
   d3.select(this).style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); });
   }
}

function link_mouse_out(d) {
   // hide resource tip and change border

   if(current_res == null || d!=current_res)
   {
       tip.hide(d);
       d3.select(this).style('stroke', '#999');
   }
}

function hid_res(d)
{
   tip.hide(d);
   d3.select(this).style('stroke', '#999');
}


function get_node_attributes(id, name){
}


function findResource() {
    //find the node or links
    var selectedVal = document.getElementById('search').value;
    var sel=null;
    var node = svg.selectAll(".node");
    if (selectedVal == "none")
    {
        node.style("stroke", "white").style("stroke-width", "1");
    }
    else
    {
        var selected = node.filter(function (d, i){
        if(d.name == selectedVal)
             {

             d3.select(this);
             svg.selectAll("line").style("stroke-width", 1.8);
             svg.selectAll(".node").attr("r", 9);
             d3.select(this).attr("r", 12);
             tip.show;

             display_node_attributes(d);
             sel=d;
             return true;
             }
        else
             return false;
            });
            if(sel==null)
            {
            var link = svg.selectAll(".link");
        if (selectedVal == "none") {
            link.style("stroke", "white").style("stroke-width", "1");
            }
        else {
            var selected = link.filter(function (d, i) {
        if(d.name == selectedVal)
             {
                 d3.select(this);
                 svg.selectAll("line").style("stroke-width", 1.8);
                 svg.selectAll(".node").attr("r", 9);
                 d3.select(this).style("stroke-width", 3);
                 display_link_attributes(d);
                 sel=d;
                 return true;
             }
        else
             return false;
            });
            }
            }

        if(current_res!=null)
            {
             tip.hide(current_res);
            }
    }
}

function drawTimeseriesGraph(script, graph_data, attr_name, t_table) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- This is the key
        success: function () {
            draw_timeseries(graph_data, attr_name);
        },
            error: function ()
            {
                alert("Could not load script " + script);
            }
    });

if(cur_table!=null)
    cur_table.hide();
    cur_table=t_table;
    cur_table.show();
}


function changeNodesLableVisibility(cb) {
    if (cb.checked)
        {
            display=false;
            svg.selectAll("text").style("visibility", "visible");
        }
    else
        {
            display=true;
            svg.selectAll("text").style("visibility", "hidden");
        }
    }

function changeLinkDirectionVisibility(cb) {
    if (cb.checked)
        {
            display=false;
            svg.selectAll("line").style("marker-end",  "url(#suit)");
        }
    else
        {
            display=true;
            svg.selectAll("line").style("marker-end", 'None');
        }
}


function update_node(node_id, name, x, y)
    {
    //to do connect to the server and update node location
    }

   function runModel()
   {
   $(progressbar).show();
   set_progress();
   }

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
    alert("woke up!");
}

var res_hide=function hide_progress()
{
$(progressbar).hide()
}
function set_progress()  {
    var progressbar = $( "#progressbar" ),
      progressLabel = $( ".progress-label" );

    progressbar.progressbar({
      value: false,
      change: function() {
        progressLabel.text( progressbar.progressbar( "value" ) + "%" );
      },
      complete: function() {
        progressLabel.text( "Run successfully, loading the results …!" );
        setTimeout(res_hide    , 1000);
      }
    });

    function progress() {
      var val = progressbar.progressbar( "value" ) || 0;

      progressbar.progressbar( "value", val + 2 );

      if ( val < 99 ) {
        setTimeout( progress, 80 );
      }
    }
    setTimeout( progress, 2000 );
  }