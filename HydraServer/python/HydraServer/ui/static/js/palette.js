var dragSrcEl = null;
var svg = null;
var x = null;
var y = null;

function handleDragStart(e) {
    this.style.opacity = '0.4';  // this / e.target is the source node.
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}


function handleDragOver(e) {
    if (e.preventDefault) {
    e.preventDefault(); // Necessary. Allows us to drop.
    }

    e.dataTransfer.dropEffect = 'move';  

    return false;
}

function handleDragEnter(e) {
    // this / e.target is the current hover target.
    this.classList.add('over');
}

function handleDragLeave(e) {
    // this / e.target is previous target element.
    this.classList.remove('over');  
}

function handleDrop(e) {
  // this / e.target is current target element.

    if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
    }

    svg_origin = document.querySelector('#graph svg').getBoundingClientRect();

    svg_topleft_x = svg_origin.x;
    svg_topleft_y = svg_origin.y;

    var nodex = e.clientX - svg_topleft_x - margin.left;
    var nodey = e.clientY - svg_topleft_y - margin.top;

    var nodex_nomargin =  e.clientX - svg_topleft_x;
    var nodey_nomargin = e.clientY - svg_topleft_y;
       
    var g = dragSrcEl.querySelector("g");


    console.log("Dropping "+g+" on "+nodex+" , "+nodey+".");
    console.log("Dropping "+g+" on "+nodex_nomargin+" , "+nodey_nomargin+".");
    
    var newnode = svg.append('g')
      .html(g.innerHTML)
      .attr('class', 'node')
      .attr("transform", function(d) { 
          return "translate(" + nodex + "," + nodey + ")"; 
        }); 
    
    var date = new Date(); // for now
    var default_name = "Node " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    var type_id = newnode.select('path').attr('resourcetype')

    for (var i=0; i<template.templatetypes.length; i++){
        if (parseInt(type_id) == template.templatetypes[i]['type_id']){
            var t = template.templatetypes[i]
        }
    }

    if (currentTransform == null){
        var realnodex = xScale.invert(nodex)
    }else{
        var realnodex = xScale.invert(currentTransform.invertX(nodex))
    }

    if (currentTransform == null){
        var realnodey = yScale.invert(nodey)
    }else{
        var realnodey = yScale.invert(currentTransform.invertY(nodey))
    }

    node_id = add_node(default_name, type_id, realnodex, realnodey)

    nodes_.push({
        id          : node_id,
        name        : default_name,
        type        : t,
        x           : realnodex,
        y           : realnodey, 
        description : "",
        group       : 1, //These will be phased out
        res_type    : 'node'
    })

    redraw_nodes()

  return false;
}

function handleDragEnd(e) {
  // this/e.target is the source node.

   this.style.opacity = '1'; 

  var types = document.querySelectorAll('#palette .draggablebox');
  [].forEach.call(types, function (typ) {
    typ.classList.remove('over');
  });
}


function activateShapes(){
    var types = document.querySelectorAll('#palette .draggablebox');
    [].forEach.call(types, function(typ) {
      typ.addEventListener('dragstart', handleDragStart, false);
      typ.addEventListener('dragenter', handleDragEnter, false);
      typ.addEventListener('dragleave', handleDragLeave, false);
      typ.addEventListener('dragend', handleDragEnd, false);
    });
}

function activateCanvas(){
    document.querySelector('#graph').addEventListener('dragover', handleDragOver, false);
    document.querySelector('#graph').addEventListener('drop', handleDrop, false);

}

function loadShapesIntoPalette(){

    var palette = d3.select("#palette")
    
    svg = d3.select("#graph svg")

    var typedict = {} 
    for (i=0; i<template.templatetypes.length; i++){
        var tt = template.templatetypes[i]
        var rt = tt.resource_type

        if (typedict[rt] == undefined){
            typedict[rt] = [tt]
        }else{
            typedict[rt].push(tt)
        }
    }
    // Declare the shapes
    var node = palette.selectAll("div.shapecontainer")
      .data(typedict['NODE'])

    // Enter the shapes.
    var nodeEnter = node.enter().append("div")
      .attr("class", "shapecontainer")
      .append('span')
      .attr('class', 'draggablebox')
      .attr('draggable', 'true')
      .append("svg")
      .attr("class", "palettesvg")
      .append('g')
      .attr('class', 'type')
      .attr('shape', function(d){if (d.layout.shape != undefined){return d.layout.shape}else{return 'circle'}})
      .attr("transform", function(d) { return "translate(10,10)"; })
      .append("path")
      .attr('resourcetype', function(d){return d.type_id})
      .style("stroke", function(d) {
          if (d.layout.border != undefined){return d.layout.border}else{return 'black'}
      })
      .style("fill", function(d) {
          if (d.layout.color != undefined){return d.layout.color}else{return 'black'}
      })
      .attr("d", d3.symbol()
         .size(function(d) { 
             var height = d.layout.height
             if (height == undefined){
                 height = 10
             }
             var width = d.layout.width
             if (width == undefined){
                 width = 10
             }

             return height * width; } )
         .type(function(d) { if
           (d.layout.shape == "circle") { return d3.symbolCircle; } else if
           (d.layout.shape == "diamond") { return d3.symbolDiamond;} else if
           (d.layout.shape == "cross") { return d3.symbolCross;} else if
           (d.layout.shape == "triangle") { return d3.symbolTriangle;} else if
           (d.layout.shape == "square") { return d3.symbolSquare;} else if
           (d.layout.shape == "star") { return d3.symbolStar;} else if
           (d.layout.shape == "wye") { return d3.symbolWye;} else
           { return d3.symbolCircle; }
         })); 

    //Make the shapes in the palette draggable.
    activateShapes();
    activateCanvas();
    
};


loadShapesIntoPalette()
