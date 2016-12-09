from flask import  request, session, redirect, url_for, escape, send_file, jsonify, Markup
import json

from HydraServer.util.hdb import login_user
from HydraServer.soap_server.hydra_base import get_session_db

from flask import render_template

from werkzeug import secure_filename
import zipfile
import os
import sys
import datetime

from run_hydra_app import *


basefolder = os.path.dirname(__file__)

code= os.path.join(basefolder, 'code')
sys.path.insert(0, code)

from HydraServer.lib.objects import JSONObject, ResourceScenario

import logging
log = logging.getLogger(__name__)


from app_utilities import delete_files_from_folder, create_zip_file

import project_utilities as projutils
import network_utilities as netutils 
import attr_utilities as attrutils
import template_utilities as tmplutils
import dataset_utilities as datasetutils
import scenario_utilities as scenarioutils

from export_network import export_network_to_pywr_json, export_network_to_excel, export_network_to_csv

from import_network import import_network_from_csv_files, import_network_from_excel, import_network_from_pywr_json

from __init__ import app

from HydraServer.db import commit_transaction, rollback_transaction

global DATA_FOLDER
DATA_FOLDER = 'python/HydraServer/ui/data'

UPLOAD_FOLDER = 'uploaded_files'
TEMPLATE_FOLDER = 'hydra_templates'
ALLOWED_EXTENSIONS = set(['zip'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['TEMPLATE_FOLDER'] = TEMPLATE_FOLDER


# 'server/'
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
        projects = projutils.get_projects(user_id)
        app.logger.info("Logged in. Going to projects page.")
        return render_template('projects.html',
                               display_name=username,
                               username=username,
                               projects=projects)

# 'server/login'
@app.route('/login', methods=['GET', 'POST'])
def do_login():
    app.logger.info("Received login request.")
    if request.method == 'POST':
        try:
            user_id, api_session_id = login_user(request.form['username'], request.form['password'])
        except:
            app.logger.warn("Bad login for user %s", request.form['username'])
            return render_template('login.html',  msg="Unable to log in")

        session['username'] = request.form['username']
        session['user_id'] = user_id
        session['session_id'] = api_session_id

        app.logger.info("Good login %s. Redirecting to index (%s)"%(request.form['username'], url_for('index')))

        app.logger.info(session)

        return redirect(url_for('index'))

    app.logger.warn("Login request was not a post. Redirecting to login page.")
    return render_template('login.html',
                           msg="")

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

def check_session(req):
    session_db = get_session_db()

    session_id = request.headers.get('session_id')

    sess_info = session_db.get(session_id)

    if sess_info is None:
        raise Exception("No Session")

    sess_info = {'user_id':sess_info[0], 'username':sess_info[1]}

    return sess_info

@app.route('/header', methods=['GET'])
def go_about():
    return render_template('about.html')

@app.route('/templates', methods=['GET'])
def go_templates():
    user_id = session['user_id']
    all_templates = tmplutils.get_all_templates(user_id) 
    return render_template('templates.html', templates=all_templates)

@app.route('/get_templates', methods=['GET'])
def do_get_all_templates():
    user_id = session['user_id']
    all_templates = tmplutils.get_all_templates(user_id) 
    return all_templates

@app.route('/newtemplate', methods=['GET'])
def go_new_template():
    all_attributes = attrutils.get_all_attributes() 
    return render_template('template.html', 
                                new=True,
                              all_attrs=all_attributes,
                          )

@app.route('/template/<template_id>', methods=['GET'])
def go_template(template_id):

    user_id = session['user_id']
    all_attributes = attrutils.get_all_attributes() 
    tmpl = tmplutils.get_template(template_id, user_id)

    typeattr_lookup = {}

    for rt in tmpl.templatetypes:
        if rt.typeattrs is not None:
            typeattr_lookup[rt.type_id] = [ta.attr_id for ta in rt.typeattrs]
        else:
            typeattr_lookup[rt.type_id] = []
    
    attr_id_name_lookup = dict([(a.attr_id, a.attr_name) for a in all_attributes])
    attr_dimen_lookup = dict([(a.attr_id, a.attr_dimen) for a in all_attributes]) 

    app.logger.info(tmpl)
    return render_template('template.html',
                           new=False,
                           all_attrs=all_attributes,
                           attr_id_name_lookup=attr_id_name_lookup,
                           template=tmpl,
                           attr_dimen_lookup=attr_dimen_lookup,
                            typeattr_lookup=typeattr_lookup)


@app.route('/create_attr', methods=['POST'])
def do_create_attr():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    attr_j = JSONObject(d)

    newattr = attrutils.create_attr(attr_j, user_id) 
    
    commit_transaction()

    return newattr.as_json()

@app.route('/create_dataset', methods=['POST'])
def do_create_dataset():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    dataset_j = JSONObject(d)

    newdataset = datasetutils.create_dataset(dataset_j, user_id) 
    
    commit_transaction()
    
    app.logger.info(newdataset)
    return newdataset.as_json()

@app.route('/create_template', methods=['POST'])
def do_create_template():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    template_j = JSONObject(d)

    newtemplate = tmplutils.create_template(template_j, user_id) 
    
    commit_transaction()

    return newtemplate.as_json()


@app.route('/load_template', methods=['POST'])
def do_load_template():

    now = datetime.datetime.now().strftime("%y%m%d%H%M")

    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), TEMPLATE_FOLDER, now)
    if not os.path.exists(basefolder):
        os.mkdir(basefolder)
    
    user_id = session['user_id']

    template_file = request.files['import_file']

    template_file.save(os.path.join(basefolder, template_file.filename))

    f = open(os.path.join(basefolder, template_file.filename))
    f_arr = f.readlines()
    text = ''.join(f_arr)

    newtemplate = tmplutils.load_template(text, user_id) 
    
    commit_transaction()

    return newtemplate.as_json()

