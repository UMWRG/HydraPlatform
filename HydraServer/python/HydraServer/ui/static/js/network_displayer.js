var toLocaleFormat = d3.timeFormat("%Y-%m-%d");


var currentTransform = null;

var current_res=null;

var display=true;
var cur_table=null;

var var_=getUrlVars()
var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

    var width  = (900- margin.left - margin.right),
    height = (700-margin.top - margin.bottom);
    colors = d3.scaleOrdinal(d3.schemeCategory10);

    //`ransform functions, used to convert the Hydra coordinates
    //to coodrinates on the d3 svg
  var yScale = d3.scaleLinear()
                           .domain([min_y, max_y ])
                           .range([height,0]);
  var xScale = d3.scaleLinear()
                          .domain([min_x, max_x])
                          .range([0,width]);

//Set up the colour scale
var color = d3.scaleOrdinal(d3.schemeCategory20);

var drag = d3.drag()
         .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

function dragstarted(d) {

    d3.event.sourceEvent.stopPropagation();

}

function dragged(d) {
    if( d3.select(this).classed('selected') == false){
        return
    }

var mouse = d3.mouse(svg.node());

    if (currentTransform == null){
        d.x = xScale.invert(mouse[0]);
        d.y = yScale.invert(mouse[1]);
        node.attr("transform", function(d){
            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
        });
    }else{
        d.x = xScale.invert(currentTransform.invertX(mouse[0]));
        d.y = yScale.invert(currentTransform.invertY(mouse[1]));
        node.attr("transform", function(d){
            return "translate(" + currentTransform.applyX(xScale(d.x)) + "," + currentTransform.applyY(yScale(d.y)) + ")";
        });
    }
   // tick()
    //force.restart();
}

function dragended(d)
{
    if( d3.select(this).classed('selected') == false){
        return
    }
    update_node(d.id, d.name, d.x, d.y);

 }

 //Set up the force layout
var force = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id }))

    //.size([width + margin.left + margin.right, height+ margin.top + margin.bottom])

    .on("tick", tick);

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>name: </strong><span style='color:red'>" + d.name+" </span>" +"<strong>type: </strong><span style='color:red'>" + d.type.type_name + "</span>";
  })


var normalnode = d3.symbol()
         .size(function(d) { 
             var height = d.type.layout.height
             if (height == undefined){
                 height = 10
             }
             var width = d.type.layout.width
             if (width == undefined){
                 width = 10
             }

             return height * width; } )
         .type(function(d) { 
           if
           (d.type.layout.shape == "circle") { return d3.symbolCircle; } else if
           (d.type.layout.shape == "diamond") { return d3.symbolDiamond;} else if
           (d.type.layout.shape == "cross") { return d3.symbolCross;} else if
           (d.type.layout.shape == "triangle") { return d3.symbolTriangle;} else if
           (d.type.layout.shape == "square") { return d3.symbolSquare;} else if
           (d.type.layout.shape == "star") { return d3.symbolStar;} else if
           (d.type.layout.shape == "wye") { return d3.symbolWye;} else
           { return d3.symbolCircle; }
         })


var selectednode = d3.symbol()
         .size(function(d) { 
             var height = d.type.layout.height
             if (height == undefined){
                 height = 10
             }
             var width = d.type.layout.width
             if (width == undefined){
                 width = 10
             }

             return 1.5 * (height * width); } )
         .type(function(d) { 
           if
           (d.type.layout.shape == "circle") { return d3.symbolCircle; } else if
           (d.type.layout.shape == "diamond") { return d3.symbolDiamond;} else if
           (d.type.layout.shape == "cross") { return d3.symbolCross;} else if
           (d.type.layout.shape == "triangle") { return d3.symbolTriangle;} else if
           (d.type.layout.shape == "square") { return d3.symbolSquare;} else if
           (d.type.layout.shape == "star") { return d3.symbolStar;} else if
           (d.type.layout.shape == "wye") { return d3.symbolWye;} else
           { return d3.symbolCircle; }
         })


var turn_off_zoom = function(){
    svg.on(".zoom", null);
}

var turn_on_zoom = function(){
    svg.call(d3.zoom().scaleExtent([0.1, 8]).on("zoom", zoom))
}

//var zoomer = d3.behavior.zoom().x(self.xScale).y(self.yScale).scaleExtent([0.1, 18]).on("zoom", zoom);
//var zoomer = d3.zoom().scaleExtent([0.1, 8]).on("zoom", zoom);

d3.select('body')
    .on('keydown', function(d){
        if (d3.event.key == 'Shift') {
            turn_on_zoom()
        }
    })
    .on('keyup', function(d){
        if (d3.event.key == 'Shift') {
            turn_off_zoom()
        }
    })

