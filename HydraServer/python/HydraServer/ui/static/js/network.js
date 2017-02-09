

$('#data').draggable()

get_node = function(node_id){
    $.ajax({url:"/node/"+node_id,
           dataType:'json',
           success:insert_node});
};


$(document).on("click", ".node", function(){
   var net_id = this.id.split('_')[1];

    $('#scenario_list .table-row').addClass('hidden');

   var scenario_container = $('#network_'+net_id+'_scenarios').removeClass('hidden');

});

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

var sig = {
        container: 'graph_container',
        type: 'canvas',
        settings: {
            enableEdgeHovering: true,
            edgeHoverColor: 'edge',
            defaultEdgeHoverColor: '#000',
            edgeHoverSizeRatio: 1,
            edgeHoverExtremities: true,
            defaultNodeColor: '#ec5148',
            doubleClickEnabled: false,
            minEdgeSize: 0.5,
            maxEdgeSize: 4
        }
    }

$(document).ready(function(){

    if (Cookies.get("tab_selected") == "list"){
        $("#listtab a").click();
        var tabselected=Cookies.get('node_link_selected')
        if (tabselected=='node' || tabselected==undefined){
          $("#nodetab a:first-child").tab('show')
        }else if(tabselected=='link'){
          $("#linktab a:first-child").tab('show')
        }else if (tabselected == 'group'){
          $("#grouptab a:first-child").tab('show')
        }
        initTables();

    } else if (Cookies.get("tab_selected") == "static"){
        $("#statictab a").click();
    }

});

$(document).on('click', '#linktab', function(){
    Cookies.set("node_link_selected", "link", {path:window.location.pathname})
    initTables()
});

$(document).on('click', '#nodetab', function(){
    Cookies.set("node_link_selected", "node",  {path:window.location.pathname})
    initTables()
});

$(document).on('click', '#grouptab', function(){
    Cookies.set("node_link_selected", "group",  {path:window.location.pathname})
    initTables()
});

var initTables = function(){
  var tabselected = Cookies.get("node_link_selected")
  if (tabselected == 'group'){
    if (!$('#grouptable').hasClass('dataTable')){
      $('#grouptable').DataTable({
          pageSize: 10,
          sort: [true, true, true],
          filters: [true, false, false],
          filterText: 'Type to filter... ',
          language: {
            "emptyTable": "No groups in the network.  <div data-toggle='modal' data-target='#new_group_modal' class='btn btn-sm btn-primary'><span class='fa fa-plus'></span> Create A Group</div>"
          }
      }) ;
    }
  } else if (tabselected == 'node' || tabselected == undefined){
    if (!$('#nodetable').hasClass('dataTable')){
      $('#nodetable').DataTable({
          pageSize: 10,
          sort: [true, true, true, true],
          filters: [true, false, false, false],
          filterText: 'Type to filter... '
      }) ;
    }
  }else if (tabselected == 'link'){
    if (!$('#linktable').hasClass('dataTable')){
      $('#linktable').DataTable({
          pageSize: 10,
          sort: [true, true, true],
          filters: [true, false, false],
          filterText: 'Type to filter... '
      }) ;
    }
  }
}
$(document).on('click', '.expand_table', function(){
    var tbody = $(this).closest('thead').siblings('tbody')
    var hidden = tbody.is(':hidden');
    tbody.toggle();
    if (hidden){
        $(this).html("&darr;");
    }else{
        $(this).html("&rarr;");
    }
});

$(document).on('click', '.graph_dataset', function(){

    var tbody = $(this).siblings('.value');

    var win = window.open($(this).attr("url"), '_blank');
    win.focus();

});

$(document).on('click', '.noderow', function(){
    var success = function(data){
        //add_overlay(data);
    }

    var node_id = this.id.split('_')[1]
    $.ajax({
        url:'/node?node_id='+node_id+'&scenario_id='+scenario_id,
        success:success,
    });

});

$(document).on('click', '.noderow', function(){
    var success = function(data){
        //add_overlay(data);
    }

    var node_id = this.id.split('_')[1]
    $.ajax({
        url:'/node?node_id='+node_id+'&scenario_id='+scenario_id,
        success:success,
    });

});

