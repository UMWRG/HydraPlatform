import hydra_connector
from HydraServer.ui.code.model import JSONObject 

def create_dataset(dataset, user_id):
    return JSONObject(hydra_connector.add_dataset(dataset, user_id=user_id))

def get_all_datasets():
    return [JSONObject(a) for a in hydra_connector.get_all_datasets()]
