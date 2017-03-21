$(document).on('change', '#template-choice', function(){

    if($(this).val() == 'external'){
        $("#import_form").show()
    }else{
        $("#import_form").hide()
    }

})



$(document).on('click', "#go-add-template", function(e){

    e.preventDefault()

    if($('#template-choice').val() == 'external'){
        loadTemplate();
    }else{
        goNewTemplate();
    }
});


var loadTemplate = function(){
   
    var success = function(resp){
        //resp is the new template's ID
        window.location.href = go_template_url + resp 
    }

    var error = function(resp){
        $('#template-choice').append("<div style='color:red'>An error has occurred</div>")
    }

    var form_data = new FormData($('#import_form')[0]);

    $.ajax({
        type: 'POST',
        url: load_template_url,
        data: form_data,
        contentType: false,
        processData: false,
        success: success,
        error: error
    })
}

var goNewTemplate = function(){

    window.location.href = go_new_template_url; 

}

