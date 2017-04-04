var current_solution = null;

$(document).on('show.bs.modal', '#load-ebsd-data-modal', function(){
    $('#load-ebsd-data-modal input[name=scenario_id]').val(scenario_id);
    $('#load-ebsd-data-modal .alert').remove()
})

$(document).on('click', '#load-ebsd-data-button', function(){

    $("#load-ebsd-data-button i").removeClass('hidden')

    var success = function(resp){
        $("#load-ebsd-data-modal i").addClass('hidden')
        $("#load-ebsd-data-modal .modal-body").prepend(
                            "<div class='alert alert-success'>Data Imported Successfully</div>")
        
    }

    var error = function(resp){
        r = JSON.parse(resp.responseText)
        $("#load-ebsd-data-modal i").addClass('hidden')
        $("#load-ebsd-data-modal .modal-body").prepend(
                            "<div class='alert alert-danger'>An error has occurred: "+r.Error+"</div>")
        
    }

    var form_data = new FormData($('#load-ebsd-data-form')[0])
   // data.append('scenario_id', $('#load-ebsd-data-form input[name=scenario_id]').val())
   // data.append('data_file', $('#load-ebsd-data-form input[name=data_file]').val())

    $.ajax({
        type: 'POST',
        url: upload_ebsd_data_url,
        data: form_data, 
        processData: false,
        type: 'post',
        contentType: false,
        cache: false,
        success: success,
        error: error
    })
    
})


$(document).on('click', '#run-ebsd-model-button', function(){

    $("#run-ebsd-model-button i.fa-spin").removeClass('hidden')
    $("#run-ebsd-model-button i.fa-play").addClass('hidden')

    var success = function(resp){
        $("#run-ebsd-model-button i.fa-spinner").addClass('hidden')
        $("#run-ebsd-model-button i.fa-play").removeClass('hidden')
        $('#run-ebsd-modal').modal('hide')
        poll_jobs()
    }

    var error = function(resp){
        $("#run-ebsd-model-button i.fa-spinner").addClass('hidden')
        $("#run-ebsd-model-button i.fa-play").removeClass('hidden')
        try{
            r = JSON.parse(resp.responseText)
            text = r.error
        }catch{
            text = "Unknown error.";
        }
        $("#run-ebsd-model-button .modal-body").prepend(
                            "<div class='alert alert-danger'>An error has occurred: "+text+"</div>")
        
    }

    var form_data = new FormData($('#run-ebsd-model-form')[0])
   // data.append('scenario_id', $('#load-ebsd-data-form input[name=scenario_id]').val())
   // data.append('data_file', $('#load-ebsd-data-form input[name=data_file]').val())

    $.ajax({
        type: 'POST',
        url: run_ebsd_model_url,
        data: form_data, 
        processData: false,
        type: 'post',
        contentType: false,
        cache: false,
        success: success,
        error: error
    })
    
})

$(document).on('click', '#get-ebsd-results', function(){
 
    soln_id = $('#solution-select').val();

    window.location.href=get_ebsd_results_url + "/scenario/" + scenario_id + "/solution/" + soln_id;

})


/*Look for the 'COST' attribute on the network and use it to find
* the solution names, and their respective costs*/
function update_solution_select()
{
    $( "#solution-select" ).empty();

    var error = function(resp) {
       // alert('Unexpected error');
    }

    var success = function(data, status, request) {
        var resp = JSON.parse(data)
        var rs_list = resp.resourcescenarios
        var attr_map = resp.attr_id_name_map
        
        for (var attr_id in rs_list){
            if (attr_map[attr_id] == 'COST'){
                var costval = JSON.parse(rs_list[attr_id].dataset.value)
                var costs = Object.values(costval)[0]
                var soln_names = Object.keys(costs)
                soln_names.sort()
                var solns = []
                for (var i=0; i<soln_names.length; i++){
                    //Set a default of the first (optimal) solution
                    if (i == 0){current_solution=soln_names[i]}
                    var soln_name = soln_names[i]
                    solns.push({'name': soln_name, 'cost':costs[soln_name]})
                }
                var s = d3.select('#solution-select') 
                s.selectAll('option').data(solns)
                .enter()
                .append('option')
                .attr('value', function(d, i){
                  return d.name
                })
                .text(function(d, i){
                    return d.name + " (" + d.cost.toFixed(2) + ")"
                })
                break
            }
        }

        $('#solution-select').selectpicker('refresh')
        
    }

    var pars=
    {
        network_id: network_id,
        scenario_id: scenario_id,
        res_id: network_id,
        resource_type:'NETWORK',
        raw : 'Y',
    };

    $.ajax({
        type: 'POST',
        url: get_resource_data_url,
        data:  JSON.stringify(pars),
        success: success,
        error:error,
    });

}

$(document).ready(update_solution_select)


$(document).on('change', '#solution-select', function(){
    current_solution = $(this).val();
})


