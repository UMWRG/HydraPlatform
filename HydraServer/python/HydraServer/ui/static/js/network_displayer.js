var toLocaleFormat = d3.time.format("%Y-%m-%d");

//var nodes_= [{"name": "Myriel","group": 1, "x": 0, "y": 20}, {"name": "Napoleon","group": 1, "x":20, "y":30}, {"name": "Mlle.Baptistine", "group": 1, "x":40, "y":500 }];

//var links_=[ {"source": 1,"target":0,"value":1},{"source":0,"target":2,"value":1}]

//Constants for the SVG
//var width = 500,
 //   height = 500;
// alert('HEllo')



var current_res=null;

var display=true;
var cur_table=null;
var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

    var width  = (900- margin.left - margin.right),
    height = (700-margin.top - margin.bottom);
    colors = d3.scale.category10();
 //alert('HEllo 2')

    //`ransform functions, used to convert the Hydra coordinates
    //to coodrinates on the d3 svg
  var y = d3.scale.linear()
                           .domain([min_y, max_y ])
                           .range([height,0]);
  var x = d3.scale.linear()
                          .domain([min_x, max_x])
                          .range([0,width]);

//Set up the colour scale
var color = d3.scale.category20();

 //Set up the force layout
var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width + margin.left + margin.right, height+ margin.top + margin.bottom])
    .on("tick", tick)
     .start();

var drag = force.drag()
    .on("dragstart", dragstart);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>name: </strong><span style='color:red'>" + d.name+" </span>" +"<strong>type: </strong><span style='color:red'>" + d.type + "</span>";
  //return "<strong>Name:</strong> <span style='color:red'>" + d.name + "</span>";
  })



//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height+ margin.top + margin.bottom)
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
    .attr("clsss", "left");

svg.call(tip);


//Read the data from the mis element
//var mis = document.getElementById('mis').innerHTML;
//graph = JSON.parse(nodes);
//alert  ('hii  there 4');

//Creates the graph data structure out of the json data
force.nodes(nodes_)
    .links(links_)
    .start();

//Create all the line svgs but without locations yet
var link = svg.selectAll("links_")
    .data(links_)
    .enter().append("line")
    .attr("class", "link")
     //.style("stroke-dasharray", ("3, 3"))
     .style("marker-end", 'None')
    .style("stroke-width", 1.8)
     .style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .attr('x1', function (d) { return self.x(d.source.x); })
    .attr('y1', function (d) { return self.y(d.source.y); })
    .attr('x2', function (d) { return self.x(d.target.x); })
    .attr('y2', function (d) { return self.y(d.target.y); })
    .on('mouseover', mouse_in) //Added
    .on('mouseout', link_mouse_out) //Added
    .on("click", links_mouse_click);

//Do the same with the circles for the nodes - no
var node = svg.selectAll("nodes_")
    .data(nodes_)
    .enter().append("circle")
    .attr("class", "node")
    .attr("id", function(d) {return d.id;})
    .attr('cx', function(d){return self.x((d.x));})
    .attr('cy', function(d){return self.y((d.y));})
    .attr("r", 9)
    .style("fill", function (d) {
    return color(d.group);
})
   //.call(force.drag)
    .on('mouseover', mouse_in) //Added
    .on('mouseout', node_mouse_out) //Added
    .on("click", nodes_mouse_click)
        .on("dblclick", nodes_mouse_double_click);


 var text = svg.append("g").selectAll("node")
    .data(nodes_)
    .enter().append("text")
     .attr("x",function(d){return self.x((d.x))+8;})
    .attr("y", function(d){return self.y((d.y))+8;})
    .text(function(d) { return d.name; })
    .style("visibility", "hidden");



//giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
//force.on("tick", function () {
// node.attr('cx', function (d) { return self.x(d.x); });
//  link.attr('x1', function (d) { return self.x(d.source.x); })
 //   .attr('x2', function (d) { return self.x(d.target.x); });
//});

/*
    link.attr("x1", function (d) {
        return d.source.x;
    })
        .attr("y1", function (d) {
        return d.source.y;
    })
        .attr("x2", function (d) {
        return d.target.x;
    })
        .attr("y2", function (d) {
        return d.target.y;
    });

    node.attr("cx", function (d) {
        return d.x;
    })
        .attr("cy", function (d) {
        return d.y;
    });
});
*/
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


function tick() {
  path.attr("d", linkArc);
  circle.attr("transform", transform);
  text.attr("transform", transform);
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
function dragstart (d)
{
}
 function nodes_mouse_click(d) {

   // unenlarge target node
   //
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
     create_table(nodes_attrs[i]);
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
     }
   }
}
 function links_mouse_click(d) {
   // unenlarge target node
   //

   // unenlarge target node
   //


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
     create_table(links_attrs[i]);
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
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
   //svg.selectAll("text").remove()
   //svg.selectAll("text").style("visibility", "hidden");
}