@app.route('/update_template', methods=['POST'])
def do_update_template():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    template_j = JSONObject(d)

    newtemplate = tmplutils.update_template(template_j, user_id) 
    
    commit_transaction()

    return newtemplate.as_json()

@app.route('/delete_template', methods=['POST'])
def do_delete_template(template_id):
    
    user_id = session['user_id']

    status = delete_template(template_id, user_id) 
    
    commit_transaction()

    return status

@app.route('/apply_template_to_network', methods=['POST'])
def do_apply_template_to_network(template_id, network_id):
    
    user_id = session['user_id']

    apply_template_to_network(template_id, network_id, user_id) 
    
    commit_transaction()

    return redirect(url_for('go_network', network_id=network_id))

@app.route('/project/<project_id>', methods=['GET'])
def go_project(project_id):
    """
        Get a user's projects
    """
    user_id = session['user_id']
    project = projutils.get_project(project_id, user_id)
    app.logger.info("Project %s retrieved", project.project_name)
    '''
    if the project has only one network and the network has only one scenario, it will display network directly
    '''
    network_types = tmplutils.get_all_network_types(user_id)
    return render_template('project.html',\
                              username=session['username'],\
                              display_name=session['username'],\
                              project=project,
                               all_network_types=network_types
                               )

@app.route('/create_network', methods=['POST'])
def do_create_network():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    d['scenarios'] = [{"name": "Baseline", "resourcescenarios":[]}]
    
    net_j = JSONObject(d)

    net = netutils.create_network(net_j, user_id) 
    
    commit_transaction()

    return net.as_json()

@app.route('/create_project', methods=['POST'])
def do_create_project():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    proj_j = JSONObject(d)

    proj = projutils.create_project(proj_j, user_id) 
    
    commit_transaction()

    return proj.as_json()




def allowed_file (filename):
    ext=os.path.splitext(filename)[1][1:].lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    else:
        return False

@app.route('/add_network_note/<network_id>/<note_text>', methods=['GET'])
def do_add_network_note(network_id, note_text):
    pass

@app.route('/network/<network_id>', methods=['GET'])
def go_network(network_id):
    """
        Get a network 
    """

    user_id = session['user_id']

    node_coords, links, node_name_map, extents, network, nodes_, links_ = netutils.get_network(network_id, user_id) 

    attr_id_name_map = netutils.get_attr_id_name_map()

    if network.types is not None and len(network.types) > 0:
        template_id = network.types[0].templatetype.template_id

        tmpl = tmplutils.get_template(template_id, user_id)
        #Build a map from type id to layout, to make it easy for the javascript
        #and html templates to access type layouts
        type_layout_map = {}
        for tmpltype in tmpl.templatetypes:
            layout = tmpltype.layout
            if layout == None:
                layout = {}
            type_layout_map[tmpltype.type_id] = layout
    else:
        tmpl = JSONObject({'templatetypes': []});
        type_layout_map = {}

    return render_template('network.html',\
                scenario_id=network.scenarios[0].scenario_id,
                node_coords=node_coords,\
                links=links,\
                username=session['username'],\
                display_name=session['username'],\
                node_name_map=node_name_map,\
                extents=extents,\
                network=network,\
                nodes_=nodes_,\
                links_=links_, \
                attr_id_name=attr_id_name_map,\
                template = tmpl,\
                type_layout_map=type_layout_map)

