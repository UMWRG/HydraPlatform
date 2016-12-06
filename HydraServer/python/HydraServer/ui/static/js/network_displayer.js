var toLocaleFormat = d3.timeFormat("%Y-%m-%d");


var currentTransform = null;

var current_res=null;

var display=true;
var cur_table=null;

var drag_line = null;


var var_=getUrlVars()
var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

    var width  = (900- margin.left - margin.right),
    height = (700-margin.top - margin.bottom);
    colors = d3.scaleOrdinal(d3.schemeCategory10);

if (min_x == max_x){
    max_x = max_x * 100;
}
if (min_y == max_y){
    max_y = max_y * 100;
}
    //`ransform functions, used to convert the Hydra coordinates
    //to coodrinates on the d3 svg
  var yScale = d3.scaleLinear()
                           .domain([min_y, max_y ])
                           .range([height,0]);
  var xScale = d3.scaleLinear()
                          .domain([min_x, max_x])
                          .range([0,width]);

//Set up the color scale
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
    tick()
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
            .force("link", d3.forceLink().id(function(d) { return d.index }))

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


//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("#graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height+ margin.top + margin.bottom)
    .attr("transform","translate(" + margin.left + "," + margin.top + ")")
    .on("click", function(d){
        svg.selectAll(".node").each(function(d){tip.hide(d)})
        svg.selectAll(".node path").style('stroke', "");
        svg.selectAll(".node path").style('stroke-width',  "");
        svg.selectAll("path.selected").attr("d", normalnode)
        svg.selectAll("path.selected").classed("selected", false)
        d3.selectAll('.node').on("mousedown.drag", null);
        
        if (drag_line != null){
            drag_line.remove()
            drag_line = null
            start_node = null;
        }
    })
    .on("mousemove", function(){
    if (drag_line != null){
        if (currentTransform){
            drag_line.attr('d', 'M' + currentTransform.applyX(xScale(start_node.datum().x)) + ',' + currentTransform.applyY(yScale(start_node.datum().y)) + 'L' + d3.mouse(svg.node())[0] + ',' + d3.mouse(svg.node())[1]);
        }else{
            drag_line.attr('d', 'M' + xScale(start_node.datum().x) + ',' + yScale(start_node.datum().y) + 'L' + d3.mouse(svg.node())[0] + ',' + d3.mouse(svg.node())[1]);
        }
    }
    })
    .call(tip)


//Creates the graph data structure out of the json data
force.restart();

var tick = function() {
    if ((d3.event == null || d3.event.transform == undefined) && currentTransform == null){

        if (link != undefined){

            link
            .attr('x1', function (d) { return xScale(d.source.x); })
            .attr('y1', function (d) { return yScale(d.source.y); })
            .attr('x2', function (d) { return xScale(d.target.x); })
            .attr('y2', function (d) { return yScale(d.target.y); })
        }

        if (node != undefined){
            node.attr("transform", function(d){
                return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
            });
        }

        if (text != undefined){
            text.attr("transform", function (d) {
                    return "translate(" + xScale(d.x)+14 + "," + yScale(d.y) + ")";
                });
        }
    }else{
        zoom();
    }
    force.stop()
}

//Do the same with the circles for the nodes - no
var node = null; 
var link = null; 
var text = null;
var start_node = null;

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
    
        node
        .append('path')
        .style("fill", function(d) {
            var l = d.type.layout;
            if (l.color != undefined){return l.color}else{return 'black'}
          })

        .attr("d", normalnode)
        .on('mouseover', mouse_in) //Added
        .on('mouseout', node_mouse_out) //Added
        .on("click", nodes_mouse_click)
        .on("dblclick", nodes_mouse_double_click);

    text = svg.append("g").selectAll(".node")
        .data(nodes_)
        .enter().append("text")
        .text(function(d) { return d.name; })
        .style("visibility", "hidden")
        .style("font", "12px sans-serif");

    tick()
}

var redraw_links = function(){

    links_.forEach(function(d) {
        if (d.type.layout == undefined){
            d.type.layout = {}
        }else{
            if (typeof(d.type.layout) == 'string'){
                d.type.layout = JSON.parse(d.type.layout)
            }
        }
    });

   svg.selectAll(".link").remove()
    //Create all the line svgs but without locations yet
    link = svg.selectAll(".link")
        .data(links_)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-dasharray", function(d){
            if (d.type.layout['linestyle'] != undefined){
                var style = d.type.layout['linestyle']
                if (style == 'dashed'){
                        return (4, 4)
                }else if (style == 'dotted'){
                        return (2, 2)
                }else{
                        return ""
                }
                }else{
                    return ''
                }
        })
         .style('stroke-width',  function(d) { 
              if (d.type.layout['width'] != undefined){return d.type.layout['width']+'px'}else{return '2px'}
        })
         .style('stroke',  function(d) { 
              if (d.type.layout['color'] != undefined){return d.type.layout['color']}else{return 'black'}
        })
        .on('mouseover', mouse_in) //Added
        .on('mouseout', link_mouse_out) //Added
        .on("click", links_mouse_click);
   tick() 
}


redraw_links()
redraw_nodes()

