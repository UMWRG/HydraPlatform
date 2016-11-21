from flask import json
import hydra_connector
from HydraServer.ui.code.model import JSONObject 

def create_template(template, user_id):
    return JSONObject(hydra_connector.add_template(template, user_id=user_id))

def update_template(template, user_id):
    return JSONObject(hydra_connector.update_template(template, user_id=user_id))

def get_template(template_id, user_id):
    return JSONObject(hydra_connector.get_template(template_id, user_id=user_id))

def get_all_templates(user_id):
    return [JSONObject(a) for a in hydra_connector.get_all_templates(user_id)]

def get_all_network_types(user_id):
    templates =  hydra_connector.get_all_templates(user_id, load_all=True)

    network_types = []

    for template in templates:
        for templatetype in template.templatetypes:
            if templatetype.resource_type == 'NETWORK':
                network_types.append(templatetype)

    return [JSONObject(a) for a in network_types]

def delete_template(template_id, user_id):
    status = hydra_connector.delete_template(template_id, user_id)
    return status
