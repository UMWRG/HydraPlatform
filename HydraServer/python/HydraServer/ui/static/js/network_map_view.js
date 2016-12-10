
var dest = new proj4.Proj('EPSG:4326');
var source = new proj4.Proj(projection_crs);


var map = L.map('graph').setView([31.18113841492, 36.451667120665], 8);
    mapLink = 
        '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
        'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
        }).addTo(map);
           

/* Initialize the SVG layer */
map._initPathRoot()    

/* We simply pick up the SVG from the map object */
var svg = d3.select("#graph").select("svg"),
    g = svg.append("g");

for (var i = 0, len = nodes_.length; i < len; i++) {
         d=nodes_[i];

        var proj_xy = proj4(source,dest,[d.x,d.y])

        d.LatLng = new L.LatLng(proj_xy[1], proj_xy[0]);

        d.x_ = map.latLngToLayerPoint(d.LatLng).x;
        d.y_ = map.latLngToLayerPoint(d.LatLng).y;
}


 //Set up the force layout
var force = d3.forceSimulation()
            .force("link", d3.forceLink().id(function(d) { return d.id }))

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
   g.selectAll(".node").remove()

    node = g.selectAll(".node")
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
        .attr("d", d3.symbol()
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
         }))

    text = g.append("g").selectAll(".node")
        .data(nodes_)
        .enter().append("text")
        .text(function(d) { return d.name; })
        .style("visibility", "hidden")
        .style("font", "12px sans-serif");

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

   g.selectAll(".link").remove()
    //Create all the line svgs but without locations yet
    link = g.selectAll(".link")
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
}



force.nodes(nodes_).on('tick', update)
force.force('link').links(links_)

var update = function(){
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

}

map.on("viewreset", update);
redraw_links()
redraw_nodes()

update()

