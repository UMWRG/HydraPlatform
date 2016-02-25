// set up SVG for D3
var width  = 960,
    height = 500,
    colors = d3.scale.category10();

    //Transform functions, used to convert the Hydra coordinates
    //to coodrinates on the d3 svg
  var x = d3.scale.linear()
                           .domain([min_y,max_y])
                           .range([0,1000]);
  var y = d3.scale.linear()
                          .domain([max_x,min_x])
                          .range([0,500]);

var drag_line = null;

var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);

var svg = d3.select('#graph')
  .append('svg')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height);

var container = svg.append("svg:g")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

var plot = container.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "#EEEEEE")
      .attr("pointer-events", "all") 
      .call(d3.behavior.zoom().x(x).y(y).on("zoom", redraw_graph));

container.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", "0 0 "+width+" "+height)
      .attr("class", "line");

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

svg.on("contextmenu", function (d, i) {
            d3.event.preventDefault();
           // react on right-clicking
        });


// handles to link and node element groups
var path = container.select('svg').selectAll('path'),
    circle = container.select('svg').selectAll('circle'),
    nodelabels = container.select('svg').selectAll('text');

var property_rows = d3.select('#nodeproperties').select('table').selectAll('tr.property');

// mouse event vars
var selected_node = null,
    selected_link = null,
    selected_graph = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
  // draw directed edges with proper padding from node centers
  path.attr('d', function(d) {
    //TODO: make this more efficient!
    target = null;
    source = null;
    for (i=0; i<nodes.length; i++){
        if (nodes[i].id == d.target){
            target = nodes[i];
            break
        }
    }
    for (i=0; i<nodes.length; i++){
        if (nodes[i].id == d.source){
            source = nodes[i];
            break
        }
    }

    var deltaX = x(target.x) - x(source.x),
        deltaY = y(target.y) - y(source.y),
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = d.left ? 17 : 12,
        targetPadding = d.right ? 17 : 12,
        sourceX = x(source.x) + (sourcePadding * normX),
        sourceY = y(source.y) + (sourcePadding * normY),
        targetX = x(target.x) - (targetPadding * normX),
        targetY = y(target.y) - (targetPadding * normY);
    return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });

}

// update node properties table
function node_properties() {

    property_rows = property_rows.data(function(d) {
        var arr = [];
        if(!selected_node) return [];
        Object.keys(selected_node).forEach(function(key,index) {
             arr.push({value: selected_node[key], key: key});
        });
        return arr;
    })

    property_rows.enter().append('tr')
      .attr('class', 'property')


    property_rows.exit().remove()

    property_cells = property_rows.selectAll('td').data(function(d, i) {
        return [d.key, d.value];
    }).text(function(d) {return d;})

    property_cells.enter().append('td')
        .text(function(d) {return d;})


}

// update graph (called when needed)
function redraw_graph() {
// circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  // update existing nodes (reflexive & selected visual states)
  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .classed('reflexive', function(d) { return d.reflexive; });

  // add new nodes
  var g = circle.enter().append('svg:circle')
    .attr('class', 'node')
    .attr('r', 12)
    .attr('cx', function(d){return self.x(d.x);})
    .attr('cy', function(d){return self.y(d.y);})
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .classed('reflexive', function(d) { return d.reflexive; })
    .on('mouseover', function(d) {
//      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('r', '12').style('stroke', 'black');
    })
    .on('mouseout', function(d) {
 //     if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('r', '10').style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); });
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;

      node_properties();
      selected_link = null;


        // line displayed when dragging new nodes
      drag_line = container.select('svg').append('path')
        .attr('class', 'link dragline hidden')
        .style('marker-end', 'url(#end-arrow)')
        .classed('hidden', false)
        .attr('d', 'M' + x(mousedown_node.x) + ',' + y(mousedown_node.y) + 'L' + x(mousedown_node.x) + ',' + y(mousedown_node.y));

      redraw_graph();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;

      // needed by FF
      drag_line
        .classed('hidden', true)
        .style('marker-end', '');

      // check for drag-to-self
      mouseup_node = d;
      if(mouseup_node === mousedown_node) { resetMouseVars(); return; }

      // unenlarge target node
      d3.select(this).attr('transform', '');

      // add link to graph (update if exists)
      // NB: links are strictly source < target; arrows separately specified by booleans
      var source, target, direction;
      if(mousedown_node.id < mouseup_node.id) {
        source = mousedown_node;
        target = mouseup_node;
        direction = 'right';
      } else {
        source = mouseup_node;
        target = mousedown_node;
        direction = 'left';
      }

      var link;
      link = links.filter(function(l) {
        return (l.source === source && l.target === target);
      })[0];

      if(link) {
        link[direction] = true;
      } else {
        link = {source: source.id, target: target.id, left: false, right: false};
        link[direction] = true;
        links.push(link);
      }

      // select new link
      selected_link = link;
      selected_node = null;
      redraw_graph();
    });

    circle.attr('cx', function(d){return self.x(d.x);})
    .attr('cy', function(d){return self.y(d.y);})

  // remove old nodes
  circle.exit().remove();

  nodelabels = nodelabels.data(nodes);
  // add new node labels 
  nodelabels.enter().append('svg:text')
    .attr('x', function(d){return self.x(d.x);})
    .attr('y', function(d){return self.y(d.y);})
    .text(function(d){return d.id;})
    .classed('nodelabel', true)

  nodelabels.attr('x', function(d){return self.x(d.x);})
    .attr('y', function(d){return self.y(d.y);})
  
  nodelabels.exit().remove();

  // path (link) group
  path = path.data(links);

  // update existing links
  path.classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });


  // add new links
  path.enter().append('svg:path')
    .attr('class', 'link')
    .classed('selected', function(d) { return d === selected_link; })
    .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
    .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select link
      mousedown_link = d;
      if(mousedown_link === selected_link) selected_link = null;
      else selected_link = mousedown_link;
      selected_node = null;
      node_properties();
      redraw_graph();
    });

  // remove old links
  path.exit().remove();
  tick();
}