@app.route('/add_node', methods=['POST'])
def do_add_node():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    node_j = JSONObject(d)

    newnode = netutils.add_node(node_j, user_id) 
    
    commit_transaction()
    
    app.logger.info("Node %s added. New ID of %s",newnode.node_name, newnode.node_id)

    return newnode.as_json()


@app.route('/update_node', methods=['POST'])
def do_update_node():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    node_j = JSONObject(d)

    updatednode = netutils.update_node(node_j, user_id) 
    
    commit_transaction()
    
    app.logger.info("Node %s updated.",updatednode.node_name)

    return updatednode.as_json()


@app.route('/add_link', methods=['POST'])
def do_add_link():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    link_j = JSONObject(d)

    newlink = netutils.add_link(link_j, user_id) 
    
    commit_transaction()
    
    app.logger.info("Link %s added. New ID of %s",newlink.node_name, newlink.node_id)

    return newlink.as_json()


@app.route('/get_resource_data', methods=['POST'])
def do_get_resource_data():

    user_id = session['user_id']

    pars= json.loads(request.get_data())
    network_id = pars['network_id']
    scenario_id = pars['scenario_id']
    resource_id= pars['res_id']
    resource_type=pars['resource_type']

    app.logger.info("Getting resource attributes for: %s", str(pars)) 
    resource, resource_scenarios=scenarioutils.get_resource_data(network_id,
                                                  scenario_id,
                                                  resource_type,
                                                  resource_id,
                                                  user_id)

    attr_id_name_map = netutils.get_attr_id_name_map()
    

    return render_template('attributes.html', 
                           attr_id_name_map=attr_id_name_map,
                           resource_scenarios=resource_scenarios.values(),
                           resource=resource,
                            resource_id=resource_id,
                            scenario_id=scenario_id,
                            resource_type=resource_type,)


@app.route('/update_resourcedata', methods=['POST'])
def do_update_resource_data():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    log.info(d)

    if len(d) == 0:
        return 'OK'

    rs_list = [ResourceScenario(rs) for rs in d['rs_list']]

    log.info(rs_list)
    
    scenarioutils.update_resource_data(d['scenario_id'], rs_list, user_id) 
    
    commit_transaction()
    
    return 'OK'

def get_model_file (network_id, model_file):
    model_file_ = 'network_' + network_id + '.gms'
    model_folder=os.path.join(basefolder, 'data', 'Models')
    directory=os.path.join(model_folder, network_id)
    #make folder
    if not os.path.exists(model_folder):
        os.makedirs(model_folder)
    if not os.path.exists(directory):
        os.makedirs(directory)
    server_model_name=os.path.join(directory, model_file_)
    print "server_model_name", server_model_name
    if model_file!= None:
        if(os.path. exists(server_model_name)):
            os.remove(server_model_name)
        os.rename(model_file, server_model_name)
    if os.path.isfile(server_model_name) ==True:
        return server_model_name
    else:
        return None


def get_pp_exe(app):
    if app.lower()=='gams':
        return os.path.join(basefolder, 'Apps', 'GAMSApp','GAMSAutoRun.exe' )
    elif app.lower() == 'pywr':
        return os.path.join(basefolder, 'Apps', 'Pywr_App', 'PywrAuto',  'PywrAuto.py')


def get_app_args (network_id, scenario_id, model_file):
    return {'t': network_id, 's': scenario_id, 'm': model_file}


def run_gams_app(network_id, scenario_id, model_file=None):
    exe=get_pp_exe('gams')
    print exe
    model_file =get_model_file(network_id, model_file)
    #model_file=get_model(network_id, model_file)
    print model_file
    if(model_file ==None):
        return jsonify({}), 202, {'Error': 'Model file is not available, please upload one'}
    args = get_app_args (network_id, scenario_id, model_file)
    pid=run_app(exe, args)
    return jsonify({}), 202, {'Address': url_for('appstatus',
                                                  task_id=pid)}


def run_pywr_app(network_id, scenario_id):

    exe=get_pp_exe('pywr')
    os.chdir(os.path.dirname(exe))

    exe="python " + exe
    args = {'t': network_id, 's': scenario_id}
    log.info("Running Pywr App at %s with args %s", exe, args)
    pid=run_app(exe, args, False)
    return jsonify({}), 202, {'Address': url_for('appstatus',
                                                  task_id=pid)}


