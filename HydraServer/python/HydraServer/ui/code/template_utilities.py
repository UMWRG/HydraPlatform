import hydra_connector as hc
from HydraServer.ui.code.model import JSONObject 

def create_template(template, user_id):
    return JSONObject(hc.add_template(template, user_id=user_id))

def update_template(template, user_id):
    return JSONObject(hc.update_template(template, user_id=user_id))

def get_template(template_id, user_id):
    return JSONObject(hc.get_template(template_id, user_id=user_id))

def get_all_templates(user_id):
    return [JSONObject(a) for a in hc.get_all_templates(user_id)]

def get_all_network_types(user_id):
    templates =  hc.get_all_templates(user_id, load_all=True)

    network_types = []

    for template in templates:
        for templatetype in template.templatetypes:
            if templatetype.resource_type == 'NETWORK':
                network_types.append(templatetype)

    return [JSONObject(a) for a in network_types]

def delete_template(template_id, user_id):
    status = hc.delete_template(template_id, user_id)
    return status

def get_type(type_id, user_id):
    return JSONObject(hc.get_type(type_id, user_id=user_id))

def apply_template_to_network(template_id, network_id, user_id):
    hc.apply_template_to_network(template_id, network_id, user_id)
