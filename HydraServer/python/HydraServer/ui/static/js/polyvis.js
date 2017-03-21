$(document).on('click', '.polyvis', function(e){
    e.preventDefault()
    var container = $(this).closest('.dataset')
    
    var dataset_id = $("input[name='dataset_id']", container).val()

    window.open("/export_to_polyvis?dataset_id="+dataset_id,  '_blank')

})