function mousedown() {
  // prevent I-bar on drag
  //d3.event.preventDefault();

  // because :active only works in WebKit?
  container.select('svg').classed('active', true);

  if(d3.event.ctrlKey || mousedown_node || mousedown_link || d3.event.buttons == 2) return;

  // insert new node at point
  var point = d3.mouse(container.select('svg').node()),
      node = {id: ++lastNodeId, reflexive: false};
  node.x = x.invert(point[0]);
  node.y = y.invert(point[1]);
  nodes.push(node);

  redraw_graph();
}

function mousemove() {
  if(!mousedown_node) return;
  // update drag line
  drag_line.attr('d', 'M' + x(mousedown_node.x) + ',' + y(mousedown_node.y) + 'L' + d3.mouse(container.select('svg').node())[0] + ',' + d3.mouse(container.select('svg').node())[1]);
  tick()
  //redraw_graph();
}

function mouseup() {
  if(mousedown_node) {
    // hide drag line
    drag_line
      .classed('hidden', true)
      .style('marker-end', '');
  }

  // because :active only works in WebKit?
  container.select('svg').classed('active', false);

  // clear mouse event vars
  resetMouseVars();
}

function spliceLinksForNode(node) {
  var toSplice = links.filter(function(l) {
    return (l.source === node || l.target === node);
  });
  toSplice.map(function(l) {
    links.splice(links.indexOf(l), 1);
  });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {

  /*Allow the user to enter values into input boxes!*/
  if (d3.event.target.type){
      return;
  }

  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle.call(drag);
    svg.classed('ctrl', true);
  }

  if(!selected_node && !selected_link) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      if(selected_node) {
        nodes.splice(nodes.indexOf(selected_node), 1);
        spliceLinksForNode(selected_node);
      } else if(selected_link) {
        links.splice(links.indexOf(selected_link), 1);
      }
      selected_link = null;
      selected_node = null;
      redraw_graph();
      break;
    case 66: // B
      if(selected_link) {
        // set link direction to both left and right
        selected_link.left = true;
        selected_link.right = true;
      }
      redraw_graph();
      break;
    case 76: // L
      if(selected_link) {
        // set link direction to left only
        selected_link.left = true;
        selected_link.right = false;
      }
      redraw_graph();
      break;
    case 82: // R
      if(selected_node) {
        // toggle node reflexivity
        selected_node.reflexive = !selected_node.reflexive;
      } else if(selected_link) {
        // set link direction to right only
        selected_link.left = false;
        selected_link.right = true;
      }
      redraw_graph();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  // ctrl
  if(d3.event.keyCode === 17) {
    circle
      .on('mousedown.drag', null)
      .on('touchstart.drag', null);
    svg.classed('ctrl', false);
  }
}

function dragstarted(d) {
  if(d3.event.sourceEvent.buttons == 1){
    d3.event.sourceEvent.stopPropagation();
    d3.select(this).classed("dragging", true);
  }
}

function dragged(d) {

  if(d3.event.sourceEvent.buttons == 1){
    d.x = d3.event.x
    d.y = d3.event.y
    tick();
 }
}

function dragended(d) {
  if(d3.event.sourceEvent.buttons == 1){
    d3.select(this).classed("dragging", false);
  }
}

// app starts here
container.on('mousedown', mousedown)
  .on('mousemove', mousemove)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);

redraw_graph();
