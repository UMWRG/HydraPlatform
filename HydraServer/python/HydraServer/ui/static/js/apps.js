var cur_name=null;
 function add_fileselect_event () {
  // attach the `fileselect` event to all file inputs on the page
  $(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  // We can watch for our custom `fileselect` event like this
  $(document).ready( function() {
      $(':file').on('fileselect', function(event, numFiles, label) {

          var input = $(this).parents('.input-group').find(':text'),
              log = numFiles > 1 ? numFiles + ' files selected' : label;

          if( input.length ) {
              input.val(log);
          } else {
              if( log ) alert(log);
          }
      });
  });
}
function run_apps (){
    $('#CSVFormSubmit').click(function(e){
      e.preventDefault();
      var form_data = new FormData($('#import_form')[0]);
      vars=getUrlVars();
      //alert(vars);
      form_data.append('network_id', vars['network_id']);
      form_data.append('scenario_id', vars['scenario_id']);
      $.ajax({
                    type: 'POST',
                    url: '/import_uploader',
                    data: form_data,
                    contentType: false,
                    cache: false,
                    processData: false,
                    async: false,
                    success: function(data, status, request) {
                    $(status_pan).show();
                    $(help_message).hide();
                    error = request.getResponseHeader("Error");
                    if(error!=null)
                    {
                        $(_message).text('Error: '+error);
                    }
                    else
                    {
                       status_url = request.getResponseHeader('Address');
                       if(status_url!=null)
                           update_progress_2(status_url);
                    }
                      },
                    error: function() {
                        alert('Unexpected error');
                    }
                });
      // alert ('Good bye');
    });
}

function update_progress_2(status_url) {
            // send GET request to status URL
            $.getJSON(status_url, function(data) {
                // update UI
                value = parseInt(data['current'] * 100 / data['total']);
                $("#import_progress_bar")
                      .css("width", value + "%")
                      .attr("aria-valuenow", value)
                      .text(value + "%");
           $(_message).text(data['status']);
                if (data['status'] != 'Pending' && data['status'] != 'Running')
                {
                    if(data['status'].length==3)
                    {
                    result=data['status'][0];
                    network_id=data['status'][1];
                    scenario_id=data['status'][2];

                    message=result+". Opening network (id= "+network_id+"), and scenario (id="+scenario_id+")";
                    $(_message).text(message);
                    setTimeout(function() {
                    pars={'network_id': network_id, 'scenario_id':scenario_id};
                    $( "#importModal" ).modal('hide');
                       window.location.href = '/network?network_id='+network_id+'&scenario_id='+scenario_id;

                    }, 3000);
                }
                else
                    {
                     $(_message).text(data['status']);
                    }
                }
                else {
                    // rerun in 1 second
                    setTimeout(function() {
                        update_progress_2(status_url);

                    }, 1000);
                }
            });
        }

function import_csv ()
{
 $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
    $(status_pan).hide();
     $("#help_message").show();
     $(_message).text("");
     //$("#import_file")..attr('name', 'csv_file');
    $('input:file[name="import_file"]').attr('name', 'csv');
    cur_name='csv';
    $("#help_").text("Please upload the network zip file which contains all the required csv files. The network file name needs to be “network.csv");
    $ ("#import_title").text("Import Hydra network from CSV files");
    $( "#importModal" ).modal('show')
}

function import_excel ()
{
 $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");

$(status_pan).hide();
    $("#help_message").show();
    $(_message).text("");
    $('input:file[name="import_file"]').attr('name', 'excel');
    cur_name='excel';
    $("#help_").text("Please upload the zip file which contains Excel file and template file.");
    $ ("#import_title").text("Import Hydra network from Excel");
    $( "#importModal" ).modal('show')
}

function import_pywr ()
{
     $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
    $(status_pan).hide();
    $("#help_message").show();
    $(_message).text("");
    $('input:file[name="import_file"]').attr('name', 'pywr');
    cur_name='pywr';
    $("#help_").text("Please upload the network zip which contains the Json pywr file and data files. The json file name needs to be “pywr.json ”");
    $ ("#import_title").text("Import Hydra network from Pywr JSON");
    $( "#importModal" ).modal('show')
}

function runModel()
   {
    $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#help_message").show();
   $(_message).text("");
   $('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='run_model';
   $("#help_").text("Please upload the file which contains the GAMS code");
   $ ("#import_title").text("Run GAMS model");
   $( "#importModal" ).modal('show')
   }



  function cancel_app()
  {
  if(cur_name!=null)
  {
    $('input:file[name="'+cur_name+'"]').attr('name', 'import_file');
    cur_name=null;

  }
     $( "#importModal" ).modal('hide')

  }
