$(document).ready(function(){


    $('#templatetable .typeattrs.selectpicker').selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 


    $('#templatetable .selectpicker').selectpicker({
    }); 

    
})

$(document).on('click', "#addnodetype", function(event){
    event.preventDefault(); 

    var nodetyperow = $("#nodetypetemplate tr:first").clone();

    nodetyperow.addClass('nodetype');
    $("select",nodetyperow).addClass('selectpicker');
    
    $("#templatetable tbody.nodetypes").append(nodetyperow);

    $('.typeattrs.selectpicker', nodetyperow).selectpicker({
        liveSearch:true
    }); 

    $('.selectpicker', nodetyperow).selectpicker({
    }); 

})

$(document).on('click', "#addlinktype", function(event){
    event.preventDefault(); 

    var linktyperow = $("#linktypetemplate tr:first").clone();
    $("select",linktyperow).addClass('selectpicker');

    linktyperow.addClass('linktype');
    
    $("#templatetable tbody.linktypes").append(linktyperow);

    $('.typeattrs.selectpicker', linktyperow).selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 
    $('.selectpicker', linktyperow).selectpicker({
    }); 



})
$(document).on('click', "#addgrouptype", function(event){
    event.preventDefault(); 

    var grouptyperow = $("#grouptypetemplate tr:first").clone();
    $("select",grouptyperow).addClass('selectpicker');

    grouptyperow.addClass('grouptype');
    
    $("#templatetable tbody.grouptypes").append(grouptyperow);

    $('.typeattr .selectpicker', grouptyperow).selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 
    $('.selectpicker', grouptyperow).selectpicker({
    }); 


})

$(document).on('change', 'select.data_types', function(event){

    var typeattr = $(this).closest(".attributedetail");

    var data_type = $(this).val();

    var val_input = $('input[name="value"]', typeattr);

    val_input.removeClass('descriptor scalar array timeseries');

    val_input.addClass(data_type);
    
    updateInputs()

})

$(document).on('change', 'select.typeattrs', function(event){


    var row = $(this).closest('.resourcetype');
    
    var attrdetails = $("tbody.attributedetails", row);

    var selected = $(this).val()

    if (selected == null){selected = []}


    //First remove any de-selected attribute rows
    $('tr.attributedetail', attrdetails).each(function(){
         var this_id = $('input[name="attr_id"]', $(this)).val()
         if (selected.indexOf(this_id) == -1){
            $(this).remove()
         }
    })

    for (var i=0; i<selected.length; i++){

        var attr_id = selected[i]
        var attr = $("option[value="+attr_id+"]", row)
        var attr_name   = attr.text()
        
        var attr_row = $(".attributedetail.attr-"+attr_id, row)

        if (attr_row.length == 0){
            var row_tmpl = $("#attrdetailstemplate tr.attributedetail").clone();
            row_tmpl.addClass('attr-'+attr_id);
        
            $('td.attr-name', row_tmpl).text(attr_name);
            $('input[name="attr_name"]', row_tmpl).val(attr_name);
            $('input[name="attr_id"]', row_tmpl).val(attr_id);

            attrdetails.append(row_tmpl)
        }
    }

})

$(document).on("click", "#save-template-button", function(event){

    event.preventDefault();

    var formdata = $("#templatetable").serializeArray();
    var data = {
        id:template_id,
        name: $("input[name='template_name']").val(),
        description: $("input[name='template_description']").val(),
        types: []
    }

    $("#templatetable .resourcetype").each(function(){
        var row = this;
        var templatetype = {
            template_id:template_id
        }
        var type_id=null;
        if ($(this).attr('id') != undefined){
            templatetype['id'] = type_id 
            type_id=$(this).attr('id');
        }
        templatetype['id'] = type_id 

        var t = $(this)
        if (t.hasClass("nodetype")){
            templatetype.resource_type = 'NODE'
        }else if(t.hasClass("linktype")){
            templatetype.resource_type = 'LINK'
        }else if(t.hasClass("grouptype")){
            templatetype.resource_type = 'GROUP'
        }else if(t.hasClass("networktype")){
            templatetype.resource_type = 'NETWORK'
        }

        $("input",this).each(function(){
            var name = $(this).attr('name') 
            var value = $(this).val() 
            templatetype[name] = value

        })
        
        var layout = getLayout(row)

        templatetype.layout = JSON.stringify(layout)

        var typeattrs = []
        $(".typeattrs option:selected",this).each(function(){
            var attr_id = $(this).val()
            var ta = {'attr_id':attr_id}
            if (type_id != null){ta['type_id'] = type_id}

            var details = $('.attr-'+attr_id, row)
            var datatype = $('.data_types option:selected', details)
            if (datatype.length > 0){
                ta['data_type'] = datatype.val()
            }

            default_value = getDefaultValue(attr_id, row)
            if (default_value != null){
                ta['default_dataset_id'] = default_value.dataset_id
            }

            var details = $('.attr-'+attr_id, row)
            var is_var = $(".attr-"+attr_id+" input[name='is_var']", row)

            if (is_var.prop('checked') == true){
                ta['is_var'] = 'Y'
            }else{
                ta['is_var'] == 'N';
            }

            typeattrs.push(ta)
        })
        templatetype.typeattrs = typeattrs
        
        data.types.push(templatetype)
    })
    
    var success = function(resp){
        $("#close-create-attr-button").click() 
        var newtmpl = JSON.parse(resp)
        location.href="/template/"+newtmpl.template_id
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }

    $.ajax({
        url:   save_template_url,
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})

var getDefaultValue = function(attr_id, row){
    var defaultDataset = null

    var details = $('.attr-'+attr_id, row)
    var datatype = $('.data_types option:selected', details)
    var default_val = $(".dataset input[name=value]", details)
    var metadata = $(".dataset input[name=metadata]", details)

    if (default_val.length > 0 && default_val.val() != ""){


        defaultDataset = createDataset({
            type     : datatype.val(),
            value    : default_val.val(),
            metadata : metadata.val(),
        })

    }

    return defaultDataset

}

var getLayout = function(element){
    var layout = {}
    var color = $(".colorpicker", element).val()
    if (color != undefined){
        layout['color'] = color
    }
    var shape = $('.shapeselector option:selected', element).attr('name')
    if (shape != undefined){
        layout['shape'] = shape;
    }
    var linestyle = $('.linestyle option:selected', element).attr('name')
    if (linestyle != undefined){
        layout['linestyle'] = linestyle;
    }
    var width = $('.linewidth', element).val()
    if (width != undefined){
        layout['width'] = width;
    }

    return layout
}

$(document).on('click', '.toggleattributedetails', function(){
    
    var s = $('span', this)

    var resourcerow = $(this).closest('tr');

    if (s.hasClass('glyphicon-chevron-right'))
        {
            $('span', this).removeClass('glyphicon-chevron-right')
            $('span', this).addClass('glyphicon-chevron-down')
            $('.attributedetails', resourcerow).show()
        }else{
            $('span', this).removeClass('glyphicon-chevron-down')
            $('span', this).addClass('glyphicon-chevron-right')
            $('.attributedetails', resourcerow).hide()
        }


})

$(document).on('click', ".togglesection", function(){
    
    var tbody = $(this).closest('tbody')


    $('.resourcetype', tbody).toggle()
    
    var icon = $('span', this)

    if (icon.hasClass('fa-plus')){
        icon.removeClass('fa-plus')
        icon.addClass('fa-minus')
    }else{
        icon.removeClass('fa-minus')
        icon.addClass('fa-plus')
    }

})
