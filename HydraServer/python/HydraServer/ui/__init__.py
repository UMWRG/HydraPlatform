from flask import Flask, jsonify, Response, json, request, session, redirect, url_for, escape

import requests

import logging

from HydraServer.lib import project as proj
from HydraServer.lib import network as net

from HydraServer.util.hdb import login_user
from HydraServer.soap_server.hydra_base import get_session_db

from flask import render_template

DATA_FOLDER = 'python/HydraServer/ui/data'

app = Flask(__name__)

@app.route('/')
def index():

    app.logger.info("Index")

    app.logger.info("Session: %s", session)
    if 'username' not in session:
        app.logger.info("Going to login page.")
        return render_template('login.html', msg="")
    else:
        user_id = session['user_id']
        username = escape(session['username'])
        projects = proj.get_projects(user_id, **{'user_id':user_id})
        app.logger.info("Logged in. Going to projects page.")
        return render_template('projects.html',
                               display_name=username,
                               username=username,
                               projects=projects)


@app.route('/login', methods=['GET', 'POST'])
def do_login():
    app.logger.info("Received login request.")
    if request.method == 'POST':
        try:
            user_id, api_session_id = login_user(request.form['username'], request.form['password'])
        except:
            app.logger.warn("Bad login for user %s", request.form['username'])
            return render_template('login.html', msg="Unable to log in")

        session['username'] = request.form['username']
        session['user_id'] = user_id
        session['session_id'] = api_session_id

        app.logger.info("Good login %s. Redirecting to index (%s)"%(request.form['username'], url_for('index')))

        app.logger.info(session)

        return redirect(url_for('index'))

    app.logger.warn("Login request was not a post. Redirecting to login page.")
    return render_template('login.html', msg="")

@app.route('/do_logout', methods=['GET', 'POST'])
def do_logout():
    app.logger.info("Logging out %s", session['username'])
    # remove the username from the session if it's there
    session.pop('username', None)
    session.pop('user_id', None)
    session.pop('session_id', None)
    app.logger.info(session)
    return redirect(url_for('index', _external=True))

# set the secret key.  keep this really secret:
app.secret_key = '\xa2\x98\xd5\x1f\xcd\x97(\xa4K\xbfF\x99R\xa2\xb4\xf4M\x13R\xd1]]\xec\xae'

@app.route('/graphs')
def list_graphs():
    from os import listdir
    valid_files = [f for f in listdir(DATA_FOLDER) if f.endswith('json')]
    return jsonify(graph_files=valid_files)

@app.route('/graphs/<filename>', methods=['GET', 'POST'])
def get_graph(filename):
    from os.path import join
    json_pth = join(DATA_FOLDER, filename)

    if request.method == 'POST':
        with open(json_pth, 'w') as fh:
            fh.write(request.data)
        return Response(request.data, status=200, mimetype="application/json")
    else:
        # This seems pointless to load and then reconvert to JSON. Is it necessary?
        with open(json_pth, 'r') as fh:
            data = fh.read()

        return Response(data, status=200, mimetype="application/json")

@app.route('/hydra/<func>', methods=['GET', 'POST'])
def call_hydra(func):
    logging.info("Calling: %s" % (func))

    url = request.args['url']

    args = {}
    for k, v in request.args.items():
        if k != 'url':
            args[k] = v

    call = {func: args}

    headers = {'Content-Type': 'application/json',\
               'session_id': request.headers['session_id'],\
               'app_name': request.headers['app_name'],\
               }

    response = requests.post(url, data=json.dumps(call), headers=headers)

    logging.warn('done')

    if not response.ok:
        try:
            resp = json.loads(response.content)
            err = "%s:%s" % (resp['faultcode'], resp['faultstring'])
        except:
            if response.content != '':
                err = response.content
            else:
                err = "An unknown server has occurred."
        raise Exception(err)

    return Response(response.content, status=200, mimetype="application/json")

def check_session(req):
    session_db = get_session_db()

    session_id = request.headers.get('session_id')

    sess_info = session_db.get(session_id)

    if sess_info is None:
        raise Exception("No Session")

    sess_info = {'user_id':sess_info[0], 'username':sess_info[1]}

    return sess_info

@app.route('/project/<project_id>', methods=['GET'])
def go_project(project_id):
    """
        Get a user's projects
    """

    project = proj.get_project(project_id, **session)

    app.logger.info("Project %s retrieved", project.project_name)

    return render_template('project.html',\
                          username=session['username'],\
                          display_name=session['username'],\
                          project=project)

@app.route('/network', methods=['GET'])
def go_network():
    """
        Get a user's projects
    """
    app.logger.info(request.args['scenario_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']

    network = net.get_network(network_id, scenario_ids=[scenario_id], **session)

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

    json_net = {'nodes':[], 'edges':[]}
    for node in network.nodes:
        colour = get_layout_property(node, 'colour', 'red')
        size = get_layout_property(node, 'size', 1)
        node_dict = {
            'id' : str(node.node_id),
            'label': node.node_name,
            'x'    : float(node.node_x),
            'y'    : float(node.node_y),
            'size' : size,
            'color': colour,
        }
        json_net['nodes'].append(node_dict)

    for link in network.links:
        colour = get_layout_property(link, 'colour', 'red')
        width = get_layout_property(link, 'line_weight', 5)
        link_dict = {
            'id' : str(link.link_id),
            'source': str(link.node_1_id),
            'target' : str(link.node_2_id),
            'color': colour,
            'size':width,
            'type':'curve',
            'hover_color':'#ccc',
        }
        json_net['edges'].append(link_dict)

    node_coords = {}
    node_name_map = {}
    for node in network.nodes:
        node_coords[node.node_id] = [node.node_y, node.node_x]
        node_name_map[node.node_id] = node.node_name
    link_coords = {}
    for link in network.links:
        link_coords[link.link_id] = [node_coords[link.node_1_id], node_coords[link.node_2_id]]

    #Get the min, max x and y coords
    extents = net.get_network_extents(network_id, **session)
    app.logger.info(node_coords)

    app.logger.info("Network %s retrieved", network.network_name)

    return render_template('network.html',\
                scenario_id=scenario_id,
                node_coords=node_coords,\
                link_coords=link_coords,\
                username=session['username'],\
                display_name=session['username'],\
                extents=extents,\
                network=network)


if __name__ == "__main__":
    import os

    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)
