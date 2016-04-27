
//var nodes_= [{"name": "Myriel","group": 1, "x": 0, "y": 20}, {"name": "Napoleon","group": 1, "x":20, "y":30}, {"name": "Mlle.Baptistine", "group": 1, "x":40, "y":500 }];

//var links_=[ {"source": 1,"target":0,"value":1},{"source":0,"target":2,"value":1}]

//Constants for the SVG
//var width = 500,
 //   height = 500;
 alert('HEllo')
var margin = {'top': 60, 'right': 40, 'bottom': 60, 'left': 100};

    var width  = (1020- margin.left - margin.right),
    height = (700-margin.top - margin.bottom);
    colors = d3.scale.category10();
 alert('HEllo 2')

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
    .size([width + margin.left + margin.right, height+ margin.top + margin.bottom]);

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
    .style("marker-end",  "url(#suit)") // Modified line
    .style("stroke-width", function (d) {return Math.sqrt(d.value) })
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
    .attr('cx', function(d){return self.x((d.x));})
    .attr('cy', function(d){return self.y((d.y));})
    .attr("r", 9)
    .style("fill", function (d) {
    return color(d.group);
})
    .call(force.drag)
    .on('mouseover', mouse_in) //Added
    .on('mouseout', node_mouse_out) //Added
    .on("click", nodes_mouse_click);

//giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
force.on("tick", function () {
 nodes.attr('cx', function (d) { return self.x(d.x); });
  links.attr('x1', function (d) { return self.x(d.source.x); })
    .attr('x2', function (d) { return self.x(d.target.x); });
});
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



 function nodes_mouse_click(d) {
   // unenlarge target node
   //
   $( "#data" ).empty();
    var table = $('<table></table>').addClass('foo');


   for (i in nodes_attrs)
   {
  var count=0;

     if (d.id==nodes_attrs[i].id)
     {
     if(count==0)
       $( "#data" ).append(  '<h4>Attributes for link: '+d.name+'</h4>');
       count+=1;
     tableCreate(nodes_attrs[i]);
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
     }
   }
   d3.select(this).style('stroke');

}

 function links_mouse_click(d) {
   // unenlarge target node
   //

   // unenlarge target node
   //
   $( "#data" ).empty();
   var count=0;

   for (i in links_attrs)
   {
     if (d.id==links_attrs[i].id)
     {
     if(count==0)
       $( "#data" ).append(  '<h4>Attributes for link: '+d.name+'</h4>');
       count+=1;
     tableCreate(links_attrs[i]);
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
     }
   }
   d3.select(this).style('stroke',  function(d) {get_node_attributes(d.id, d.node_name)});

}



function mouse_in(d) {
   // unenlarge target node
   tip.show(d);
      d3.select(this).style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); });
}

function node_mouse_out(d) {
   // unenlarge target node
   tip.hide(d);
      d3.select(this).style('stroke', '#fff' );
}

function mouse_in(d) {
   // show  resource tip and change border
   tip.show(d);
   d3.select(this).style('stroke',  function(d) { return d3.rgb(colors(d.id)).darker().toString(); });
}

function link_mouse_out(d) {
   // hide resource tip and change border
   tip.hide(d);
   d3.select(this).style('stroke', '#999');
}


function get_node_attributes(id, name){


}

function tableCreate(res) {
        var table =  $('#data')
        var table = $('<table></table>').addClass('foo');
        //alert(nodes_attrs[i].attrr_name+", "+nodes_attrs[i].type+", "+nodes_attrs[i].values);
        var name_row = $("<tr/>");
        var name_ = $('<th></th>').addClass('bar').text('Attribute name ' );
        name_row.append(name_);

        var res_name = $('<tr></tr>').addClass('bar').text(res.attrr_name);
        name_row.append(res_name);
        table.append(name_row);

        var type_row = $("<tr/>");
        var type_ = $('<th></th>').addClass('bar').text('Type ' );
        type_row.append(type_);

        var res_type = $('<tr></tr>').addClass('bar').text(res.type);
        type_row.append(res_type);
        table.append(type_row);

        if(res.type == 'timeseries')
        {
          var date_row = $("<tr/>");
           var date_ = $('<th ></th>').addClass('bar').text('Date ' );
           var value_ = $('<th></th>').addClass('bar').text('Value ' );

           date_row.append(date_);
           date_row.append(value_);
           table.append(date_row);
         for (j in res.values)
        {

           //alert(res.values[j].date);
            var value_row = $("<tr/>");

           var date=new Date(res.values[j].date);
           var formateddate=date.toLocaleFormat('%d-%m-%Y');

           var thread=$ ('<tr></tr>');
           var res_date = $('<td></td>').addClass('bar').text(formateddate);
           var res_value = $('<td></td>').addClass('bar').text(res.values[j].value);

           value_row.append(res_date);
           value_row.append(res_value);

           //value_row.append(res_value);
           table.append(value_row);

        }
        }

    $('#data').append(table);
   }