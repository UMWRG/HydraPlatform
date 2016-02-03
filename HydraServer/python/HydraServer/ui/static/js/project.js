$(document).on("click", ".network", function(){
   var net_id = this.id.split('_')[1];

    $('#scenario_list .table-row').addClass('hidden');

   var scenario_container = $('#network_'+net_id+'_scenarios').removeClass('hidden');

});
