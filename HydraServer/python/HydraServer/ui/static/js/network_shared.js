var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

var toLocaleFormat = d3.timeFormat("%Y-%m-%d");

var currentTransform = null;

var current_res=null;

var display=true;
var cur_table=null;

var drag_line = null;

//Set up the color scale
var color = d3.scaleOrdinal(d3.schemeCategory20);

var menu = [
    {
        title: 'Delete',
        action: function(elm, d, i) {
            delete_resource(d);
        },
        disabled: false // optional, defaults to false
    },
]

function dragstarted(d) {

    d3.event.sourceEvent.stopPropagation();

}

/*Look in the apropriate map / graph file for this*/
//function dragged(d) {
//   
//}

function dragended(d)
{
    if( d3.select(this).classed('selected') == false){
        return
    }
    update_node(d.id, d.name, d.x, d.y);
 }

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



var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>name: </strong><span style='color:red'>" + d.name+" </span>" +"<strong>type: </strong><span style='color:red'>" + d.type.type_name + "</span>";
  })


function nodes_mouse_double_click(d)
{

  d3.event.stopPropagation();

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
    console.log(d)
    $("#data").html("No Resource Selected.")
    current_res = null; 
    current_res_type = null;
    unHighlightAllNodes()
    unHighlightAllLinks()
    highlightNode(this);

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

if (d3.event != null){
    d3.event.stopPropagation();
}


}


function links_mouse_click(d) {
   unHighlightAllLinks()
   highlightLink(this)
   document.getElementById('search').value=d.name;
   tip.hide(d);
   get_resource_data('LINK', d)
   if (d3.event != null){
        d3.event.stopPropagation();
    }
}

function highlightNode(node){
   d3.select(node).style('stroke',  function(d) { return 'red' });
   d3.select(node).style('stroke-width',  function(d) { return '4px' });
}

function unHighlightNode(node){
   d3.select(node).style('stroke',  function(d) { return '' });
   d3.select(node).style('stroke-width',  function(d) { return '' });
}
function unHighlightAllNodes(){
   d3.selectAll(".node path").style('stroke',  function(d) { return '' });
   d3.selectAll(".node path").style('stroke-width',  function(d) { return '' });
}

function highlightLink(link){
    d3.select(link).style('stroke-width',  function(d) {return '4px'}) 
   d3.select(link).style('stroke',  function(d) { return 'red' });
}

function unHighlightLink(link){
    d3.select(link).style('stroke-width',  function(d) { 
        if (d.type.layout['width'] != undefined){return d.type.layout['width']+'px'}else{return '2px'}
    })
    d3.select(link).style('stroke',  function(d) { 
        if (d.type.layout['color'] != undefined){return d.type.layout['color']}else{return 'black'}
    })
}
function unHighlightAllLinks(){
    d3.selectAll('.link').style('stroke-width',  function(d) { 
        if (d == undefined){return "2px"}; //when adding a new link with no data yet
        if (d.type.layout['width'] != undefined){return d.type.layout['width']+'px'}else{return '2px'}
    })
    d3.selectAll('.link').style('stroke',  function(d) { 
        if (d == undefined){return "black"}; // when addnig a new link with no data yet
        if (d.type.layout['color'] != undefined){return d.type.layout['color']}else{return 'black'}
    })
}
function node_mouse_in(d) {
   // show  resource tip and change border
   if(display)
    {
        tip.show(d);
        highlightNode(this);
   }
}

function node_mouse_out(d) {
    if(current_res == null || d!=current_res)
    {
        tip.hide(d);
        unHighlightNode(this)
    }
}
function link_mouse_in(d) {
   // show  resource tip and change border
    if(display)
    {
        tip.show(d);
        highlightLink(this);
    }
}

function link_mouse_out(d) {
   // hide resource tip and change border

   if(current_res == null || d!=current_res)
   {
       tip.hide(d);
       unHighlightLink(this)
   }
}

function findResource(event, ui) {

    $( ".selector" ).autocomplete( "close" );

    var selectedVal = ui.item.value
    //find the node or links
    var node = svg.selectAll(".node");
    var selected = node.filter(function (d, i){
        if(d.name == selectedVal){
            d3.selectAll('#schematicnode_'+d.id).each(nodes_mouse_click)
        }
    })

    var link = svg.selectAll(".link");
    var selected = link.filter(function (d, i){
        if(d.name == selectedVal){
            d3.selectAll('#schematiclink_'+d.id).each(links_mouse_click)
            }
    })
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

var remove_svg_link = function(d){
    var index = links_.indexOf(d);
    links_.splice(index, 1)
}
var remove_svg_node = function(d){
    var index = nodes_.indexOf(d);
    nodes_.splice(index, 1)

    for (var i=0; i<links_.length; i++){
        var l = links_[i];
        if (l.source == d || l.target == d){
            remove_svg_link(l);
        } 
    }
}

function delete_resource(d)
    {
    //to do connect to the server and update node location
    resource_id = d.id
    resource_type = d.res_type
    var success = function(resp){
        console.log(resource_type + resource_id +" deleted.")
        remove_svg_node(d)//Also removes connected Links
        
        redraw_nodes()
        redraw_links()
    }

    var error = function(resp){
        d3.select("#log").append("An error occurred deleting the node")
    }
    
    var nodedata = {
        id: d.id,
        resource_type : d.res_type,
    }

    $.ajax({
       url:  delete_resource_url,
       type: 'POST',
       data : JSON.stringify(nodedata),
       success: success,
       error: error,
    })

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