force.nodes(nodes_).on('tick', tick)
force.force('link').links(links_)
tick()

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
            currentTransform = transform;
        }else{
            var transform = currentTransform;
        }
    }

    if (link != undefined){

        link
        .attr('x1', function (d) { return transform.applyX(xScale(d.source.x)); })
        .attr('y1', function (d) { return transform.applyY(yScale(d.source.y)); })
        .attr('x2', function (d) { return transform.applyX(xScale(d.target.x)); })
        .attr('y2', function (d) { return transform.applyY(yScale(d.target.y)); })
    }

    if (node != undefined){
        node.attr("transform", function(d){
            return "translate(" + transform.applyX(xScale(d.x)) + "," + transform.applyY(yScale(d.y)) + ")";
        });
    }
    
    if (text != undefined){
        text.attr("transform", function (d) {
                return "translate(" + transform.applyX(self.xScale(d.x))+14 + "," + transform.applyY(self.yScale(d.y)) + ")";
            });
    }
}

svg.call(d3.zoom()
        .scaleExtent([0.1,8])
        .on("zoom", zoom));

//resize();
//window.focus();
//d3.select(window).on("resize", resize);

function resize() {
    alert('resizing')
                var w = window.innerWidth,
                h = window.innerHeight;
                svg.attr("width", width).attr("height", height);
                
                force.size([force.size()[0] + (width - w) / zoom.scale(), force.size()[1] + (height - h) / zoom.scale()]).resume();
                width = w;
                height = h;
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

   d3.event.stopPropagation();
}

function nodes_mouse_click(d) {
   // unenlarge target node

   tip.hide(d);
   document.getElementById('search').value=d.name;

   get_resource_data('NODE', d);
   
   var selectedlinktype = d3.select('.linkbutton.active div')

   if (!selectedlinktype.empty()){
       if (drag_line == null){
            drag_line = svg.append('path')
                .attr('class', 'link dragline')
                //.style('marker-end', 'url(#end-arrow)')
            start_node = d3.select(this);
        }else{

           var type_id = d3.select('.linkbutton.active div').property('title')

           target_datum = d3.select(this).datum()

           source_datum = start_node.datum()

           if (source_datum.id == target_datum.id){
                drag_line = null
                start_node = null
                return
           }

            for (var i=0; i<template.templatetypes.length; i++){
                if (parseInt(type_id) == template.templatetypes[i]['type_id']){
                    var t = template.templatetypes[i]
                }
            }

           var linkname =  source_datum.name + " to " + target_datum.name

            link_id = add_link(linkname, type_id, source_datum, target_datum)

            if (link_id != null){

                links_.push({
                    id          : link_id,
                    name        : linkname,
                    type        : t,
                    source      : source_datum,
                    target      : target_datum,
                    description : "",
                    res_type    : 'link',
                    value       : 1, 
                })
                start_node = null;
                drag_line = null;
            }

            redraw_links()

            
        }
   }

   d3.event.stopPropagation();


}

function get_network_attributes()
{
    res_type='NETWORK';
    $( "#data" ).empty();
    $("#timeseries_g" ).empty();

    var table = $('<table></table>').addClass('foo');

    var error = function(resp) {
        alert('Unexpected error');
    }


    var success =function(data, status, request) {
       res_attrs=data.resource_scenarios;
       var count=0;
       for (i in res_attrs)
       {

         if(count==0)
           $("#data" ).append(  '<h4>Attributes for '+res_type+' '+'</h4>');
           createDataTableHeading();
           count+=1;
         createResourceAttributesTable (res_attrs[i]);

       }
     }

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
        url: get_resource_data_url,
        data:  JSON.stringify(pars),
        success: success,
        error: error
   });
}

 function links_mouse_click(d) {

   d3.select(this).style("stroke-width", 3);
   document.getElementById('search').value=d.name;
   tip.hide(d);
   get_resource_data('LINK', d)

    d3.event.stopPropagation();
   }

function node_mouse_out(d) {
   if(current_res == null || d!=current_res)
   {
      tip.hide(d);
      d3.select(this).style('stroke', "");
      d3.select(this).style('stroke-width',  "");
   }

    }

function mouse_in(d) {
   // show  resource tip and change border
   if(display)
{
   tip.show(d);
   d3.select(this).style('stroke',  function(d) { return 'red' });
   d3.select(this).style('stroke-width',  function(d) { return '4px' });
   }
}

function link_mouse_out(d) {
   // hide resource tip and change border

   if(current_res == null || d!=current_res)
   {
       tip.hide(d);
        d3.select(this).style('stroke-width',  function(d) { 
            if (d.type.layout['width'] != undefined){return d.type.layout['width']+'px'}else{return '2px'}
        })
        d3.select(this).style('stroke',  function(d) { 
            if (d.type.layout['color'] != undefined){return d.type.layout['color']}else{return 'black'}
        })
   }
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

             get_resesource_data('NODE', d)
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
                 get_resource_data('LINK', d)
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
        console.log('Node added')
        node_id = JSON.parse(resp).node_id;
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
       async: false
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

var add_link = function(name, type_id, source, target){
    var link_id = null;

    var success = function(resp){
        //Add ID of ode
        link_id = JSON.parse(resp).link_id;
    }

    var error = function(resp){
        alert(resp)    
    }
    
    var linkdata = {
        name: name,
        network_id: network_id,
        types : [{'id': type_id}],
        node_1_id : source.id,
        node_2_id : target.id
    }
    $.ajax({
       url:  add_link_url,
       type: 'POST',
       data : JSON.stringify(linkdata),
       success: success,
       error: error,
       async: false
    })

    return link_id;

}



