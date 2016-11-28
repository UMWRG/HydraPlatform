
var createDataset = function(dataset){
    var new_dataset = null
    var success = function(resp){
        new_dataset = JSON.parse(resp)
    }

    var error = function(e){
        alert("An error has occurred adding the dataset:"  +e.message)
    }

    $.ajax({
        url:   add_dataset_url,
        data : JSON.stringify(dataset),
        success: success,
        error: error,
        method:'POST',
        async: false,
    })
    return new_dataset
}


$(document).on('ready', function(){

    //Find all dataset input fields and convert them to buttons or other input types if necessary
    //
    
    insertModals()

    updateInputs();


})

var updateInputs = function(element){
    //Find all input elements with a dataset class. If they have an array
    //or timeseries (or other complex type), hide the input and display an 'edit'
    //button instead. This displays a modal with the value formatted appropriately, which when saved, saves the value as text back into the text input field.

    if (element == undefined){
        element = $('body');
    }
    
    $('.dataset').each(function(){
        var valueinput = $("input[name='value']", this)

        if (valueinput.hasClass('timeseries')){
            valueinput.hide();

            $(this).append('<button class="btn btn-outline-primary btn-sm" data-toggle="modal" data-target="#ts-editor"><span class="fa fa-area-chart"></span></button>')
        }else if (valueinput.hasClass('array')){
            valueinput.hide();
            $(this).append('<button class="btn btn-outline-primary btn-sm" data-toggle="modal" data-target="#array-editor"><span class="fa fa-th"></span></button>')
        }
    })

}

var insertModals = function(){

    $('body').append(ts_modal)
    $('body').append(array_modal)

}


var ts_modal = `
<div class="modal fade" tabindex="-1" role="dialog" id="ts-editor">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title"></h4>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary save">Save</button>
      </div>
    </div><!-- /.modal-content -->
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->`;

var array_modal = `
<div class="modal fade" tabindex="-1" role="dialog" id="array-editor">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title"></h4>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="" class="btn btn-primary save">Save</button>
      </div>
    </div><!-- /.modal-content -->
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->`;


