from flask import  request, session, redirect, url_for, escape, send_file, jsonify
import json

from HydraServer.lib import project as proj

from HydraServer.util.hdb import login_user
from HydraServer.soap_server.hydra_base import get_session_db

from flask import render_template

from werkzeug import secure_filename
import zipfile
import os
import sys


from run_hydra_app import *


pp = os.path.realpath(__file__).split('\\')
pp1 = pp[0: (len(pp) - 1)]
basefolder_ = '\\'.join(pp1)

basefolder = os.path.dirname(__file__)

code= os.path.join(basefolder, 'code')
sys.path.insert(0, code)

from HydraServer.ui.code.model import JSONObject 

import logging
log = logging.getLogger(__name__)


from app_utilities import delete_files_from_folder

import network_utilities as netutils 
import attr_utilities as attrutils
import template_utilities as tmplutils

from export_network import export_network_to_pywr_json

from import_network import import_network_from_csv_files, import_network_from_excel, import_network_from_pywr_json

from __init__ import app

from HydraServer.db import commit_transaction, rollback_transaction

global DATA_FOLDER
DATA_FOLDER = 'python/HydraServer/ui/data'

UPLOAD_FOLDER = 'uploaded_files'
ALLOWED_EXTENSIONS = set(['zip'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# 'server/'
@app.route('/')
def index():
    app.logger.info("Index")
    app.logger.info("Session: %s", session)
    if 'username' not in session:
        app.logger.info("Going to login page.")
        return render_template('login.html', net_scn=net_scn, msg="")
    else:
        user_id = session['user_id']
        username = escape(session['username'])
        projects = proj.get_projects(user_id, **{'user_id':user_id})
        app.logger.info("Logged in. Going to projects page.")
        return render_template('projects.html',
                               display_name=username,
                               username=username,
                               projects=projects)

# 'server/login'
@app.route('/login', methods=['GET', 'POST'])
def do_login():
    app.logger.info("Received login request.")
    net_scn = {'network_id': 0, 'scenario_id': 0}
    if request.method == 'POST':
        try:
            user_id, api_session_id = login_user(request.form['username'], request.form['password'])
        except:
            app.logger.warn("Bad login for user %s", request.form['username'])
            return render_template('login.html',net_scn=net_scn,  msg="Unable to log in")

        session['username'] = request.form['username']
        session['user_id'] = user_id
        session['session_id'] = api_session_id

        app.logger.info("Good login %s. Redirecting to index (%s)"%(request.form['username'], url_for('index')))

        app.logger.info(session)

        return redirect(url_for('index'))

    app.logger.warn("Login request was not a post. Redirecting to login page.")
    net_scn = {'network_id': 0, 'scenario_id': 0}
    return render_template('login.html',
                           net_scn=net_scn,
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
    
    app.logger.info(tmpl)
    return render_template('template.html',
                           new=False,
                           all_attrs=all_attributes,
                           template=tmpl,
                            typeattr_lookup=typeattr_lookup)


@app.route('/create_attr', methods=['POST'])
def do_create_attr():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    attr_j = JSONObject(d)

    newattr = attrutils.create_attr(attr_j, user_id) 
    
    commit_transaction()

    return newattr.as_json()

@app.route('/create_template', methods=['POST'])
def do_create_template():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    template_j = JSONObject(d)

    newtemplate = tmplutils.create_template(template_j, user_id) 
    
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

@app.route('/header/<export_to>, <network_id>, <scenario_id>, <message>' , methods=['GET', 'POST'])
def go_export_network(export_to, network_id, scenario_id, message):
    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
    directory = os.path.join(basefolder, 'temp')
    delete_files_from_folder(directory)
    if(export_to== 'pywr'):
        zip_file_name = os.path.join(directory, ('network_' + network_id + '.zip'))
        out_proce=export_network_to_pywr_json(directory,zip_file_name, network_id, scenario_id , basefolder_)
        if not os.path.exists(zip_file_name):
            return "An error occurred!!!"
        return send_file(zip_file_name, as_attachment=True)

@app.route('/header/<import_from>, <message>', methods=['GET'])
def go_import_network(import_from, message):
    net_scn = {'network_id': 0, 'scenario_id': 0}
    if(import_from == 'csv'):
        return render_template('run_app.html', net_scn=net_scn, message=message)
    elif (import_from=='pywr'):
        return render_template('import_from_pywr.html',net_scn=net_scn, message=message)
    elif (import_from == 'excel'):
        if  os.name is 'nt':
            return render_template('import_from_excel.html', net_scn=net_scn, message=message)
        else:
            return "This feature is not available in this server !!!"
'''
@app.route('/import_csv/<import_from>, <message>', methods=['GET'])
def go_import_network(import_from, message):
    net_scn = {'network_id': 0, 'scenario_id': 0}
    if (import_from == 'csv'):
        return render_template('run_app.html', net_scn=net_scn, message=message)
    elif (import_from == 'pywr'):
        return render_template('import_from_pywr.html', net_scn=net_scn, message=message)
    elif (import_from == 'excel'):
        if os.name is 'nt':
            return render_template('import_from_excel.html', net_scn=net_scn, message=message)
        else:
            return "This feature is not available in this server !!!"

'''
@app.route('/project/<project_id>', methods=['GET'])
def go_project(project_id):
    """
        Get a user's projects
    """
    user_id = session['user_id']
    project = proj.get_project(project_id, user_id=user_id)
    app.logger.info("Project %s retrieved", project.project_name)
    '''
    if the project has only one network and the network has only one scenario, it will display network directly
    '''
    if len(project.networks)==1 and len(project.networks[0].scenarios)==1:
        return redirect(url_for('go_network', network_id=project.networks[0].network_id, scenario_id=project.networks[0].scenarios[0].scenario_id))
    else:
        network_types = tmplutils.get_all_network_types(user_id)
        return render_template('project.html',\
                              username=session['username'],\
                              display_name=session['username'],\
                              project=project,
                               all_network_types=network_types
                               )
@app.route('/', methods=['GET', 'POST'])
def upload_file_():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('uploaded_file',
                                    filename=filename))
    return

@app.route('/create_network', methods=['POST'])
def do_create_network():
    
    user_id = session['user_id']

    d = json.loads(request.get_data())

    d['scenarios'] = [{"name": "Baseline", "resourcescenarios":[]}]
    
    net_j = JSONObject(d)

    net = netutils.create_network(net_j, user_id) 
    
    commit_transaction()

    return net.as_json()



def allowed_file (filename):
    ext=os.path.splitext(filename)[1][1:].lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    else:
        return False

@app.route('/network', methods=['GET'])
def go_network():
    """
        Get a user's projects
    """

    user_id = session['user_id']

    app.logger.info(request.args['scenario_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']
    node_coords, links, node_name_map, extents, network, nodes_, links_, net_scn, attr_id_name = netutils.get_network(network_id, scenario_id, session, app)

    template = None 
    template_id = network.types[0].templatetype.template_id
    tmpl = tmplutils.get_template(template_id, user_id)

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
                links_=links_, \
                net_scn=net_scn, \
                attr_id_name=attr_id_name,\
                template = tmpl)

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

'''
def long_task():
    """Background task that runs a long function with progress reports."""
    pidfilename = "c:\\temp\\test_process.txt"
    for i in range(1, 100):
        pidfile = open(pidfilename, 'a')
        line = "I is: " + str(i) + '\n'
        print line
        pidfile.write(line)
        pidfile.close()
        time.sleep(1)

    return {'current': 100, 'total': 100, 'status': 'Task completed!',
            'result': 42}
'''

@app.route('/get_res_attrs', methods=['POST'])
def get_res_attrs():
    pars= json.loads(request.form['para'])
    network_id = pars['network_id']
    scenario_id = pars['scenario_id']
    res_id= pars['res_id']
    resource_type=pars['resource_type']
    res_attrs=netutils.get_resource_attributes(network_id, scenario_id, resource_type, res_id, session)
    return jsonify(res_attrs=res_attrs)


def get_model_file (network_id):
    model_file_ = 'network_' + network_id + '.gms'
    return os.path.join(basefolder_, 'data', 'Models', model_file_)

def get_pp_exe(app):
    if app.lower()=='gams':
        return os.path.join(basefolder_, 'Apps', 'GAMSApp','GAMSAutoRun.exe' )

def get_app_args (network_id, scenario_id, model_file):
    return {'t': network_id, 's': scenario_id, 'm': model_file}


@app.route('/run_app', methods=['POST'])
def run_app():
    pars= json.loads(request.form['para'])
    network_id = pars['network_id']
    scenario_id = pars['scenario_id']
    exe=get_pp_exe('gams')
    model_file=get_model_file(network_id)
    args = get_app_args (network_id, scenario_id, model_file)
    pid=run_app_(exe, args)
    print "PID: ", pid
    return jsonify({}), 202, {'Address': url_for('appstatus',
                                                  task_id=pid)}



def run_gams_app(model_file, network_id, scenario_id):
    exe=get_pp_exe('gams')
    args = get_app_args (network_id, scenario_id, model_file)
    pid=run_app_(exe, args)
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
    print "===================>run App"
    type= request.files.keys()[0]
    app_name=request.form['app_name']
    print type, app_name

    file = request.files[type]
    if (file.filename == ''):
        return jsonify({}), 202, {'Error': 'No file is selected'}
    elif not allowed_file(file.filename) and app_name != 'run_model':
        return jsonify({}), 202, {'Error': 'zip file is only allowed'}

    filename = secure_filename(file.filename)
    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
    uploaded_file = os.path.join(basefolder, filename)
    extractedfolder = os.path.join(basefolder, 'temp')
    if not os.path.exists(extractedfolder):
        os.makedirs(extractedfolder)
    else:
        delete_files_from_folder(extractedfolder)

    file.save(uploaded_file)

    if (app_name == 'run_model'):
        network_id = request.form['network_id']
        scenario_id = request.form['scenario_id']
        return run_gams_app(uploaded_file, network_id, scenario_id)

    zip = zipfile.ZipFile(uploaded_file)
    zip.extractall(extractedfolder)


    if(app_name== 'csv'):
        pid = import_network_from_csv_files(extractedfolder, basefolder)
    elif (app_name== 'pywr'):
        pid=import_network_from_pywr_json(extractedfolder, basefolder)
    elif (app_name== 'excel'):
        pid=import_network_from_excel(extractedfolder, basefolder)
    else:
        pid=type+ ' is not recognized.'

    print "PID: ", pid
    try:
        int (pid)
        return jsonify({}), 202, {'Address': url_for('appstatus',
                                                   task_id=pid)}
    except:
        return jsonify({}), 202, {'Error': pid}



    '''
    if (len(output)) == 1:
        return jsonify({}), 202, {'Address': url_for('appstatus',
                                                     task_id=pid)}
        return redirect(url_for('go_import_network', import_from=type, message=output[0]))
    elif len(output) == 3:
        return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
    else:
        return redirect(url_for('go_import_network', import_from=type, message='Error while improting the network!'))
    '''