@app.route('/status/<task_id>')
def appstatus(task_id):
    task, progress , total, status=get_app_progress(task_id)
    if task == True:
        response = {
            'current': progress,
            'total': total,
            'status': status
        }
    else:
        response = {
            'current': 100,
            'total': 100,
            'status':status
        }
    return jsonify(response)

@app.route('/import_uploader', methods=['POST'])
def import_uploader():
    uploaded_file=None
    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
    extractedfolder = os.path.join(basefolder, 'temp')
    if not os.path.exists(extractedfolder):
        os.makedirs(extractedfolder)
    else:
        delete_files_from_folder(extractedfolder)
    type= request.files.keys()[0]
    app_name=request.form['app_name']
    print type, app_name

    if(app_name.strip().startswith('ex')):#') =='ex_pywr'):
        print "It is from expor"
        network_id = request.form['network_id']
        scenario_id = request.form['scenario_id']
        if (int(network_id) == 0 or int(scenario_id) == 0):
            return "Error, no network and scenario are specified ..."
        else:
            return import_app(network_id, scenario_id, app_name)
    print "Work till here...", app_name
    file = request.files[type]
    if app_name != 'run_gams_model' and app_name != 'run_pywr_app' :
        if (file.filename == '' ) :
            return jsonify({}), 202, {'Error': 'No file is selected'}
        elif not allowed_file(file.filename) :
            return jsonify({}), 202, {'Error': 'zip file is only allowed'}
    if (file.filename != ''):
        filename = secure_filename(file.filename)
        uploaded_file = os.path.join(basefolder, filename)
        file.save(uploaded_file)

    if (app_name == 'run_gams_model'):
        network_id = request.form['network_id']
        scenario_id = request.form['scenario_id']
        return run_gams_app(network_id, scenario_id, uploaded_file)

    elif(app_name == 'run_pywr_app'):
        network_id = request.form['network_id']
        scenario_id = request.form['scenario_id']
        return run_pywr_app(network_id, scenario_id)


    zip = zipfile.ZipFile(uploaded_file)
    zip.extractall(extractedfolder)

    project_id = request.form['project_id']
    if(app_name== 'csv'):
        pid = import_network_from_csv_files(project_id, extractedfolder, basefolder)
    elif (app_name== 'pywr'):
        pid=import_network_from_pywr_json(project_id, extractedfolder, basefolder)
    elif (app_name== 'excel'):
        pid=import_network_from_excel(project_id, extractedfolder, basefolder)
    else:
        pid=type+ ' is not recognized.'

    print "PID: ", pid
    try:
        int (pid)
        return jsonify({}), 202, {'Address': url_for('appstatus',
                                                   task_id=pid)}
    except:
        return jsonify({}), 202, {'Error': pid}


def import_app(network_id, scenario_id, app_name):
    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
    directory = os.path.join(basefolder, 'temp')
    print "ex_pywr: ", basefolder
    delete_files_from_folder(directory)
    result=None
    zip_file_name = os.path.join(directory, ('network_' + network_id + '.zip'))
    if (app_name == 'ex_pywr'):
        result = export_network_to_pywr_json(directory, network_id, scenario_id, basefolder)
    elif (app_name == 'ex_excel'):
        result = export_network_to_excel(directory, network_id, scenario_id, basefolder)
    elif (app_name == 'ex_csv'):
        result = export_network_to_csv(directory, network_id, scenario_id, basefolder)
    else:
        return "application not recognized : "+app_name
    try:
        int(result)
        print "URL: ", url_for('appstatus',task_id=result)
        print "result ", result
        return jsonify({}), 202, {'Address': url_for('appstatus',
                                                     task_id=result), 'directory':directory}
    except:
        print "Error ..."
        return "Error: "+result

@app.route('/send_zip_files',  methods=['GET', 'POST'])
def send_zip_files():
        print "======>> Send methof id called ....", request.form

        pars = json.loads(Markup(request.args.get('pars')).unescape())
        print "Done 222"
        network_id = pars['network_id']
        scenario_id = pars['scenario_id']
        directory = pars['directory']
        print "Done 111", scenario_id
        return redirect(url_for('go_export_network', network_id=network_id,
                            scenario_id=scenario_id, directory=directory))


@app.route('/header/ <network_id>, <scenario_id>, <directory>' , methods=['POST','GET'])
def go_export_network(network_id, scenario_id, directory):
    zip_file_name = os.path.join(directory, ('network_' + network_id + '.zip'))
    create_zip_file(directory, zip_file_name)
    print zip_file_name
    print directory

    if not os.path.exists(zip_file_name):
        return "An error occurred!!!"

    return send_file(zip_file_name, as_attachment=True)