function link_mouse_out(d) {
   // hide resource tip and change border
   //d3.select(this).style('stroke',  function(d) { return d3.rgb(colors(d.id)).lighter().toString(); });

   if(current_res == null || d!=current_res)
   {
       tip.hide(d);
       d3.select(this).style('stroke', '#999');
   }
   //svg.selectAll("text").style("visibility", "visible");
}

function hid_res(d)
{
   tip.hide(d);
   d3.select(this).style('stroke', '#999');
}


function get_node_attributes(id, name){
}

function create_table(res) {
        t_table=null;
        var table = $('<table></table>').addClass('table');
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
        var name_row = $("<tr/>");
        var name_ = $('<th></th>').text('Attribute name ' );
        name_row.append(name_);

        var res_name = $('<th></th>').text(res.attrr_name);
        name_row.append(res_name);
        table.append(name_row);

        var type_row = $("<tr/>");
        var type_ = $('<th></th>').text('Type ' );
        type_row.append(type_);

        var res_type = document.createElement("th");

         if(res.type == 'timeseries')
               res_type.innerHTML ='<a href="#">'+res.type+'</a>';
        else
               res_type.innerHTML =res.type;

         type_row.append(res_type);
        table.append(type_row);
        var graph_data={};

        if(res.type == 'timeseries')
        {
        //alert('Time series found')
        graph_data=[];
          var date_row = $("<tr/>");
           var date_ = $('<th ></th>').text('Date ' );
           var value_ = $('<th></th>').text('Value ' );

           date_row.append(date_);
           date_row.append(value_);

         var t_table = $('<table></table>').addClass('table');
         t_table.append(date_row);

         for (j in res.values)
        {
           //alert(res.values[j].date);
            var value_row = $("<tr/>");

           var date=new Date(res.values[j].date);
           var formateddate=toLocaleFormat(date);

           var thread=$ ('<tr></tr>');
           var res_date = $('<th></th>').text(formateddate);
           var res_value = $('<th></th>').text(res.values[j].value);

           graph_data.push(
        {
          'date': date,
          'value':res.values[j].value,
        }
        )
           value_row.append(res_date);
           value_row.append(res_value);

           //value_row.append(res_value);
           t_table.append(value_row);

        }
        res_type.innerHTML ='<a href="#">'+res.type+'</a>';
        res_type.onclick =(function(){
        draw_graph('../static/js/_timeseries_graph.js', graph_data, res.attrr_name, t_table);
    });

        }
        else
        {
        var v_row = $("<tr/>");
        var v_title_ = $('<th></th>').text('Value ' );
        v_row.append(v_title_);

        var vv_ = $('<th></th>').text(res.values);
        v_row.append(vv_);
        table.append(v_row);
        }
    $('#data').append(table);
     if(t_table!=null)
     {
          $('#data').append(t_table);
          t_table.hide();
          }
   }

function searchNode() {
// to be deleted  later
//alert("HI ....")
$.getJSON('/_add_numbers',{ "a": 15, "b": 30 }, function(data) {
				   //alert("HI ....22: "+data.result)
				});
// end of to be deleted
    //find the node or links
    var selectedVal = document.getElementById('search').value;
    var sel=null;
    var node = svg.selectAll(".node");
    if (selectedVal == "none") {
        node.style("stroke", "white").style("stroke-width", "1");
    } else {
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
    } else {
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

         //var link = svg.selectAll(".link")
        //link.style("opacity", "0");
        //d3.selectAll(".node, .link").transition()
        //  .duration(5000)
        //.style("opacity", 1);
        //alert(d.name);
    }
}

function draw_graph(script, graph_data, attr_name, t_table) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- This is the key
        success: function () {
            draw_timeseries(graph_data, attr_name);
        },
        error: function () {
            alert("Could not load script " + script);
        }
    });

if(cur_table!=null)
    cur_table.hide();
    cur_table=t_table;
    cur_table.show();


}



function changeNodesLable(cb) {
 if (cb.checked) {
 display=false;
               svg.selectAll("text").style("visibility", "visible");

        }
        else
        {
        display=true;
                svg.selectAll("text").style("visibility", "hidden");
        }
}

function changeLinkDirection(cb) {
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
function simulateClick(elem /* Must be the element, not d3 selection */) {
    var evt = document.createEvent("MouseEvents");

    evt.initMouseEvent(
        "click", /* type */
        true, /* canBubble */
        true, /* cancelable */
        window, /* view */
        0, /* detail */
        0, /* screenX */
        0, /* screenY */
        0, /* clientX */
        0, /* clientY */
        false, /* ctrlKey */
        false, /* altKey */
        false, /* shiftKey */
        false, /* metaKey */
        0, /* button */
        null); /* relatedTarget */

    elem.dispatchEvent(evt);

}