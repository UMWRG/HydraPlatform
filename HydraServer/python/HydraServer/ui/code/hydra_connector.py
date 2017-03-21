from HydraServer.lib import project as proj
from HydraServer.lib import network as net
from HydraServer.lib import template as tmpl
from HydraServer.lib import scenario as scen
from HydraServer.lib import attributes as attrs
from HydraServer.lib import data  as data
from HydraServer.lib import sharing  as sharing
from HydraServer.lib import users  as users


def load_network(network_id, user_id):
    return net.get_network(int(network_id),
                           summary=False,
                           include_data='Y',
                           user_id=user_id)

def get_network_simple(network_id, user_id):
    return net.get_network_simple(network_id, user_id=user_id)

def share_network(network_id, usernames, read_only, share, user_id):
    sharing.share_network(project_id, usernames, read_only, share, user_id=user_id)

def delete_network(network_id, user_id):
    net.set_network_status(network_id, 'X', user_id=user_id)

def get_projects(user_id):
    projects = proj.get_projects(user_id, user_id=user_id)
    return projects

def get_project(project_id, user_id):
    project = proj.get_project(project_id, user_id=user_id)
    return project

def delete_project(project_id, user_id):
    proj.delete_project(project_id, user_id=user_id)

def share_project(project_id, usernames, read_only, share, user_id):
    sharing.share_project(project_id, usernames, read_only, share, user_id=user_id)

def add_project(project, user_id):
    project = proj.add_project(project, user_id=user_id)
    return project

def get_node(node_id, user_id):
    return net.get_node(node_id, user_id=user_id)

def get_link(link_id, user_id):
    return net.get_link(link_id, user_id=user_id)

def get_resourcegroup(resourcegroup_id, user_id):
    return net.get_resourcegroup(resourcegroup_id, user_id=user_id)

def get_node_by_name(network_id, node_name, user_id):
    return net.get_node_by_name(network_id, node_name, user_id=user_id)

def get_link_by_name(network_id, link_name, user_id):
    return net.get_link_by_name(network_id, link_name, user_id=user_id)

def get_resourcegroup_by_name(network_id, resourcegroup_name, user_id):
    return net.get_resourcegroup_by_name(network_id, resourcegroup_name, user_id=user_id)

def get_attributes_for_resource(network_id, scenario_id, resource, ids, include_metadata):
    return net.get_attributes_for_resource(network_id, scenario_id, resource, ids, include_metadata)

def get_resource_data(resource, id, scenario_id, type_id, user_id):
    return scen.get_resource_data(resource, id, scenario_id, type_id, user_id=user_id)

def update_resource_data(scenario_id, rs_list, user_id):
    return scen.update_resourcedata(scenario_id, rs_list, user_id=user_id)

def get_network_extents(network_id, user_id):
    return net.get_network_extents(network_id, user_id=user_id)

def add_network(network, user_id):
    new_network = net.add_network(network, user_id=user_id)
    return new_network

def add_node(node, user_id):
    new_node = net.add_node(node.network_id, node, user_id=user_id)
    return new_node

def update_node(node, user_id):
    updated_node = net.update_node(node, user_id=user_id)
    return updated_node

def add_link(link, user_id):
    new_link = net.add_link(link.network_id, link, user_id=user_id)
    return new_link

def add_group(group, user_id):
    new_group = net.add_group(group.network_id, group, user_id=user_id)
    return new_group

def update_group(group, user_id):
    updated_group = net.update_group(group, user_id=user_id)
    return updated_group

def delete_group(group_id, user_id):
    #the second argument is to purge dsata. Ignore this for now
    net.delete_group(group_id, False, user_id=user_id)

def get_all_attributes():
    return attrs.get_attributes()

def add_attr(attr, user_id):
    new_attr =  attrs.add_attribute(attr, user_id=user_id)
    return new_attr

def add_dataset(dataset, user_id):
    new_dataset = data.add_dataset(
                    dataset['type'],
                    dataset['value'],
                    dataset.get('unit', None),
                    dataset.get('dimension', None),
                    dataset.get_metadata_as_dict(),
                    user_id=user_id,
                    flush=True)
    return new_dataset

def get_dataset(dataset_id, user_id):
    dataset = data.get_dataset(dataset_id, user_id=user_id)
    return dataset

def add_template(template, user_id):
    new_tmpl =  tmpl.add_template(template, user_id=user_id)
    return new_tmpl


def load_template(template_file, user_id):
    new_tmpl =  tmpl.upload_template_xml(template_file, user_id=user_id)
    return new_tmpl

def update_template(template, user_id):
    updated_tmpl =  tmpl.update_template(template, user_id=user_id)
    return updated_tmpl

def get_template(template_id, user_id):
    template =  tmpl.get_template(template_id, user_id=user_id)
    return template

def delete_template(template_id, user_id):
    status =  tmpl.delete_template(template_id, user_id=user_id)
    return status

def get_all_templates(user_id, load_all=False):
    all_templates =  tmpl.get_templates(load_all=load_all, user_id=user_id)
    return all_templates

def get_type(type_id, user_id):
    tmpltype =  tmpl.get_type(type_id, user_id=user_id)
    return tmpltype

def apply_template_to_network(template_id, network_id, user_id):
    tmpl.apply_template_to_network(template_id, network_id, user_id=user_id)

def add_resource_attribute(resource_type, resource_id, attr_id, is_var, user_id):
    new_ra = attrs.add_resource_attribute(resource_type, resource_id, attr_id, is_var,user_id=user_id)
    return new_ra

def delete_node(node_id, user_id):
    net.delete_node(node_id, False, user_id=user_id)

def delete_link(link_id, user_id):
    net.delete_link(link_id, False, user_id=user_id)

def delete_resourcegroup(group_id, user_id):
    net.delete_resourcegroup(group_id, False, user_id=user_id)

def get_scenario(scenario_id, user_id):
    return scen.get_scenario(scenario_id, user_id=user_id)

def clone_scenario(scenario_id, user_id):
    return scen.clone_scenario(scenario_id, user_id=user_id)

def add_scenario(scenario, user_id):
    return scen.add_scenario(scenario.get('network_id'), scenario, user_id=user_id)

def update_scenario(scenario, user_id, update_data=True, update_groups=True):
    return scen.update_scenario(scenario, update_data=update_data, update_groups=update_groups, user_id=user_id)

def get_usernames_like(username, user_id):
    return users.get_usernames_like(username, user_id=user_id)

def add_resourcegroupitems(scenario_id, items, user_id):
    return scen.add_resourcegroupitems(scenario_id, items, user_id=user_id)

def delete_resourcegroupitems(scenario_id, item_ids, user_id):
    scen.delete_resourcegroupitems(scenario_id, item_ids, user_id=user_id)

def get_resource_scenario(resource_attr_id, scenario_id, user_id):
    return scen.get_resource_scenario(resource_attr_id, scenario_id, user_id=user_id)
