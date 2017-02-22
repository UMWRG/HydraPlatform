import hydra_connector as hc

from HydraServer.lib.objects import JSONObject

from network_utilities import get_resource
import pandas as pd
import logging
log = logging.getLogger(__name__)

def get_scenario (scenario_id, user_id):
    return hc.get_scenario(scenario_id, user_id)

def get_resource_data(network_id, scenario_id, resource_type, res_id, user_id):
    res_scenarios={}
    resource_scenarios = hc.get_resource_data(resource_type, res_id, scenario_id, None, user_id)
    for rs in resource_scenarios:
        attr_id = rs.resourceattr.attr_id
        #Load the dataset's metadata
        rs.dataset.metadata                

        res_scenarios[attr_id] =  JSONObject({'rs_id': res_id,
                 'ra_id': rs.resourceattr.resource_attr_id,
                 'attr_id': attr_id,
                 'dataset': rs.dataset,
                 'data_type': rs.dataset.data_type,
                })

        #Hack to work with hashtables. REMOVE AFTER DEMO
        if len(rs.dataset.metadata) > 0:
            for m in rs.dataset.metadata:
                if m.metadata_name == 'data_type' and m.metadata_val == 'hashtable':
                    df = pd.read_json(rs.dataset.value)
                    res_scenarios[attr_id].dataset.value = df.transpose().to_json() 
                    break

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

                if tattr.default_dataset_id is not None:
                    d = tattr.default_dataset
                    #Hack to work with hashtables. REMOVE AFTER DEMO
                    if d.metadata.get('data_type') == 'hashtable':
                        d.value = d.value.replace("\'", "")
                        df = pd.read_json(d.value)
                        d.value = df.transpose().to_json() 
                    res_scenarios[tattr.attr_id].dataset = d

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

def clone_scenario(scenario_id, scenario_name, user_id):
    new_scenario = hc.clone_scenario(scenario_id, user_id)
    #Creating and then updating is not efficient, but provides a clean distinction between
    #funtions, and isn't a time-critical operation
    s = JSONObject({
        'id': new_scenario.scenario_id,
        'network_id':new_scenario.network_id,
        'name': scenario_name,
        'resourcescenarios':[],
        'resourcegroupitems':[],
    })
    return JSONObject(hc.update_scenario(s, user_id))

def add_scenario(scenario, user_id):
    new_scenario = hc.add_scenario(scenario, user_id)
    return JSONObject(new_scenario)

def add_resource_group_items(scenario_id, items, user_id):
    newitems = hc.add_resourcegroupitems(scenario_id, items, user_id)
    return [JSONObject(i) for i in newitems]

def delete_resource_group_items(scenario_id, item_ids, user_id):
    hc.delete_resourcegroupitems(scenario_id, item_ids, user_id)

def get_resource_scenario(resource_attr_id, scenario_id, user_id):
    rs = hc.get_resource_scenario(resource_attr_id, scenario_id, user_id)

    jsonrs = JSONObject(rs)

    #Hack to work with hashtables. REMOVE AFTER DEMO
    if len(rs.dataset.metadata) > 0:
        for m in rs.dataset.metadata:
            if m.metadata_name == 'data_type' and m.metadata_val == 'hashtable':
                df = pd.read_json(rs.dataset.value)
                jsonrs.dataset.value = df.transpose().to_json() 
                break

    return jsonrs 
