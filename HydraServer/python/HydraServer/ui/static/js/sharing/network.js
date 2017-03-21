$(document).ready(function(){

  $("#share-usernames").select2({
    placeholder: "Type the username of the recipients",
    ajax: {
      url: get_usernames_like_url,
      width: 'element',
      type: 'POST',
      dataType: 'json',
      delay: 250,
      data: function (params) {
        return {
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function (data) {
        // parse the results into the format expected by Select2
        // since we are using custom formatting functions we do not need to
        // alter the remote JSON data, except to indicate that infinite
        // scrolling can be used
        //params.page =  1;

        return {
          results: data,
         // pagination: {
         //   more: (params.page * 30) < data.total_count
         // }
        };
      },
      cache: true
    },
    escapeMarkup: function (markup) { return markup; }, // let our custom formatter work
    minimumInputLength: 3,
    //templateResult: formatRepo, // omitted for brevity, see the source of this page
    //templateSelection: formatRepoSelection // omitted for brevity, see the source of this page
  });
});

$(document).on('click', '.share-btn', function(e){
    e.preventDefault();
    var net_btn = $(this).closest('li')
    var network_name = $('div.head', net_btn).text().trim()
    var network_id = net_btn.attr('id').split('_')[1]
    $('#share-network-id').attr('value', network_id)
    $('#share-network-name').attr('value', network_name)

    var net_modal = $('#share_network_modal')

    var heading = $('.name', net_modal).each(function(){
        $(this).text(network_name);
    })

})

$(document).on("click", "#share-network-button", function(event){
    console.log("Sharing network")
    event.preventDefault();
    event.stopPropagation();

    var formdata = $("#share-network").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    data['usernames'] = $("#share-usernames").select2("val")

    var success = function(resp){
        $("#share_network_modal").modal('hide')
        var text = "\
            <div class='alert alert-success alert-dismissable' role='alert'>\
                <button type='button' class='close' data-dismiss='alert' aria-label='Close'>\
                    <span aria-hidden='true'>&times;</span>\
                </button>\
                <strong>Network "+data['network_name']+" Shared </strong>\
        </div>"

        $('#networklist').prepend(text)
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }


    $.ajax({
        url: share_network_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
