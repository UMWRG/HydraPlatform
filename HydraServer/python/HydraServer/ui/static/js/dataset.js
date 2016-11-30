
var defaultdata =[
['Time', 'Value'],
['', '']
] 

var tpl = ['', '']

var hot = null;

var currentVal = null;

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

            $(this).append('<button class="btn btn-outline-primary btn-sm ts-edit" data-toggle="modal" data-target="#ts-editor"><span class="fa fa-pencil"></span></button>')

            if (valueinput.val() == ""){
                $(this).append('<button class="btn btn-outline-primary btn-sm ts-edit" data-toggle="modal" data-target="#ts-editor" disabled><span class="fa fa-area-chart"></span></button>')
            }else{
                $(this).append('<button class="btn btn-outline-primary btn-sm ts-edit" data-toggle="modal" data-target="#ts-editor"><span class="fa fa-area-chart"></span></button>')
            }
        }else if (valueinput.hasClass('array')){
            valueinput.hide();
            $(this).append('<button class="btn btn-outline-primary btn-sm arr-edit" data-toggle="modal" data-target="#array-editor"><span class="fa fa-pencil"></span></button>')
        }
    })

}

function isEmptyRow(instance, row) {
    var rowData = instance.getData()[row];

    for (var i = 0, ilen = rowData.length; i < ilen; i++) {
      if (rowData[i] !== null) {
        return false;
      }
    }

    return true;
}

function defaultValueRenderer(instance, td, row, col, prop, value, cellProperties){
    var args = arguments;

    if (args[5] === null && isEmptyRow(instance, row)) {
      args[5] = tpl[col];
      td.style.color = '#999';
    }
    else {
      td.style.color = '';
    }

    Handsontable.renderers.TextRenderer.apply(this, args);

}


var renderTimeseries = function(btn){

    var datasetcontainer = $(btn).closest('.dataset')

    currentVal = $('input.timeseries', datasetcontainer)

    var valuetext = currentVal.val()

    if (valuetext == ''){
        data = defaultdata;
    }else{
        data = tsToHot(valuetext)
    }
    var container = document.getElementById("ts-edit-inner");

    hot = new Handsontable(container, {
        data: data.slice(1, data.length), 
        rowHeaders: true,
        colHeaders: data[0],
        contextMenu: true,
        stretchH: "all",
        contextMenuCopyPaste: true,
        columns: [
        {
            type: 'date',
            dateFormat: 'DD/MM/YY',
            strict: false,
            defaultDate: '01/01/16',
        },
        {},
        ]
    });


    $(document).off('focusin.bs.modal');

      /*  startRows: 8,
        startCols: 5,
        minSpareRows: 1,
        cells: function (row, col, prop) {
          var cellProperties = {};

          cellProperties.renderer = defaultValueRenderer;

          return cellProperties;
        },
        beforeChange: function (changes) {
          var instance = hot1,
            ilen = changes.length,
            clen = instance.colCount,
            rowColumnSeen = {},
            rowsToFill = {},
            i,
            c;

          for (i = 0; i < ilen; i++) {
            // if oldVal is empty
            if (changes[i][2] === null && changes[i][3] !== null) {
              if (isEmptyRow(instance, changes[i][0])) {
                // add this row/col combination to cache so it will not be overwritten by template
                rowColumnSeen[changes[i][0] + '/' + changes[i][1]] = true;
                rowsToFill[changes[i][0]] = true;
              }
            }
          }
          for (var r in rowsToFill) {
            if (rowsToFill.hasOwnProperty(r)) {
              for (c = 0; c < clen; c++) {
                // if it is not provided by user in this change set, take value from template
                if (!rowColumnSeen[r + '/' + c]) {
                  changes.push([r, c, null, tpl[c]]);
                }
              }
            }
          }
        }
      })*/

}

$(document).on('click', '#ts-editor .save', function(event){
    
    var hot_data = hot.getData()
    var headers = hot.getColHeader()

    var ts_data = hotToTs();

    console.log(ts_data)
    
    currentVal.val(JSON.stringify(ts_data))

    $('#ts-editor').modal('hide')

})



//Make the year drop-down work inside a bootstrap modal.
$(document).on('focus', '.pika-select-year', function(event){
    event.stopPropagation()
})



var renderArray = function(){
    alert('Not implemented yet.')
}

var tsToHot = function(valuetext){
    var ts = JSON.parse(valuetext)
    var hot_data = [['Time']]
    var idx = 1; //keeps track of the rows, which will be built up as we go thorugh the timeseries. starts at 1 because header is at row 0
    for (var col in ts){
        hot_data[0].push(col)
        for (var t in ts[col]){
            var v = ts[col][t]

            if (idx == 1){
                hot_data.push([t, v])// Add time and value
            }else{
                hot_data[idx].push(v)//No need for the time as it's already there.
            }
            
        }
        idx++;
    }

    return hot_data
}

var hotToTs = function(){
    var hot_data = hot.getData()
    var headers = hot.getColHeader()

    //Remove the 'time' column, to leave only the data columns
    headers = headers.slice(1, headers.length)

    var data_columns = headers.slice(1, headers.length)

    var ts_data = {}

    for (var i=0; i<headers.length; i++){
        ts_data[headers[i]] = {}
    }

    for (var i=0; i<hot_data.length; i++){
        //Get the time
        var t = hot_data[i][0]

        //Get all subsequent columns
        var d = hot_data[i].slice(1, hot_data[i].length)
    
        for (var j=0; j<d.length; j++){
            var val = d[j]
            ts_data[headers[j]][t] = val
        }
        
    }

    return ts_data

}

$(document).on('click', '.dataset .ts-edit', function(){
    var btn = this;
    setTimeout(function(){renderTimeseries(btn)}, 300)

    
})

$(document).on('click', '.dataset .arr-edit', renderArray)

var insertModals = function(){

    $('body').append(ts_modal)
    $('body').append(array_modal)
    
    $('#ts-editor').on('hidden.bs.modal', function (e) {
        hot.destroy()

    })

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
        <div class="ts_outer">
            <div class='ts_inner' id='ts-edit-inner'>
            </div>
        </div> <!-- ts outer -->
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
        <div class="ts_outer">
            <div class='ts_inner'>
            <div>
        </div> <!-- ts outer -->
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="" class="btn btn-primary save">Save</button>
      </div>
    </div><!-- /.modal-content -->
  </div><!-- /.modal-dialog -->
</div><!-- /.modal -->`;


