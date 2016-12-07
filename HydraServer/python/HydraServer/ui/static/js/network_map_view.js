
var toLocaleFormat = d3.time.format("%Y-%m-%d");

var current_res=null;

var display=true;
var cur_table=null;
var color = d3.scale.category20();

        var map = L.map('view').setView([51.5, 1.1868], 8);
        mapLink =
            '<a href="http://openstreetmap.org">OpenStreetMap</a>';
        L.tileLayer(
            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; ' + mapLink + ' Contributors',
            maxZoom: 18,
            }).addTo(map);


        //set the initial view. This is pretty standard for most of the ancient med. projects
       // map.setView([40.58058, 36.29883], 4);
var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>name: </strong><span style='color:red'>" + d.name+" </span>" +"<strong>type: </strong><span style='color:red'>" + d.type + "</span>";
  })



        var force = d3.layout.force()
            .charge(-120)
            .linkDistance(30);

        /* Initialize the SVG layer */
        map._initPathRoot();

        /* We simply pick up the SVG from the map object */
        var svg = d3.select("#view").select("svg"),
            g = svg.append("g");


for (var i = 0, len = nodes_.length; i < len; i++) {
         d=nodes_[i];
        d.LatLng = new L.LatLng(d.y, d.x);

        d.x_ = map.latLngToLayerPoint(d.LatLng).x;
        d.y_ = map.latLngToLayerPoint(d.LatLng).y;
}

 var link = svg.selectAll(".link")
                .data(links_)
                .enter().append("line")
                .attr("class", "link")
                .style("marker-end", 'None')
                .style("stroke-width", 3.2)
                .on('mouseover', mouse_in) //Added
                .on('mouseout', link_mouse_out) //Added
                 .on("click", links_mouse_click);


 var node = svg.selectAll(".node")
                .data(nodes_)
                .enter().append("circle")
                .style("stroke", "black")
                .style("stroke-width", 2.8)
                .style("opacity", .6)
                .attr("r", 11)
                .style("fill", function (d) {
          return color(d.group);
            })
               .on('mouseover', mouse_in) //Added
               .on('mouseout', node_mouse_out) //Added
                .on("click", nodes_mouse_click)
                .on("dblclick", nodes_mouse_double_click)
                .call(force.drag);


    var text = svg.append("g").selectAll("node")
    .data(nodes_)
    .enter().append("text")
    .text(function(d) { return d.name; });

map.on("viewreset", update);
update();
function update() {
                node.attr("transform",
                    function(d) {
                             d.x_ = map.latLngToLayerPoint(d.LatLng).x;
                            d.y_ = map.latLngToLayerPoint(d.LatLng).y;
                            return "translate(" +
                                map.latLngToLayerPoint(d.LatLng).x + "," +
                                map.latLngToLayerPoint(d.LatLng).y + ")";
                    }
                );

                link.attr("x1", function(d) {
                        return d.source.x_;
                    })
                    .attr("y1", function(d) {
                        return d.source.y_;
                    })
                    .attr("x2", function(d) {
                        return d.target.x_;
                    })
                    .attr("y2", function(d) {
                        return d.target.y_;
                    });

text.attr("transform", function (d) {
            return "translate(" + (d.x_) + "," + (d.y_) + ")";
        });

                force.start();


            }
force
    .links(links_)
    .nodes(nodes_)
    .start();


force.on("tick", update);


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