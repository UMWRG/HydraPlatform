import hydra_connector as hc

from HydraServer.ui.code.model import JSONObject 

import logging
log = logging.getLogger(__name__)

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


def get_attr_id_name_map():
    attrs_= hc.get_all_attributes()
    attr_id_name_map = {}
    for attr in attrs_:
        attr_id_name_map[attr.attr_id]=attr.attr_name

    return attr_id_name_map

def create_network(network, user_id):
    """
    Take a JSONObjhect network and pass it to Hydra Platform's get_network fn
    """

    new_network = hc.add_network(network, user_id=user_id)

    return JSONObject(new_network)

def get_network (network_id, user_id):
    network = hc.load_network(network_id, user_id=user_id)
    network.id = network.network_id
    network.name = network.network_name

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
            nodetype = {'type_name': 'Default Node',
                        'layout': {'shape':'circle', 'color':'black', 'width': '10', 'height': '10'}
                       }

        node_index[node.node_id] = network.nodes.index(node)
        node_coords[node.node_id] = [node.node_x, node.node_y]

        node_name_map.append({'id': node.node_id, 'name': node.node_name, 'name': node.node_name, 'description':node.description})
        nodes_.append(
            {'id': node.node_id, 'x': float(node.node_x), 'y': float(node.node_y),
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
            linktype = {'type_name': 'Default Link',
                        'layout': {'color':'black', 'width': '2'}
                       }

        links_.append({'id': link.link_id, 'source': link.node_1_id, 'target': link.node_2_id,
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
    extents = hc.get_network_extents(network_id,user_id) 
    log.info(node_coords)

    log.info("Network %s retrieved", network.network_name)

    return node_coords, links, node_name_map,  extents, network, nodes_, links_


def get_resource(resource_type, resource_id, user_id, scenario_id=None):
    resource_type = resource_type.upper()
    if resource_type == 'NODE':
        return get_node(resource_id, user_id)
    elif resource_type == 'LINK':
        return get_link(resource_id, user_id)
    elif resource_type == 'GROUP':
        return get_resourcegroup(resource_id, user_id)
    elif resource_type == 'NETWORK':
        network = get_network_simple(resource_id, user_id)
        return network

def get_network_simple(network_id, user_id):
    network = hc.get_network_simple(network_id, user_id)
    #Load the network's types
    for t in network.types:
        t.templatetype.typeattrs
    
    network_j = JSONObject(network)
    network_j.name = network_j.network_name
    network_j.id = network_j.network_id
    return network_j

def get_node(node_id, user_id):
    node = hc.get_node(node_id, user_id)
    #Load the node's types
    for t in node.types:
        t.templatetype.typeattrs
        for ta in t.templatetype.typeattrs:
            if ta.default_dataset_id:
                ta.default_dataset
    
    node_j = JSONObject(node)
    node_j.name = node_j.node_name
    node_j.id = node_j.node_id
    return node_j

def get_link(link_id, user_id):
    link = hc.get_link(link_id, user_id)
    for t in link.types:
        t.templatetype.typeattrs
    link_j = JSONObject(link)
    link_j.name = link_j.link_name
    link_j.id = link_j.link_id
    return link_j

def get_resourcegroup(group_id, user_id):
    group = hc.get_resourcegroup(group_id, user_id)
    for t in group.types:
        t.templatetype.typeattrs
    group_j = JSONObject(group)

    group_j.name = group_j.group_name
    group_j.id = group_j.group_id

    return group_j

def delete_resource(resource_id, resource_type, user_id):
    resource_type = resource_type.upper()
    if resource_type == 'NODE':
        hc.delete_node(resource_id, user_id)
    elif resource_type == 'LINK':
        hc.delete_link(resource_id, user_id)
    elif resource_type == 'GROUP':
        hc.delete_resourcegroup(resource_id, user_id)
    elif resource_type == 'NETWORK':
        hc.delete_network(resource_id, user_id)

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