$(document).on('click', '.attributes .attribute.timeseries', function(){
    var ts_data = $(".attrval .contents", this).html();
    var js_data = jQuery.parseJSON(ts_data);
    var index = [];
    for (t in js_data){
        index.push({"mData": t});
        console.log(t);
    }
    var data = []
    for (t in js_data[0]){
        data.push({'time':t, 'value':js_data[0][t]})
    }

    $("table", this).dataTable({
        'aaData':data,
        "aoColumns": [{"mData": 'time'}, {"mData": 'value'}],
    });
    var t = $("table", this).removeClass('hidden');

   /* var ts_table = $(
     '<table>' + $.map(js_data['0'], function(value,key){
         console.log(value);
         return '<tr><td>'+key+'</td><td>'+value+'</td></tr>'
      }).join('')+'</table>'
    );
    var x = $(".attrval", this);
    x.append(ts_table);*/
});

$(document).on('click', '#statictab', function(){
    //$('#googleMap').addClass('hidden');
    $('#graph_container').removeClass('hidden');
    $('#nodesandlinks').addClass('hidden');
    $('#nodetable').addClass('hidden');
    $(this).addClass('active');
    //$('#mapstab').removeClass('selected');
    $('#listtab').removeClass('active');
    Cookies.set("tab_selected", "static")
});

//$(document).on('click', '#mapstab', function(){
//    $('#graph_container').addClass('hidden');
//    $('#googleMap').removeClass('hidden');
//    $('#nodesandlinks').addClass('hidden');
//    $('#nodetable').addClass('hidden');
//    $(this).addClass('selected');
//    $('#statictab').removeClass('selected');
//    $('#listtab').removeClass('selected');
//    if (maps_initialized == false){
//    	initialize();
//    }
//    Cookies.set("tab_selected", "map")
//});
//

$(document).on('click', '#listtab', function(){
    $('#graph_container').addClass('hidden');
    //$('#googleMap').addClass('hidden');
    $('#nodesandlinks').removeClass('hidden');
    $('#nodetable').removeClass('hidden');

    $(this).addClass('selected');
    //$('#mapstab').removeClass('active');
    $('#statictab').removeClass('active');
    Cookies.set("tab_selected", "list")

    var tabselected=Cookies.get('node_link_selected')
    if (tabselected=='node' || tabselected==undefined){
      $("#nodetab a:first-child").tab('show')
    }else if(tabselected=='link'){
      $("#linktab a:first-child").tab('show')
    }else if (tabselected == 'group'){
      $("#grouptab a:first-child").tab('show')
    }
    initTables();

});

$('#network-tab div').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
});

var updateNodeTimeout = null;

$(document).on('input', "#resource-name input[name='resource_name']", function(){

    if (updateNodeTimeout != null){
        console.log('clearing timeout')
        clearTimeout(updateNodeTimeout);
        updateNodeTimeout = null;
    }

    var container = $(this).closest('td')

    var name = $(this).val()
    var id = $("input[name='resource_id']", container).val()
    console.log("Name: " + name)

    updateNodeTimeout = setTimeout(function(){update_resource_name(id, name, 'NODE')}, 300)

})

