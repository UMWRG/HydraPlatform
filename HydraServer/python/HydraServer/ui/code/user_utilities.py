import hydra_connector
from HydraServer.ui.code.model import JSONObject 

def get_usernames_like(username, user_id):
    """
        Returns a list of usernames wich feature the passed in partial username
    """
    return hydra_connector.get_usernames_like(username, user_id=user_id)
