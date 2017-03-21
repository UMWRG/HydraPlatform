$(document).ready(function(){
    $('.selectpicker').selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 
    
})

$(document).on('click', "#addnodetype", function(event){
    event.preventDefault(); 

    var nodetyperow = $("#resourcetypetemplate tr:first").clone();

    nodetyperow.addClass('nodetype');
    $("select",nodetyperow).addClass('selectpicker');
    
    $("#newtemplatetable tbody.nodetypes").append(nodetyperow);

    $('.selectpicker', nodetyperow).selectpicker({
       // style: 'btn-info',
        liveSearch:true
    }); 
})
$(document).on('click', "#addlinktype", function(event){
    event.preventDefault(); 

    var nodetyperow = $("#resourcetypetemplate tr:first").clone();

    nodetyperow.addClass('linktype');
    
    $("#newtemplatetable tbody.linktypes").append(nodetyperow);

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

$(document).on("click", "#create-template-button", function(event){

    event.preventDefault();

    var formdata = $("#newtemplatetable").serializeArray();
    var data = {
        name: $("input[name='template_name']").val(),
        description: $("input[name='template_description']").val(),
        types: []
    }

    $(".resourcetype").each(function(){
        var templatetype = {}

        var t = $(this)
        if (t.hasClass("nodetype")){
            templatetype.resource_type = 'NODE'
        }else if(t.hasClass("nodetype")){
            templatetype.resource_type = 'LINK'
        }else if(t.hasClass("grouptype")){
            templatetype.resource_type = 'GROUP'
        }

        $("input",this).each(function(){
            var name = $(this).attr('name') 
            var value = $(this).val() 
            templatetype[name] = value

        })
        data.types.push(templatetype)

        var typeattrs = []
        $(".typeattrs option:selected",this).each(function(){
            typeattrs.push({'attr_id':$(this).val()})
        })
        templatetype.typeattrs = typeattrs
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
        url: "/create_template",
        data : JSON.stringify(data),
        success: success,
        error: error,
        method:'POST',
    })

})
