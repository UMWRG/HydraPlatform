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
