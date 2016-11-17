from flask import json
import hydra_connector
from HydraServer.ui.code.model import JSONObject 

def create_attr(attr, user_id):
    return JSONObject(hydra_connector.add_attr(attr, user_id=user_id))

def get_all_attributes():
    return [JSONObject(a) for a in hydra_connector.get_all_attributes()]
