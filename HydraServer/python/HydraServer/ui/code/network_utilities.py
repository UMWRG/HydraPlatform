from flask import json

import os
import sys

from HydraServer.soap_server.hydra_complexmodels import ResourceAttr, ResourceScenario, Node

from hydra_connector import load_network, get_attributes_for_resource, get_resource_data, get_network_extents


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

def get_network (network_id, scenario_id, session, app):
    network = load_network(network_id, scenario_id, session)
    node_coords = {}
    node_name_map = []
    nodes_ = []
    links_ = []
    node_index = {}
    links_types = []
    links_types.append(None)
    nodes_types = []
    nodes_types.append(None)
    nodes_ids = []
    attr_id_name = {}

    for attr in network.attributes:
        attr_id = attr_id = attr[len(attr) - 2]  # attr[0]
        attr_name = attr[len(attr) - 1]
        attr_id_name[attr_id] = attr_name

    for node in network.nodes:
        nodes_ids.append(node.node_id)
        for attr in node.attributes:
            attr_id = attr_id = attr[len(attr) - 2]  # attr[0]
            attr_name = attr[len(attr) - 1]
            attr_id_name[attr_id] = attr_name

        try:
            type = node.types[0].templatetype.type_name
            if (type in nodes_types) == False:
                nodes_types.append(type)
        except:
            type = None

        node_index[node.node_id] = network.nodes.index(node)
        node_coords[node.node_id] = [node.node_x, node.node_y]

        node_name_map.append({'id': node.node_id, 'name': node.node_name, 'name': node.node_name, 'description':node.description})
        nodes_.append(
            {'id': node.node_id, 'group': nodes_types.index(type) + 1, 'x': float(node.node_x), 'y': float(node.node_y),
             'name': node.node_name, 'type': type, 'res_type': 'node'})

    links = {}
    link_ids = []

    for link in network.links:
        links[link.link_id] = [link.node_1_id, link.node_2_id]
        for attr in link.attributes:
            attr_id = attr[len(attr) - 2]  # attr[0]
            attr_name = attr[len(attr) - 1]
            attr_id_name[attr_id] = attr_name

        link_ids.append(link.link_id)
        try:
            type = link.types[0].templatetype.type_name
            if (type in links_types) == False:
                links_types.append(type)
        except:
            type = None

        links_.append({'id': link.link_id, 'source': node_index[link.node_1_id], 'target': node_index[link.node_2_id],
                       'value': links_types.index(type) + 1, 'type': type, 'name': link.link_name, 'res_type': 'link'})
    nodes_ras = []

    node_resourcescenarios = get_attributes_for_resource(network_id, scenario_id, "NODE", nodes_ids, 'N')
    ii = 0;
    for nodes in node_resourcescenarios:
        ii = ii + 1
        ra = ResourceAttr(nodes.resourceattr)
        ra.resourcescenario = ResourceScenario(nodes, ra.attr_id)
        nodes_ras.append(ra)

    links_ras = []
    link_resourcescenarios = get_attributes_for_resource(network_id, scenario_id, "LINK", link_ids, 'Y')
    for link in link_resourcescenarios:
        ra = ResourceAttr(link.resourceattr)
        ra.resourcescenario = ResourceScenario(link, ra.attr_id)
        links_ras.append(ra)

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
    extents = get_network_extents(network_id, session)
    app.logger.info(node_coords)

    app.logger.info("Network %s retrieved", network.network_name)

    net_scn = {'network_id': network_id, 'scenario_id': scenario_id}
    return node_coords, links, node_name_map,  extents, network, nodes_, links_, nodes_attrs, net_scn,  links_attrs

