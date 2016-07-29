var maps_initialized = false;

function initialize()
{
	var mapProp = {
	  //center:new google.maps.LatLng(51.508742,-0.120850),
	  zoom:5,
	  mapTypeId:google.maps.MapTypeId.TERRAIN
	  };

	var map=new google.maps.Map(document.getElementById("googleMap")
	  ,mapProp);

	var centrepoint = null;
	
	for (node_id in node_coords){
		if (node_coords.hasOwnProperty(node_id)==false){
			continue;
		}
		node_coord = node_coords[node_id]
		var lat = node_coord[0];
		var lon = node_coord[1];
		var latlong=new google.maps.LatLng(lat,lon);

		var marker=new google.maps.Marker({
	  		position:latlong,
		    icon: {
		      path: google.maps.SymbolPath.CIRCLE,
		      scale: 3
		    },

	  	});
	  	
	  	if (centrepoint == null){
	  	 	centrepoint = new Array(lat, lon);
	  	} else if ((centrepoint[0]*centrepoint[1]) < (lat*lon)){
	  	 	centrepoint = new Array(lat, lon);
	  	}

	  	marker.setMap(map);
	}
	
	map.setCenter(new google.maps.LatLng(centrepoint[0], centrepoint[1]), 4);

	for (link_id in link_coords){
		if (link_coords.hasOwnProperty(link_id) == false){
			continue;
		}
		link_start = link_coords[link_id][0]
		link_end   = link_coords[link_id][1]

		var startlatlong=new google.maps.LatLng(link_start[0],link_start[1]);
		var endlatlong=new google.maps.LatLng(link_end[0],link_end[1]);
		var maplink = [startlatlong, endlatlong];
		var linkpath = new google.maps.Polyline({
 			path:maplink,
 			strokeColor:"#0000FF",
			strokeOpacity:0.8,
 			strokeWeight:2
		});
	  	
	  	linkpath.setMap(map);
	}
	maps_initialized = true;
}

//google.maps.event.addDomListener(window, 'load', initialize);


