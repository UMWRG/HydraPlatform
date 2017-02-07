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

$(document).on('click', '.share-btn', function(){
    
    var proj_btn = $(this).closest('li')
    var project_name = $('div.head', proj_btn).text().trim()
    var project_id = proj_btn.attr('id').split('-')[1]
    $('#share-project-id').attr('value', project_id)
    $('#share-project-name').attr('value', project_name)

    var proj_modal = $('#share_project_modal')

    var heading = $('.name', proj_modal).each(function(){
        $(this).text(project_name);
    })

})

$(document).on("click", "#share-project-button", function(event){

    event.preventDefault();
    
    var formdata = $("#share-project").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    data['usernames'] = $("#share-usernames").select2("val")

    var success = function(resp){
        $("#share_project_modal").modal('hide')
        var text = "\
            <div class='alert alert-success alert-dismissable' role='alert'>\
                <button type='button' class='close' data-dismiss='alert' aria-label='Close'>\
                    <span aria-hidden='true'>&times;</span>\
                </button>\
                <strong>Project"+data['project_name']+" Shared </strong>\
        </div>"

        $('#projectlist').prepend(text)
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }

    
    $.ajax({
        url: share_project_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