//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height+ margin.top + margin.bottom)
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
    .on("click", function(d){
        svg.selectAll("line").style("stroke-width", 1.8);
        svg.selectAll(".node").each(function(d){tip.hide(d)})
        svg.selectAll("path.selected").attr("d", normalnode)
        svg.selectAll("path.selected").classed("selected", false)
        d3.selectAll('.node').on("mousedown.drag", null);
    })
    .call(tip);


//Creates the graph data structure out of the json data
force.force('link').links(links_)
force.restart();

//Create all the line svgs but without locations yet
var link = svg.selectAll("links_")
    .data(links_)
    .enter().append("line")
    .attr("class", "link")
      .style("marker-end", 'None')
    .style("stroke-width", 1.8)
     .style('stroke',  function(d) { 
          if (d.type.layout.colour != undefined){return d.type.layout.colour}else{return 'black'}
    })
    .on('mouseover', mouse_in) //Added
    .on('mouseout', link_mouse_out) //Added
    .on("click", links_mouse_click);

//Do the same with the circles for the nodes - no
var node = null; 

var redraw_nodes = function(){
    
    nodes_.forEach(function(d) {
        if (d.type.layout == undefined){
            d.type.layout = {}
        }else{
            if (typeof(d.type.layout) == 'string'){
                d.type.layout = JSON.parse(d.type.layout)
            }
        }
    });
   svg.selectAll(".node").remove()

    node = svg.selectAll(".node")
        .data(nodes_)
        .enter().append("g")
        .attr("class", "node")
        .attr("id", function(d) {return d.id;})
        .attr('shape', function(d){
            if (d.type.layout.shape != undefined){
                return d.type.layout.shape
            }else{
                return 'circle'
            }})
        .attr('resourcetype', function(d){return d.type.type_id})
        .attr("transform", function (d) {
            return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
        })
    
        node
        .append('path')
        .style("fill", function(d) {
            var l = d.type.layout;
            if (l.colour != undefined){return l.colour}else{return 'black'}
          })
        .attr("d", normalnode)
        .on('mouseover', mouse_in) //Added
        .on('mouseout', node_mouse_out) //Added
        .on("click", nodes_mouse_click)
            .on("dblclick", nodes_mouse_double_click);

    force.nodes(nodes_).on('tick', tick)
    force.restart();
}

 var text = svg.append("g").selectAll("node")
    .data(nodes_)
    .enter().append("text")
    .text(function(d) { return d.name; })
    .style("visibility", "hidden")
    .style("font", "12px sans-serif");

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

var tick = function() {
  zoom();
  force.stop();
}
var zoom = function(){

    if (d3.event == null){
        if (currentTransform != null){
            var transform = currentTransform;
        }else{
            return;
        }
    }else{
        var transform = d3.event.transform;
        if (transform != undefined){
            console.log("Updating transform: " + transform)
            currentTransform = transform;
        }else{
            var transform = currentTransform;
        }
    }

    if (link != undefined){

        link
        .attr('x1', function (d) { return self.xScale(d.source.x); })
        .attr('y1', function (d) { return self.yScale(d.source.y); })
        .attr('x2', function (d) { return self.xScale(d.target.x); })
        .attr('y2', function (d) { return self.yScale(d.target.y); })
    }
    if (node != undefined){
        node.attr("transform", function(d){
            return "translate(" + transform.applyX(xScale(d.x)) + "," + transform.applyY(yScale(d.y)) + ")";
        });
    }
    
    if (text != undefined){
        text.attr("transform", function (d) {
                return "translate(" + self.xScale(d.x)+14 + "," + self.yScale(d.y) + ")";
            });
    }
}

function nodes_mouse_double_click(d)
{
  d3.select("path.selected").attr("d", normalnode)
  d3.selectAll("path.selected").classed("selected", false)

  d3.selectAll('.node')  //here's how you get all the nodes
    .each(function(d) {
        d3.select(this).on(".drag", null);
    });
    d3.select(this).attr("d", selectednode)
    d3.select(this).classed("selected", true)
    d3.select(this).call(drag);
}

function nodes_mouse_click(d) {
   // unenlarge target node

   tip.hide(d);
   svg.selectAll("line").style("stroke-width", 1.8);
   svg.selectAll(".node").attr("r", 9);
   d3.select(this).attr("r", 12);
   document.getElementById('search').value=d.name;
   //display_node_attributes(d);
   call_server_get_res_attrs('NODE', d);

   d3.event.stopPropagation();
}

