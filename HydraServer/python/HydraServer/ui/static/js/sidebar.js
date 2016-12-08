var menu_open = false;

$(document).on('click', '#sidebar_button', function(event){

    toggleSidebar();
});


function toggleSidebar(){
    //Check to see if the menu is being opened or closed by checking
    ////whether the menu is open or not.
    if ($("#sidebar:visible").length > 0 == true){
        menu_open = true;
    }else{
        menu_open = false;
    }

    side_menu = $('#sidebar');
    side_menu.animate({width:'toggle'}, 150);
    var side_button = $("#sidebar_button");

    if (menu_open == false){
        $('span.glyphicon', side_button).removeClass('glyphicon-chevron-right');
        $('span.glyphicon', side_button).addClass('glyphicon-chevron-left');

        menu_open = true;

    }else{
        $('span.glyphicon', side_button).removeClass('glyphicon-chevron-left');
        $('span.glyphicon', side_button).addClass('glyphicon-chevron-right');
        menu_open = false;
    }

}

/*open & close content when clicking the heading*/
$(document).on('click', '#sidebar .filterheading', function(){
    var heading = $(this)
    var content = $('.filtercontent', heading.closest('li')).toggleClass('hidden');
});


//$('#sidebar_container').css('height', window.outerHeight);

$(document).on('keyup', function(event){
    event.preventDefault();

    if (event.which == '27' && menu_open==true){
        toggleSidebar();
    }

});

$('.linkbutton').click(function(e) {
    e.preventDefault();
    $('.linkbutton').removeClass('active')
    $(this).addClass('active');
})

$(document).on('show.bs.modal', '#apply-template-container', function(){
    var success = function(resp){
        console.log(resp)
    }

    var error = function(resp){
       $('.modal-body', $(this)).append("An error occurred retrieving the templates.") 
    }

    $.ajax({
        url: get_all_templates_url,
        success: success,
        error: error
    })
})
