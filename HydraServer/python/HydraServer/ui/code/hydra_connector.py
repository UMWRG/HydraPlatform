from HydraServer.lib import project as proj
from HydraServer.lib import network as net

from HydraServer.lib import scenario as sen

def load_network(network_id, scenario_id, session):
    return net.get_network(network_id, False, 'Y', scenario_ids=[scenario_id], **session)

def get_attributes_for_resource(network_id, scenario_id, resource, ids, include_metadata):
    return net.get_attributes_for_resource(network_id, scenario_id, resource, ids, include_metadata)

def get_resource_data(resource, id, scenario_id, type_id, session):
    return sen.get_resource_data(resource, id, scenario_id, type_id, **session)

def get_network_extents(network_id, session):
    return net.get_network_extents(network_id, **session)



