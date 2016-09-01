from flask import  request, session, redirect, url_for, escape, send_file

from HydraServer.lib import project as proj

from HydraServer.util.hdb import login_user
from HydraServer.soap_server.hydra_base import get_session_db

from flask import render_template

from werkzeug import secure_filename
import zipfile
import os
import sys

pp = os.path.realpath(__file__).split('\\')
pp1 = pp[0: (len(pp) - 1)]
basefolder_ = '\\'.join(pp1)

basefolder = os.path.dirname(__file__)

code= os.path.join(basefolder, 'code')
sys.path.insert(0, code)

import logging
log = logging.getLogger(__name__)


from app_utilities import delete_files_from_folder

from network_utilities import get_network

from export_network import export_network_to_pywr_json

from import_network import import_network_from_csv_files, import_network_from_excel, import_network_from_pywr_json

from __init__ import app

UPLOAD_FOLDER = 'uploaded_files'
ALLOWED_EXTENSIONS = set(['zip'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


DATA_FOLDER = 'python/HydraServer/ui/data'

# 'server/'
@app.route('/')
def index():
    net_scn = {'network_id': 0, 'scenario_id': 0}
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
                               projects=projects,net_scn=net_scn)

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
    net_scn = {'network_id': 0, 'scenario_id': 0}
    return render_template('about.html', net_scn=net_scn)

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
        return render_template('import_from_csv.html', net_scn=net_scn, message=message)
    elif (import_from=='pywr'):
        return render_template('import_from_pywr.html',net_scn=net_scn, message=message)
    elif (import_from == 'excel'):
        if  os.name is 'nt':
            return render_template('import_from_excel.html', net_scn=net_scn, message=message)
        else:
            return "This feature is not available in this server !!!"

@app.route('/project/<project_id>', methods=['GET'])
def go_project(project_id):
    """
        Get a user's projects
    """
    project = proj.get_project(project_id, **session)
    app.logger.info("Project %s retrieved", project.project_name)
    '''
    if the project has only one network and the network has only one scenario, it will display network directly
    '''
    if len(project.networks)==1 and len(project.networks[0].scenarios)==1:
        return redirect(url_for('go_network', network_id=project.networks[0].network_id, scenario_id=project.networks[0].scenarios[0].scenario_id))
    else:
        net_scn = net_scn = {'network_id': 0, 'scenario_id': 0}
        return render_template('project.html',\
                              username=session['username'],\
                              display_name=session['username'],\
                              project=project, net_scn=net_scn
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


def allowed_file (filename):
    ext=os.path.splitext(filename)[1][1:].lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    else:
        return False

def get_uploaded_file_name(file_type):
    try:
        file = request.files[file_type]
        return file
    except Exception as e:
        return None

@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
   if request.method == 'POST':
       try:
           if get_uploaded_file_name('csv_file') != None:
               print "CSV from here"
               file = request.files['csv_file']
               type = 'csv'
           elif get_uploaded_file_name('pywr_file') != None:
               file = request.files['pywr_file']
               type = 'pywr'
           elif get_uploaded_file_name('excel_file') != None:
               file = request.files['excel_file']
               type = 'excel'
           if file.filename == '':
               return redirect(url_for('go_import_network', import_from=type, message="No file is selected"))
           if allowed_file(file.filename):
               filename = secure_filename(file.filename)
               basefolder= os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
               zipfilename = os.path.join(basefolder, filename)
               extractedfolder= os.path.join(basefolder, 'temp')
               if not os.path.exists(extractedfolder):
                   os.makedirs(extractedfolder)
               else:
                   delete_files_from_folder(extractedfolder)

               file.save(zipfilename)
               zip = zipfile.ZipFile(zipfilename)
               zip.extractall(extractedfolder)
               if type=='csv':
                  output= import_network_from_csv_files(extractedfolder, basefolder)
                  if(len(output))==1:
                      return redirect(url_for('go_import_network', import_from=type ,message=output[0]))
                  elif len(output)==3:
                      return redirect (url_for('go_network', network_id=output[1], scenario_id=output[2]))
                  else:
                      return redirect(url_for('go_import_network', import_from=type ,message='Error while improting the network!'))

               elif type =='pywr':
                   output =import_network_from_pywr_json(extractedfolder, basefolder)
                   if (len(output)) == 1:
                       return redirect(url_for('go_import_network', import_from=type, message=output[0]))
                   elif len(output) == 3:
                       return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
               elif type =='excel':
                   output =import_network_from_excel(extractedfolder, basefolder)
                   if (len(output)) == 1:
                       return redirect(url_for('go_import_network', import_from=type, message=output[0]))
                   elif len(output) == 3:
                       return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
           else:
               return redirect(url_for('go_import_network', import_from=type, message="zip file is only allowed"))
       except Exception as e:
           error="error"
           if(e.message!=None and e.message!=""):
               error=e.message
           return redirect(url_for('go_import_network', import_from=type, message=error))


@app.route('/network', methods=['GET'])
def go_network():
    """
        Get a user's projects
    """
    app.logger.info(request.args['scenario_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']
    node_coords, links, node_name_map, extents, network, nodes_, links_, nodes_attrs, net_scn, links_attrs=get_network(network_id, scenario_id, session, app)

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
                           nodes_attrs=nodes_attrs, net_scn=net_scn, \
links_attrs=links_attrs)



