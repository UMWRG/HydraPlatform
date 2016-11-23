$(document).ready(function(){
    $('#templatetable .typeattrs .selectpicker').selectpicker({
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

    $('.selectpicker .typeattrs', nodetyperow).selectpicker({
       // style: 'btn-info',
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

    $('.selectpicker .typeattrs', linktyperow).selectpicker({
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

    $('.selectpicker .typeattrs', grouptyperow).selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 
    $('.selectpicker', grouptyperow).selectpicker({
    }); 


})

$(document).on("click", "#create-attr-button", function(event){

    event.preventDefault();

    var formdata = $("#create-attr").serializeArray();
    var data = {}
    for (var i=0; i<formdata.length; i++){
        var d = formdata[i]
        data[d['name']] = d['value']
    }

    var success = function(){
        $("#close-create-attr-button").click() 
        location.reload()
    }

    var error = function(e){
        alert("An error has occurred:"  +e.message)
    }

    $.ajax({
        url: "/create_attr",
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

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
        
        var layout = {}
        var color = $(".colorpicker", this).val()
        if (color != undefined){
            layout['color'] = color
        }
        var shape = $('.shapeselector option:selected', this).attr('name')
        if (shape != undefined){
            layout['shape'] = shape;
        }
        var linestyle = $('.linestyle option:selected', this).attr('name')
        if (linestyle != undefined){
            layout['linestyle'] = linestyle;
        }
        var width = $('.linewidth', this).val()
        if (width != undefined){
            layout['width'] = width;
        }


        templatetype.layout = JSON.stringify(layout)

        var typeattrs = []
        $(".typeattrs option:selected",this).each(function(){
            var ta = {'attr_id':$(this).val()}
            if (type_id != null){ta['type_id'] = type_id}
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
