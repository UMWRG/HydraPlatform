var current_res_type = null;
var current_res = null;
$(document).on('click', '#data .close-resource-data', function(){
    $("#data").html("No Resource Selected.")
    current_res_type = null;
    current_res = null;
})


$(document).on('click', '#data .save-resource-data', function(){

    var container = $("#data table")

    var rs_list = []
    $('tr.attribute', container).each(function(){
        var attr_id = $("input[name='attr_id']", this).val()
        var rs_id = $("input[name='rs_id']", this).val()
        var ra_id = $("input[name='ra_id']", this).val()
        var dataset_id = $("input[name='dataset_id']", this).val()
        var data_type = $("input[name='data_type']", this).val()
        var value = $("input[name='value']", this).val()
        var name = $("input[name='dataset_name']", this).val()
        var metadata = $("input[name='metadata']", this).val()

        if (dataset_id == ''){
           name = new Date().toJSON().slice(0,10);
        }

        if (value == ""){
            return
        }

        var dataset = {
           type: data_type,
           value : value,
           name: name,
           metadata:metadata
        }

        var rs = {
            id: rs_id,
            resource_attr_id: ra_id,
            value: dataset,
            attr_id: attr_id,
            resource_id:current_res.id,
            resource_type:current_res_type
        }

        rs_list.push(rs)
    })


    var data = {
        rs_list: rs_list,
        scenario_id: scenario_id
    }

    var success = function(){
        get_resource_data(current_res_type, current_res)
    }

    var error = function(resp){
        alert(resp)
    }

    $.ajax({
        url: update_resourcedata_url,
        data: JSON.stringify(data),
        async: false,
        type:'POST',

    })

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

$(document).on("click", ".resourcerow", function(){
  var res_details = $(this).attr('id').split('_');
  var res_type = res_details[0]
  var res_id = res_details[1]
  var d = {'id':res_id}
  get_resource_data(res_type, d)
})

function get_resource_data(res_type, d)
{
    $( "#data" ).empty();
    $("#timeseries_g" ).empty();

    var error = function(resp) {
        alert('Unexpected error');
    }

    var success = function(data, status, request) {
        $('#data').html(data)
        updateInputs() // Turn text inputs into buttons for timeseries and arrays. Function in dataset.js
        current_res_type = res_type;
        current_res = d
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

$(document).on("click", "#create-attr-button", function(event){

    event.preventDefault();

    var formdata = $("#create-attr").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    var success = function(resp){
        var new_attr = JSON.parse(resp)

        var new_attr_option = "<option value='"+new_attr.attr_id+"'>"+new_attr.attr_name+" (" + new_attr.attr_dimen + ") </option>";

        $("select.typeattrs").each(function(){
            $(this).append(new_attr_option)
        })

        $('.selectpicker').selectpicker('refresh');


        $("#close-create-attr-button").click()
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }

    $.ajax({
        url: add_attr_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
