var cur_name=null;

// attach the `fileselect` event to all file inputs on the page
$(document).on('change', ':file', function() {
var input = $(this),
    numFiles = input.get(0).files ? input.get(0).files.length : 1,
    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
input.trigger('fileselect', [numFiles, label]);
});

// custom `fileselect` event like this
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

$(document).on('click', '#runApp', function(e){
  e.preventDefault();
  run();
});

function run(){

      var form_data = new FormData($('#import_form')[0]);
      
      //These are only applicable in certain cases
      if (this.hasOwnProperty('network_id') == true){
          form_data.append('network_id', network_id);
      }
      if (this.hasOwnProperty('scenario_id') == true){
          form_data.append('scenario_id', scenario_id);
        }
      if (this.hasOwnProperty('project_id') == true){
          form_data.append('project_id', project_id);
        }

      form_data.append('app_name',cur_name);
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
                        {
                         directory = request.getResponseHeader('directory');
                           update_progress_2(status_url, directory);
                         }
                    }
                      },
                    error: function() {
                        alert('Unexpected error');
                    }
                });
}

function update_progress_2(status_url, directory) {
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
                    if(cur_name.indexOf('ex') !=0)
                    {
                        message=result+". Loading network (id= "+network_id+"), and scenario (id="+scenario_id+")";
                        $(_message).text(message);
                        setTimeout(function() {
                        pars={'network_id': network_id, 'scenario_id':scenario_id};
                        $( "#importModal" ).modal('hide');
                       //window.location.href = '/network?network_id='+network_id+'&scenario_id='+scenario_id;
                       window.location.href = '/network/'+network_id;

                    }, 3000);
                    }
                    else
                    {
                           var _data = new FormData();
                             _data.append('network_id', network_id);
                                _data.append('scenario_id', scenario_id);
                       var pars=
       {
            'network_id': network_id,
            'scenario_id':scenario_id,
            'directory': directory
        };
 $( "#importModal" ).modal('hide');
 ////////////////////////////////////
 var url = '/send_zip_files';


// add a form hide the div, write the form
$('#temp_').hide()
    .html('<form id="exportform" action="' + url + '" target="_blank" method="get">'
        + '<textarea name="pars">' + JSON.stringify(pars)  +'</textarea>'
        + '</form>');

// submit the form
$('#exportform').submit();
                    }
                }
                else
                    {
                     $(_message).text(data['status']);
                    }
                }
                else {
                    // rerun in 1 second
                    setTimeout(function() {
                        update_progress_2(status_url, directory);
                    }, 1000);
                }
            });
        }

function import_csv(){
    alert("Hellllooooooo");
    $("#runApp").show();
    $("#browse_div").show();

    $('#import_form')[0].reset();
    $("#runApp").prop("value", "Upload");

    $("#import_progress_bar")
                  .css("width", 0 + "%")
                  .attr("aria-valuenow", 0)
                  .text(0 + "%");
    $(status_pan).hide();
    $("#help_message").show();
    $(_message).text("");

    cur_name='csv';

    $("#help_").text("Please upload the network zip file which contains all the required csv files. The network file name needs to be “network.csv");
    $ ("#import_title").text("Import Hydra network from CSV files");
    $( "#importModal" ).modal('show')
}

function import_excel ()
{
    $("#runApp").show();
     $("#browse_div").show();

    $('#import_form')[0].reset();
    $("#runApp").prop("value", "Upload");
    $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");

    $(status_pan).hide();
    $("#help_message").show();
    $(_message).text("");
    cur_name='excel';
    $("#help_").text("Please upload the zip file which contains Excel file and template file.");
    $ ("#import_title").text("Import Hydra network from Excel");
    $( "#importModal" ).modal('show')
}

function import_pywr ()
{
    $("#runApp").show();
     $("#browse_div").show();

    $("#runApp").prop("value", "Upload");

    $('#import_form')[0].reset();
    $("#import_progress_bar")
                          .css("width", 0 + "%")
                          .attr("aria-valuenow", 0)
                          .text(0 + "%");
    $(status_pan).hide();
    $("#help_message").show();
    $(_message).text("");
    cur_name='pywr';
    $("#help_").text("Please upload the network zip which contains the Json pywr file and data files. The json file name needs to be “pywr.json ”");
    $ ("#import_title").text("Import Hydra network from Pywr JSON");
    $( "#importModal" ).modal('show')
}

function runPywrApp (){
    $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#runApp").hide();
   $("#browse_div").hide();
   $("#help_message").show();
   $(_message).text("");
   //$('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='run_pywr_app';
   $("#help_").text("Run pywr App and extract the results ");
   $ ("#import_title").text("Run Pywr App");
   //$ ("#import_title").hide();
   $("#importModal" ).modal('show')
   run();
}

function runGamsModel(){
    $("#browse_div").show();
    $("#runApp").show();
    $("#runApp").prop("value", "Run");
    $('#import_form')[0].reset();
    $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#help_message").show();
   $(_message).text("");
   //$('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='run_gams_model';
   $("#help_").text("Please upload the file which contains the GAMS code");
   $ ("#import_title").text("Run GAMS model");
   $( "#importModal" ).modal('show')
}

function cancel_app(){
    if(cur_name!=null){
        cur_name=null;
    }
    $( "#importModal" ).modal('hide');
}

function export_csv()
{

 $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#runApp").hide();
   $("#browse_div").hide();
   $("#help_message").show();
   $(_message).text("");
   //$('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='ex_csv';
   $("#help_").text("Downloading the NETWORK CSV files ");
   $ ("#import_title").text("Export to CSV");
   //$ ("#import_title").hide();
   $("#importModal" ).modal('show')
   run();
}

function export_excel()
{
 $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#runApp").hide();
   $("#browse_div").hide();
   $("#help_message").show();
   $(_message).text("");
   //$('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='ex_excel';
   $("#help_").text("Downloading the NETWORK Excel file ");
   $ ("#import_title").text("Export to Excel");
   //$ ("#import_title").hide();
   $("#importModal" ).modal('show')
   run();
}

function export_pywr()
{
 $("#import_progress_bar")
                      .css("width", 0 + "%")
                      .attr("aria-valuenow", 0)
                      .text(0 + "%");
   $(status_pan).hide();
   $("#runApp").hide();
   $("#browse_div").hide();
   $("#help_message").show();
   $(_message).text("");
   //$('input:file[name="import_file"]').attr('name', 'run_model');
   cur_name='ex_pywr';
   $("#help_").text("Downloading the json pywr file ");
   $ ("#import_title").text("Export to Pywr JSON");
   //$ ("#import_title").hide();
   $("#importModal" ).modal('show')
   run();
}


function startsWith(string_name,starter) {
    if (string_name.length < starter.length){
        return false;
    }

    for (var i = 0; i < starter.length; i++) {
        if (string_name[i] != starter[i]) {
            return false;
        }
    }
    return true;
}