function display_node_attributes(d)
   {
    $( "#data" ).empty();
     $("#timeseries_g" ).empty();

   current_res=d;
   var table = $('<table></table>').addClass('foo');

   var_ =getUrlVars();
    var pars=
       {
            network_id: var_["network_id"],
            scenario_id: var_["scenario_id"],
            res_id: d.id,
            resource_type:'NODE'
        };
         $.ajax({
                    type: 'POST',
                    url: '/get_res_attrs',
                    data:  {"para": JSON.stringify(pars)},
                    success: function(data, status, request) {
                        node_attrs=data.node_attrs;
                          var count=0;


   for (i in node_attrs)
   {
     {
     if(count==0)
       $( "#data" ).append(  '<h4>Attributes for node: '+d.name+'</h4>');
       createDataTableHeading()
       count+=1;
     createResourceAttributesTable (node_attrs[i]);
     }
   }

    },
    error: function() {
        alert('Unexpected error');

    }
});


}

function get_network_attributes()
{
    res_type='NETWORK';
$( "#data" ).empty();
         $("#timeseries_g" ).empty();

       var table = $('<table></table>').addClass('foo');
       var_=getUrlVars();
        var pars=
       {
            network_id: var_["network_id"],
            scenario_id: var_["scenario_id"],
            res_id: var_["network_id"],
            resource_type:res_type
        };

       $.ajax({
                    type: 'POST',
                    url: '/get_res_attrs',
                    data:  {"para": JSON.stringify(pars)},
                    success: function(data, status, request) {
                    res_attrs=data.res_attrs;
       var count=0;
       for (i in res_attrs)
       {

         if(count==0)
           $("#data" ).append(  '<h4>Attributes for '+res_type+' '+'</h4>');
           createDataTableHeading();
           count+=1;
         createResourceAttributesTable (res_attrs[i]);

       }
            },
            error: function() {
                alert('Unexpected error');
            }
        });
}

function call_server_get_res_attrs(res_type, d)
{
$( "#data" ).empty();
         $("#timeseries_g" ).empty();

       current_res=d;
       var table = $('<table></table>').addClass('foo');
        var pars=
       {
            network_id: var_["network_id"],
            scenario_id: var_["scenario_id"],
            res_id: d.id,
            resource_type:res_type
        };
         $.ajax({
                    type: 'POST',
                    url: '/get_res_attrs',
                    data:  {"para": JSON.stringify(pars)},
                    success: function(data, status, request) {
                        res_attrs=data.res_attrs;
        var count=0;
       for (i in res_attrs)
       {
         {
         if(count==0)
           $("#data" ).append(  '<h4>Attributes for '+res_type+': '+d.name+'</h4>');
           createDataTableHeading();
           count+=1;
         createResourceAttributesTable (res_attrs[i]);
         }
       }

            },
            error: function() {
                alert('Unexpected error');

            }
        });

}

 function links_mouse_click(d) {

   svg.selectAll("line").style("stroke-width", 1.8);
   svg.selectAll(".node").attr("r", 9);
   d3.select(this).style("stroke-width", 3);
  document.getElementById('search').value=d.name;
   tip.hide(d);
   //display_link_attributes(d)
   call_server_get_res_attrs('LINK', d)

    d3.event.stopPropagation();
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
      d3.select(this).style('stroke', "");
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

             //display_node_attributes(d);
             call_server_get_res_attrs('NODE', d)
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
                 //display_link_attributes(d);
                 call_server_get_res_attrs('LINK', d)
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

function drawArrayGraph(script, graph_data, attr_name, t_table) {
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


function getUrlVars(){
    var vars = {};

    try
    {

        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function(m,key,value) {
          vars[key] = value;
        });
            vars["network_id"]=vars["network_id"].replace("#","");
            vars["scenario_id"]=vars["scenario_id"].replace("#","");
    }
    catch (err)
    {
        vars["network_id"]=0;
        vars["scenario_id"]=0;
    }

    return vars;
  }

var newnodetip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    var date = new Date(); // for now
    var default_name = "Node " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  return "<label>Name: </label><input type=\"text\" name=\"node_name\">" + default_name+" </input>";
  })

 
var add_node = function(name, type_id, x, y){
    var node_id = null;

    var success = function(resp){
        //Add ID of ode
        node_id = resp.node_id;
    }

    var error = function(resp){
        alert(resp)    
    }
    
    var nodedata = {
        name: name,
        network_id: network_id,
        types : [{'id': type_id}],
        x : x,
        y : y
    }
    $.ajax({
       url:  add_node_url,
       type: 'POST',
       data : JSON.stringify(nodedata),
       success: success,
       error: error,
    })

    return node_id;

}

function update_node(node_id, name, x, y)
    {
    //to do connect to the server and update node location

    var success = function(resp){
        console.log("Node"+ node_id +" updated")
    }

    var error = function(resp){
        alert(resp)    
    }
    
    var nodedata = {
        name: name,
        id: node_id,
        x : x,
        y : y
    }

    $.ajax({
       url:  update_node_url,
       type: 'POST',
       data : JSON.stringify(nodedata),
       success: success,
       error: error,
    })

    return node_id;
    }




redraw_nodes()
