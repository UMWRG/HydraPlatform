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

    node_coords = {}
    node_name_map = []

    nodes_ = []
    links_ = []
    node_index = {}
    links_types = []
    links_types.append(None)
    nodes_types = []
    nodes_types.append(None)

    for node in network.nodes:
        try:
            type = node.types[0].templatetype.type_name
            if (type in nodes_types) == False:
                nodes_types.append(type)
        except:
            type=None

        node_index[node.node_id] = network.nodes.index(node)
        #nodes_[node.node_id]=[1, node.node_x, node.node_y]
        node_coords[node.node_id] = [node.node_x, node.node_y]
        node_name_map.append({'id':node.node_id, 'name':node.node_name, 'name': node.node_name})

        nodes_.append({'id':node.node_id, 'group': nodes_types.index(type) + 1, 'x':float(node.node_x),'y': float(node.node_y), 'name':node.node_name, 'type':type})


    links = {}
    for link in network.links:
        links[link.link_id] = [link.node_1_id, link.node_2_id]
        #links_[link.link_id]=[nodes_.keys().index(link.node_1_id),nodes_.keys().index(link.node_2_id),1]
        #print  "ids: ", links[link.link_id]
        #print "positions: ", links_[link.link_id]
        try:
            type = link.types[0].templatetype.type_name
            if (type in links_types) == False:
                links_types.append(type)
        except:
            type = None

        links_.append({'id': link.link_id,'source':node_index[link.node_1_id],'target':node_index[link.node_2_id],'value':links_types.index(type)+1, 'type':type, 'name':link.link_name})




    #Get the min, max x and y coords
    extents = net.get_network_extents(network_id, **session)
    app.logger.info(node_coords)

    app.logger.info("Network %s retrieved", network.network_name)


    return render_template('network.html',\
                scenario_id=scenario_id,
                node_coords=node_coords,\
                links=links,\
                username=session['username'],\
                display_name=session['username'],\
                node_name_map=node_name_map,\
                extents=extents,\
                network=network,\
                           nodes_=nodes_,\
                           links_=links_)


if __name__ == "__main__":
    import os

    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)
