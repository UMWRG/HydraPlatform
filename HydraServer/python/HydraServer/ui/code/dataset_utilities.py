import hydra_connector
from HydraServer.ui.code.model import JSONObject 
from HydraServer.lib.objects import Dataset

def get_dataset(dataset_id, user_id):
    return JSONObject(hydra_connector.get_dataset(dataset_id, user_id=user_id))

def create_dataset(dataset, user_id):
    return JSONObject(hydra_connector.add_dataset(Dataset(dataset), user_id=user_id))

def get_all_datasets():
    return [JSONObject(a) for a in hydra_connector.get_all_datasets()]
