
$(document).ready(function() {
    //$("#export_data").hide();
    //$("#import_data").hide();
    $("#data_exporter_importer").prop('disabled', true);
})

$(document).on("click", "#create-project-button", function(event){

    event.preventDefault();

    var success = function(resp){
        $("#close-create-project-button").click() 
        var new_project = JSON.parse(resp)

        window.location.href=go_project_url + new_project.project_id
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }


    var formdata = $("#create-project").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }
    
    var typ = $("#project-template option:selected").val()

    if (typ == ""){
        error("Please select the type of project yo would like to create")
    }else{
        data['types'] = [{id:typ}]
    }

    $.ajax({
        url: add_project_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})

$(document).on('click', '.delete-btn', function(){
    
    var proj_btn = $(this).closest('li')
    var project_name = $('div.head', proj_btn).text().trim()
    var project_id = proj_btn.attr('id').split('-')[1]
    $('#project-id-input').attr('value', project_id)
    $('#project-name').attr('value', project_name)

    var proj_modal = $('#delete_project_modal')

    var heading = $('.name', proj_modal).each(function(){
        $(this).text(project_name);
    })

})

$(document).on("click", "#delete-project-button", function(event){

    event.preventDefault();
    
    var formdata = $("#delete-project").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    var success = function(resp){
        $("#delete_project_modal").modal('hide')
        $("#project-"+data['project_id']).remove()
        var text = "\
            <div class='alert alert-success alert-dismissable' role='alert'>\
                <button type='button' class='close' data-dismiss='alert' aria-label='Close'>\
                    <span aria-hidden='true'>&times;</span>\
                </button>\
                <strong>Project"+data['project_name']+" Removed </strong>\
        </div>"

        $('#projectlist').prepend(text)
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }

    
    $.ajax({
        url: delete_project_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
