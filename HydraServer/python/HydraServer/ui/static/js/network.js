
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
    $('#nodetable').DataTable({
        pageSize: 10,
        sort: [true, true, true, true],
        filters: [true, false, false, false],
        filterText: 'Type to filter... '
    }) ;

    $('#linktable').DataTable({
        pageSize: 10,
        sort: [true, true, true, true],
        filters: [true, false, false, false],
        filterText: 'Type to filter... '
    }) ;

    $('#linktable_wrapper').addClass('hidden');

    if (Cookies.get("tab_selected") == "list"){
        $("#listtab a").click();
    } else if (Cookies.get("tab_selected") == "static"){
        $("#statictab a").click();
    }

});

$(document).on('click', '#linktab', function(){
    $('#nodetable').addClass('hidden');
    $('#nodetable_wrapper').addClass('hidden');
    $('#linktable').removeClass('hidden');
    $('#linktable_wrapper').removeClass('hidden');
    $('#nodetab').removeClass('selected');
    $(this).addClass('selected');
    Cookies.set("node_link_selected", "list")
});

$(document).on('click', '#nodetab', function(){
    $('#linktable').addClass('hidden');
    $('#linktable_wrapper').addClass('hidden');
    $('#linktable_wrapper').removeClass('selected');
    $('#nodetable').removeClass('hidden');
    $('#nodetable_wrapper').removeClass('hidden');
    $('#linktab').removeClass('selected');
    $(this).addClass('selected');
    Cookies.set("node_link_selected", "node")
});


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
});

$('#network-tab div').click(function (e) {
    e.preventDefault()
    $(this).tab('show');
});
