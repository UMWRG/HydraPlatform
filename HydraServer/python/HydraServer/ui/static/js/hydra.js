var session_id=null;
var user_id=null;

var basic_error = function(xhr, status, error){
        if (xhr.responseJSON){
            console.log("ERROR: "
                        + xhr.statusText + " " 
                        + xhr.responseJSON.faultcode + " " 
                        + xhr.responseJSON.faultstring)
        }else{
            console.log("ERROR: "
                        + xhr.statusText + " " 
                        + xhr.responseText);
        }
    }

/*LOGIN*/
d3.select('#login-btn').on('click', function(){
 
    var success = function(data){
        console.log(data);
        session_id = data['session_id'];
        user_id    = data['user_id'];
        Cookies.set("session_id", session_id);
        Cookies.set("user_id", user_id);
    }

    var complete = function(data){
    }

    var url = d3.select("#url-input").node().value;

    var username = d3.select("#username").node().value;
    var pass     = d3.select("#password").node().value;

    var params = {"login": {"username": username, "password": pass}};

    $.ajax({
        contentType:'application/x-www-form-urlencoded',
        beforeSend: function(xhrObj){
//            xhrObj.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
            xhrObj.setRequestHeader("Accept","application/json");
            xhrObj.setRequestHeader("session_id","");
            xhrObj.setRequestHeader("app_name", 'webui');
        },
        type: 'POST',
        url: url,
        data: JSON.stringify(params),
        success: success,
        error: basic_error,
        complete: complete
    });

});

/*PROJECTS*/
d3.select('#projects-btn').on('click', function(){
 
    var success = function(data, status, xhr){
        console.log("Success?: " + data);
    }

    var complete = function(data){
    }

    var url = d3.select("#url-input").node().value;

    //var params = {"get_projects": {"user_id": user_id}};

    session_id = Cookies.get("session_id");

    $.ajax({
        contentType:'application/x-www-form-urlencoded',
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Accept","application/json");
            xhrObj.setRequestHeader("session_id",session_id);
            xhrObj.setRequestHeader("app_name", 'webui');
        },
        type: 'POST',
        url: '/ui/projects',
        success: success,
        error: basic_error,
        complete: complete
    });

});
