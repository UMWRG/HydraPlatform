$(document).on('click', '#data .close-resource-data', function(){
    $("#data").html("No Resource Selected.")
})


$(document).on('click', '#data .save-resource-data', function(){
    
})

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

function get_resource_data(res_type, d)
{
    $( "#data" ).empty();
    $("#timeseries_g" ).empty();

    current_res=d;
    var table = $('<table></table>')
    
    var error = function(resp) {
        alert('Unexpected error');
    }

    var success = function(data, status, request) {
        $('#data').html(data)
    }
    
    var pars=
    {
        network_id: network_id,
        scenario_id: scenario_id,
        res_id: d.id,
        resource_type:res_type
    };

    $.ajax({
        type: 'POST',
        url: get_resource_data_url,
        data:  JSON.stringify(pars),
        success: success,
        error:error,
    });

}

function get_network_attributes()
{
   
    var d = {
        id:network_id,
    }
    
    get_resource_data('NETWORK', d)
}
