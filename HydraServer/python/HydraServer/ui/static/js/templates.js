$(document).on('click', "#addnodetype", function(){
    
    var nodetyperow = $("#attributetemplate tr").clone();
    
    $("#newtemplatetable tbody.nodes").append(nodetyperow);
    

})
