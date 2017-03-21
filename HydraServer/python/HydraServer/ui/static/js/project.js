
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

$(document).on('click', '.delete-btn', function(){

    var net_btn = $(this).closest('li')
    var network_name = $('div.head', net_btn).text().trim()
    var network_id = net_btn.attr('id').split('_')[1]
    $('#network-id-input').attr('value', network_id)
    $('#network-name').attr('value', network_name)

    var net_modal = $('#delete_network_modal')

    var heading = $('.name', net_modal).each(function(){
        $(this).text(network_name);
    })

})

$(document).on("click", "#delete-network-button", function(event){

    event.preventDefault();

    var formdata = $("#delete-network").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    var success = function(resp){
        $("#delete_network_modal").modal('hide')
        $("#network_"+data['network_id']).remove()
        var text = "\
            <div class='alert alert-success alert-dismissable' role='alert'>\
                <button type='button' class='close' data-dismiss='alert' aria-label='Close'>\
                    <span aria-hidden='true'>&times;</span>\
                </button>\
                <strong>network"+data['network_name']+" Removed </strong>\
        </div>"

        $('#networklist').prepend(text)
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }


    $.ajax({
        url: delete_network_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
