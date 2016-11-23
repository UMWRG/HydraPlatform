from flask import json

import hydra_connector as hc

from HydraServer.ui.code.model import JSONObject 

def get_dict(obj):
    if type(obj) is list:
        list_results=[]
        for item in obj:
            list_results.append(get_dict(item))
        return list_results

    if not hasattr(obj, "__dict__"):
        return obj

    result = {}
    for key, val in obj.__dict__.items():
        if key.startswith("_"):
            continue
        if isinstance(val, list):
            element = []
            for item in val:
                element.append(get_dict(item))
        else:
            element = get_dict(obj.__dict__[key])
        result[key] = element
    return result

def get_layout_property(resource, prop, default):
    layout = {}
    if resource.layout is not None:
        layout = eval(resource.layout)
    elif resource.types:
        if resource.types[0].templatetype.layout is not None:
            layout = eval(resource.types[0].templatetype.layout)

    prop_value = default
    if layout.get(prop) is not None:
        prop_value = layout[prop]

    return prop_value


def set_metadata(hydra_metadata):
    metadata={}
    for meta in hydra_metadata:
        metadata[meta['metadata_name']]=meta['metadata_val']
    return metadata

def get_resource_attributes(network_id, scenario_id, resource_type, res_id, session):
    res_attrs=[]
    ress = hc.get_resource_data(resource_type, res_id, scenario_id, None, session)
    for res in ress:
        attrr_id = res.resourceattr.attr_id
        try:
            vv = json.loads(res.dataset.value)
        except:
            vv = res.dataset.value

        if (res.dataset.data_type == "timeseries"):
            values_ = []
            for index in vv.keys():
                for date_ in sorted(vv[index].keys()):
                    value = vv[index][date_]
                    values_.append({'date': date_, 'value': value})
            vv = values_
        metadata = set_metadata(get_dict(res.dataset)['metadata'])

        res_attrs.append({'id': res_id, 'attr_id': res.resourceattr.attr_id, 'attrr_id': attrr_id,
                            'type': res.dataset.data_type, 'values': vv, 'metadata': metadata})
    return res_attrs

def create_network(network, user_id):
    """
    Take a JSONObjhect network and pass it to Hydra Platform's get_network fn
    """

    new_network = hc.add_network(network, user_id=user_id)

    return JSONObject(new_network)

def get_network (network_id, scenario_id, session, app):
    attrs_= hc.get_all_attributes()
    attr_id_name = {}
    for attr in attrs_:
        attr_id_name[attr.attr_id]=attr.attr_name
    network = hc.load_network(network_id, scenario_id, session)
    node_coords = {}
    node_name_map = []
    nodes_ = []
    links_ = []
    node_index = {}
    link_types = []
    link_types.append(None)
    node_types = []
    node_types.append(None)
    nodes_ids = []

    for node in network.nodes:
        nodes_ids.append(node.node_id)

        try:
            nodetype = node.types[0].templatetype
            if (nodetype.type_name in node_types) == False:
                node_types.append(nodetype.type_name)
        except:
            nodetype = None

        node_index[node.node_id] = network.nodes.index(node)
        node_coords[node.node_id] = [node.node_x, node.node_y]

        node_name_map.append({'id': node.node_id, 'name': node.node_name, 'name': node.node_name, 'description':node.description})
        nodes_.append(
            {'id': node.node_id, 'group': node_types.index(nodetype.type_name) + 1, 'x': float(node.node_x), 'y': float(node.node_y),
             'name': node.node_name, 'type': nodetype, 'res_type': 'node'})

    links = {}
    link_ids = []

    for link in network.links:
        links[link.link_id] = [link.node_1_id, link.node_2_id]


        link_ids.append(link.link_id)
        try:
            linktype = link.types[0].templatetype
            if (linktype.type_name in link_types) == False:
                link_types.append(linktype.type_name)
        except:
            linktype = None

        links_.append({'id': link.link_id, 'source': node_index[link.node_1_id], 'target': node_index[link.node_2_id],
                       'type': linktype, 'name': link.link_name, 'res_type': 'link'})


    '''
    nodes_attrs = []
    for node_ in network.nodes:
        ress = get_resource_data('NODE', node_.node_id, scenario_id, None, session)
        for res in ress:
            attrr_name_ = attr_id_name[res.resourceattr.attr_id]
            try:
                vv = json.loads(res.dataset.value)
            except:
                vv = res.dataset.value

            if (res.dataset.data_type == "timeseries"):
                values_ = []
                for index in vv.keys():
                    for date_ in sorted(vv[index].keys()):
                        value = vv[index][date_]
                        values_.append({'date': date_, 'value': value})
                vv = values_
            metadata = set_metadata(get_dict(res.dataset)['metadata'])

            nodes_attrs.append({'id': node_.node_id, 'attr_id': res.resourceattr.attr_id, 'attrr_name': attrr_name_,
                                'type': res.dataset.data_type, 'values': vv, 'metadata':metadata })

    links_attrs = []
    for link_ in network.links:
        ress = get_resource_data('LINK', link_.link_id, scenario_id, None, session)
        for res in ress:
            attrr_name_ = attr_id_name[res.resourceattr.attr_id]
            try:
                vv = json.loads(res.dataset.value)
            except:
                vv = res.dataset.value

            if (res.dataset.data_type == "timeseries"):
                values_ = []
                for index in vv.keys():
                    for date_ in sorted(vv[index].keys()):
                        value = vv[index][date_]
                        values_.append({'date': date_, 'value': value})
                vv = values_
            metadata=set_metadata(get_dict(res.dataset)['metadata'])

            links_attrs.append({'id': link_.link_id, 'attr_id': res.resourceattr.attr_id, 'attrr_name': attrr_name_,
                                'type': res.dataset.data_type, 'values': vv, 'metadata':metadata})


            # Get the min, max x and y coords
    '''
    extents = hc.get_network_extents(network_id, session)
    app.logger.info(node_coords)

    app.logger.info("Network %s retrieved", network.network_name)

    net_scn = {'network_id': network_id, 'scenario_id': scenario_id}
    return node_coords, links, node_name_map,  extents, network, nodes_, links_,  net_scn,  attr_id_name


def add_node(node, user_id):
    """
    Take a JSONObjhect node and pass it to Hydra Platform's add_node fn.
    The ID of the network is contained in the node object.
    """

    new_node = hc.add_node(node, user_id=user_id)

    return JSONObject(new_node)

def update_node(node, user_id):
    """
    Take a JSONObjhect node and pass it to Hydra Platform's add_node fn.
    The ID of the network is contained in the node object.
    """

    updated_node = hc.update_node(node, user_id=user_id)

    return JSONObject(updated_node)

def add_link(link, user_id):
    """
    Take a JSONObjhect link and pass it to Hydra Platform's add_link fn.
    The ID of the network is contained in the link object.
    """

    new_link = hc.add_link(link, user_id=user_id)

    return JSONObject(new_link)
