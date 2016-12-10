import hydra_connector as hc

from HydraServer.lib.objects import JSONObject 

from network_utilities import get_resource

import logging
log = logging.getLogger(__name__)

def get_resource_data(network_id, scenario_id, resource_type, res_id, user_id):
    res_scenarios={}
    resource_scenarios = hc.get_resource_data(resource_type, res_id, scenario_id, None, user_id)
    for rs in resource_scenarios:
        attr_id = rs.resourceattr.attr_id
        dataset = JSONObject(rs.dataset)

        res_scenarios[attr_id] =  JSONObject({'rs_id': res_id, 
                 'ra_id': rs.resourceattr.resource_attr_id,
                 'attr_id': attr_id,
                 'dataset': dataset,
                 'data_type': dataset.data_type,
                })
    
    
    resource = get_resource(resource_type, res_id, user_id) 
   
    ra_dict = {}
    if resource.attributes is not None:
        for ra in resource.attributes:
            ra_dict[ra.attr_id] = ra
   
    #Identify any attributes which do not have data -- those not in ther resource attribute table, but in the type attribute table.
    for typ in resource.types:
        tmpltype = typ.templatetype
        if tmpltype.typeattrs is None:
            continue
        for tattr in tmpltype.typeattrs:
            if tattr.attr_id not in res_scenarios:
                res_scenarios[tattr.attr_id] = JSONObject({
                    'rs_id': None,
                    'ra_id': ra_dict[tattr.attr_id].resource_attr_id if ra_dict.get(tattr.attr_id) else None,
                    'attr_id':tattr.attr_id,
                    'dataset': None,
                    'is_var': tattr.attr_is_var,
                    'data_type': tattr.data_type,
                })
            else:
                res_scenarios[tattr.attr_id].is_var = tattr.attr_is_var
                res_scenarios[tattr.attr_id].data_type = tattr.data_type

    return resource, res_scenarios

def set_metadata(hydra_metadata):
    metadata={}
    for meta in hydra_metadata:
        metadata[meta['metadata_name']]=meta['metadata_val']
    return metadata


def add_resource_attribute(resource_type, resource_id, attr_id, is_var, user_id):
    new_ra = hc.add_resource_attribute(resource_type, resource_id, attr_id, is_var,user_id)
    return JSONObject(new_ra)

def update_resource_data(scenario_id, rs_list, user_id):

    for rs in rs_list:
        if rs.resource_attr_id in (None, '', 'None'):
            ra = add_resource_attribute(rs.resource_type, rs.resource_id, rs.attr_id, 'N', user_id)
            rs['resource_attr_id'] = ra.resource_attr_id

    hc.update_resource_data(scenario_id, rs_list, user_id)