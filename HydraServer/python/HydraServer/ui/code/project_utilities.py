
import hydra_connector as hc

from HydraServer.ui.code.model import JSONObject 

import logging
log = logging.getLogger(__name__)


def create_project(project, user_id):
    """
    Take a JSONObjhect project and pass it to Hydra Platform's get_project fn
    """

    new_project = hc.add_project(project, user_id=user_id)

    return JSONObject(new_project)

def get_projects(user_id):
    """
    Take a JSONObjhect project and pass it to Hydra Platform's get_project fn
    """

    projects = hc.get_projects(user_id)

    return [JSONObject(p) for p in projects]

def get_project(project_id, user_id):
    """
    Take a JSONObjhect project and pass it to Hydra Platform's get_project fn
    """

    project = hc.get_project(project_id, user_id)
    #Load the project's networks.
    project.networks
    for n in project.networks:
        n.scenarios

    return JSONObject(project)

def delete_project(project_id, user_id):
    """
        Delete a project
    """
    hc.delete_project(project_id, user_id)


def share_project(project_id, usernames, read_only, share, user_id):
    """
        Delete a project
    """
    hc.share_project(project_id, usernames, read_only, share, user_id)

