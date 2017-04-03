
var dest = new proj4.Proj('EPSG:4326');
var source = new proj4.Proj(projection_crs);

var converted_center = proj4(source,dest,centre)

var mapzoom = Cookies.get('zoom')
if (mapzoom == undefined){
    mapzoom = 4
}

var center = Cookies.getJSON('center')
if (center == undefined){
    center = converted_center
}


var map = L.map('graph').setView([center[1], center[0]], mapzoom);
    mapLink = 
        '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 15,
        }).addTo(map);

map.on('zoomend', function() {
    Cookies.set('zoom', map.getZoom(), {path:window.location.pathname})
    var center = [map.getCenter().lng, map.getCenter().lat]
    Cookies.set('center', center, {path:window.location.pathname})
});

map.on('dragend', function() {
    var center = [map.getCenter().lng, map.getCenter().lat]
    Cookies.set('center', center, {path:window.location.pathname})
});
           
/* Initialize the SVG layer */
map._initPathRoot()    

//Need to update the tip from the default, probably due to the coordinate mappings
//for leaflet
tip.offset([-200, -200])

/* We simply pick up the SVG from the map object */
var svg = d3.select("#graph").select("svg")
            .on("click", function(d){
                svg.selectAll(".node").each(function(d){tip.hide(d)})
                svg.selectAll(".node path").style('stroke', "");
                svg.selectAll(".node path").style('stroke-width',  "");
                svg.selectAll("path.selected").attr("d", normalnode)
                svg.selectAll("path.selected").classed("selected", false)
                d3.selectAll('.node').on("mousedown.drag", null);
            
                $("#data").html("No Resource Selected.")
                current_res = null; 
                current_res_type = null;

                if (drag_line != null){
                    drag_line.remove()
                    drag_line = null
                    start_node = null;
                }
        })
        .on("mousemove", function(){
            if (drag_line != null){
                var layer_coords = map.mouseEventToLayerPoint(d3.event) 
                var nodex = layer_coords.x;
                var nodey = layer_coords.y;

                drag_line.attr('d', 'M' + start_node.datum().x_ + ',' + start_node.datum().y_ + 'L' + nodex + ',' + nodey);
            }
        })
        .call(tip)

    g = svg.append("g");

for (var i = 0, len = visible_nodes.length; i < len; i++) {
         d=visible_nodes[i];

        var proj_xy = proj4(source,dest,[d.x,d.y])

        d.LatLng = new L.LatLng(proj_xy[1], proj_xy[0]);

        d.x_ = map.latLngToLayerPoint(d.LatLng).x;
        d.y_ = map.latLngToLayerPoint(d.LatLng).y;
}


function dragged(d) {
    
    d3.event.sourceEvent.stopPropagation();
    
    if( d3.select(this).classed('selected') == false){

        return
    }

    var layer_coords = map.mouseEventToLayerPoint(d3.event.sourceEvent) 
    var nodex = layer_coords.x;
    var nodey = layer_coords.y;

    realcoords = map.layerPointToLatLng(new L.Point(nodex, nodey))
    d.x = realcoords.lng;
    d.y = realcoords.lat;

    d.LatLng = new L.LatLng(d.y, d.x);

    d.x_ = map.latLngToLayerPoint(d.LatLng).x;
    d.y_ = map.latLngToLayerPoint(d.LatLng).y;

    node.attr("transform", function(d){
        return "translate(" + d.x_ + "," + d.y_ + ")";
    });
    text.attr("transform", function(d){
        return "translate(" + d.x_ + "," + d.y_ + ")";
    });

    if (link != undefined){

        link
        .attr('x1', function (d) { return d.source.x_; })
        .attr('y1', function (d) { return d.source.y_; })
        .attr('x2', function (d) { return d.target.x_; })
        .attr('y2', function (d) { return d.target.y_; })
    }

}

function dragended(d)
{
    if( d3.select(this).classed('selected') == false){
        return
    }
    var newxy = proj4(dest,source,[d.x,d.y])
    console.log("New coords: "+newxy[1]+", " + newxy[0])
    update_node(d.id, d.name, newxy[0], newxy[1]);
 }

//Node drag
var drag = d3.drag()
         .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

 //Set up the force layout
var force = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id }))

//Do the same with the circles for the nodes - no
var node = null; 
var link = null; 
var text = null;
var start_node = null;

var redraw_nodes = function(){
    
   g.selectAll(".node").remove()

    node = g.selectAll(".node")
        .data(visible_nodes)
        .enter().append("g")
        .classed("node", true)
        .classed("context-menu-one", true)
        .classed("btn", true)
        .classed("btn-neutral", true)
        .attr("id", function(d) {return d.id;})
        .attr('shape', function(d){
            if (d.type.layout.shape != undefined){
                return d.type.layout.shape
            }else{
                return 'circle'
            }})
        .attr('resourcetype', function(d){return d.type.type_id})
        .style('cursor', 'pointer')
    
        node
        .append('path')
        .style("fill", function(d) {
            var l = d.type.layout;
            if (l.color != undefined){return l.color}else{return 'black'}
          })
        .attr("d", normalnode)
        .on('mouseover', node_mouse_in) //Added
        .on('mouseout', node_mouse_out) //Added
        .on("click", nodes_mouse_click)
        .on("dblclick", nodes_mouse_double_click)

    text = g.append("g").selectAll(".node")
        .data(visible_nodes)
        .enter().append("text")
        .text(function(d) { return d.name; })
        .style("visibility", "hidden")
        .style("font", "12px sans-serif");

}

var redraw_links = function(){

    visible_links.forEach(function(d) {
        if (d.type.layout == undefined){
            d.type.layout = {}
        }else{
            if (typeof(d.type.layout) == 'string'){
                d.type.layout = JSON.parse(d.type.layout)
            }
        }
    });

   g.selectAll(".link").remove()
    //Create all the line svgs but without locations yet
    link = g.selectAll(".link")
        .data(visible_links)
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
        .on('mouseover', link_mouse_in) //Added
        .on('mouseout', link_mouse_out) //Added
        .on("click", links_mouse_click);
}



force.nodes(visible_nodes).on('tick', update)
force.force('link').links(visible_links)

var update = function(){

    node.attr("transform",
        function(d) {
                 d.x_ = map.latLngToLayerPoint(d.LatLng).x;
                d.y_ = map.latLngToLayerPoint(d.LatLng).y;
                return "translate(" + d.x_ + "," + d.y_ + ")";
        }
    );

    text.attr("transform",
        function(d) {
                 d.x_ = map.latLngToLayerPoint(d.LatLng).x;
                d.y_ = map.latLngToLayerPoint(d.LatLng).y;
                return "translate(" + d.x_ + "," + d.y_ + ")";
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

}

map.on("viewreset", update);
redraw_links()
redraw_nodes()

update()