function update_resource_name(node_id, name, resource_type)
    {
    //to do connect to the server and update node location
        //
    var success = function(resp){
        updateNodeTimeout = null;
    }

    var error = function(resp){
        alert(resp)
    }

    var nodedata = {
        name: name,
        id: node_id,
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


$(function() {
    var res_names = [];
    for ( i in nodes_)
    {
    res_names.push(nodes_[i].name);
    }
    for(i in links_)
    {
     res_names.push(links_[i].name);
    }
    $( "#search" ).autocomplete({
       source: res_names
    });
 });


$(document).on('show.bs.modal', '#clone_scenario_modal', function (e) {
    var current_scenario = $('#scenario-picker option:selected')
    var scenario_id = current_scenario.val()
    //Set the clone to tbe the cuurent active scenario
    $('#new-group-scenario-id-input').val('scenario_id');


})

$(document).on('hide.bs.modal', '#clone_scenario_modal', function (e) {
    $("#clone-scenario-button i").addClass('hidden')
})

$(document).on('click', '#clone-scenario-button', function(e){
    e.preventDefault();
    $("#clone-scenario-button i").removeClass('hidden')

    var success = function(resp){
        var new_scenario = JSON.parse(resp)
        $("#clone-scenario-button i").addClass('hidden')
        $('#clone_scenario_modal').modal('hide');

        $("#clone-scenario select").append("<option value='"+new_scenario.scenario_id+"'>"+new_scenario.scenario_name+"</option>")
        $("#clone-scenario select option[value="+new_scenario.scenario_id+"]").attr('selected','selected');
        $('#clone_scenario_modal .selectpicker').selectpicker('refresh');

        $("#scenario-picker").append("<option value='"+new_scenario.scenario_id+"'>"+new_scenario.scenario_name+"</option>")
        $("#scenario-picker option[value="+new_scenario.scenario_id+"]").attr('selected','selected');
        $('#sidebar_container .selectpicker').selectpicker('refresh');

        scenario_id=new_scenario.scenario_id;
    }

    var error = function(){
        $("#clone-scenario-button i").addClass('hidden')
        $("#clone_scenario_modal .modal-body").append(
                            "<div>An error has occurred.</div>")
    }

    var scenario_name =  $("#scenario-name-input").val()
    var scenario_id   =  $("#clone-scenario select.scenariopicker option:selected").val()
    $.ajax({
        type: 'POST',
        url : clone_scenario_url,
        data: JSON.stringify({scenario_id:scenario_id,
                scenario_name:scenario_name}),
        success: success,
        error  : error,
    })
})



$(document).on('show.bs.modal', '#new_group_modal', function (e) {
    var current_scenario = $('#scenario-picker option:selected')
    var scenario_id = current_scenario.val()
    $("#new-group-scenario-id-input").val(scenario_id);
    d3.select("#group-items-input option").remove()

    var typeselect = d3.select("#group-type-input")
    var grptypes = type_lookup['GROUP']
    typeselect.selectAll('option')
              .data(grptypes)
              .enter()
              .append('option')
              .attr('value', function(d){
                  return d.type_id
                })
              .text(function(d){
                return d.type_name
              })

    var nodegrp = d3.select("#group-nodes-select")
    nodegrp.selectAll('option')
                      .data(nodes_)
                      .enter()
                      .append('option')
                      .text(function(d){return d.name})
                      .attr('value', function(d){return d.id})

    var linkgrp = d3.select("#group-links-select")
    linkgrp.selectAll('option')
                      .data(links_)
                      .enter()
                      .append('option')
                      .text(function(d){return d.name})
                      .attr('value', function(d){return d.id})

    var grpgrp = d3.select("#group-links-select")
    grpgrp.selectAll('option')
                      .data(groups_)
                      .enter()
                      .append('option')
                      .text(function(d){return d.name})
                      .attr('value', function(d){return d.id})

    $('#new_group_modal .selectpicker').selectpicker('refresh');

})

$(document).on('hide.bs.modal', '#new_group_modal', function (e) {
    $('#group-items-input option').remove();
})

$(document).on('click', '#create-group-button', function(e){
    e.preventDefault();

    var success = function(resp){
        var newgroup = JSON.parse(resp)
        $('#create-group-button').modal('hide');

        var groupprops = Object.keys(newgroup)
        var data = []
        for (var i=0; i< grouprops.length; i++){
          var propname = groupprops[i];
          var propval  = newgroup[propname];
          data.push({'name':propname, 'value': propval})
        }
        var newrow = d3.select('#grouptable')
                          .append('tr')
                          .data(data)
        newrow.append('td').text(function(d){d.group_name})
        newrow.append('td').text(function(d){d.typesummary[0].type_name})
        newrow.append('td').text(function(d){d.resourcetypes})
    }

    var error = function(){
        $("#create-group-button .modal-body").append(
                            "<div>An error has occurred.</div>")
    }

    var group_name =  $("#group-name-input").val()
    var group_type =  $("#group-type-input").val()
    var scenario_id = $("#new-group-scenario-id-input").val(scenario_id);

    $.ajax({
        type: 'POST',
        url : clone_scenario_url,
        data: JSON.stringify(
          {scenario_id : scenario_id,
           types       : [{'type_id':group_type}],
           name        : group_name
         }),
        success: success,
        error  : error,
    })
})
