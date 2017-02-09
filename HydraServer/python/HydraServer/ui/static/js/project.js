
$(document).ready(function() {
     $("#export_data").hide();
})

$(document).on("click", "#create-network-button", function(event){

    event.preventDefault();

    var success = function(){
        $("#close-create-network-button").click()
        location.reload()
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }


    var formdata = $("#create-network").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    var typ = $("#network-template option:selected").val()

    if (typ == ""){
        error("Please select the type of network yo would like to create")
    }else{
        data['types'] = [{id:typ}]
    }

    $.ajax({
        url: add_network_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
