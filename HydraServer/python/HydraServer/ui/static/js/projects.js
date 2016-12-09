
$(document).ready(function() {
     $("#export_data").hide();
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
