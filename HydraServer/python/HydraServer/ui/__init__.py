from flask import Flask, jsonify, Response, json, request, session, redirect, url_for, escape

import requests

import logging

from HydraServer.lib import project as proj
from HydraServer.lib import network as net

from HydraServer.util.hdb import login_user
from HydraServer.soap_server.hydra_base import get_session_db

from flask import render_template

from werkzeug import secure_filename
import zipfile
import os
import sys
import subprocess
import importlib

UPLOAD_FOLDER = 'uploaded_files'
ALLOWED_EXTENSIONS = set(['zip'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


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



@app.route('/header/<import_from>', methods=['GET'])
def go_import_network(import_from):
    if(import_from == 'csv'):
        return render_template('import_from_csv.html')
    elif (import_from=='pywr'):
        return render_template('import_from_pywr.html')



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

@app.route('/', methods=['GET', 'POST'])
def upload_file_():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('uploaded_file',
                                    filename=filename))
    return '''
        <!doctype html>
        <title>Upload new File</title>
        <h1>Upload new File</h1>
        <form action="" method=post enctype=multipart/form-data>
          <p><input type=file name=file>
             <input type=submit value=Upload>
        </form>
        '''

def allowed_file (filename):
    ext=os.path.splitext(filename)[1][1:].lower()
    if ext in ALLOWED_EXTENSIONS:
        return True
    else:
        return False

def create_network_from_pywr_json(directory):
    os.chdir(directory)
    if os.path.exists('pywr.json'):
        pass
    else:
        return ["pywr json file (pywr.json) is not found ..."]
    pp = os.path.realpath(__file__).replace("\\HydraServer\\python\HydraServer\\ui", "").split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    pywr_import=os.path.join(basefolder,"HydraPlugins", "pywr_app", "Importer","PywrImporter.py")
    cmd = "python " + pywr_import + " -f pywr.json "
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output = []
    while True:
        line = proc.stdout.readline()
        if line != '':
            output.append(line.replace('\n', '').strip())
        else:
            break
    return check_process_output(output)

def create_network_from_csv_files(directory):
    os.chdir(directory)
    if os.path.exists('network.csv'):
        pass
    else:
        return ["Network file (network.csv) is not found ...."]
    pp=os.path.realpath(__file__).replace("\\HydraServer\\python\HydraServer\\ui","").split('\\')
    pp1= pp[0: (len(pp)-1)]
    basefolder='\\'.join(pp1)
    csv_import=os.path.join(basefolder,"HydraPlugins", "CSVplugin", "ImportCSV","ImportCSV.py")
    #mname = os.path.dirname(csv_import)
    if os.path.exists('network.csv'):
        cmd="python "+csv_import+" -t network.csv -m template.xml -x "
    else:
        cmd = "python " + csv_import + " -t network.csv -x "
    proc = subprocess.Popen(cmd,stdout=subprocess.PIPE)
    output=[]
    while True:
        line = proc.stdout.readline()
        if line != '':
            output.append(line.replace('\n','').strip())
        else:
            break
    print output
    return check_process_output(output)

    '''
    #import ImportCSV
    mm=importlib.import_module(os.path.basename(csv_import).split('.')[0])
    if not os.path.exists(directory):
        os.makedirs(directory)
    os.chdir(directory)
    args={};
    args['-t']='network.csv'
    args['-m']='template.xml'
    args ['-x']=''
    run = getattr(mm, 'run')
    #ImportCSV(url=None , session_id=None)
    sys.argv=args
    run()
    '''


def check_process_output(output):
    if ("<message>Data import was successful.</message>" in output):
        for line in output:
            if line.startswith('<network_id>'):
                network_id = (line.replace('<network_id>', '').replace('</network_id>', ''))
            elif line.startswith('<scenario_id>'):
                scenario_id = (line.replace('<scenario_id>', '').replace('</scenario_id>', ''))
        return ["Data import was successful", network_id, scenario_id]
    return ["Error"]

@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
   if request.method == 'POST':
       try:
           file = request.files['file']
           type='csv'
       except Exception as e:
           file = request.files['file2']
           type='pywr'
       if allowed_file(file.filename):
           filename = secure_filename(file.filename)
           basefolder= os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
           zipfilename = os.path.join(basefolder, filename)
           extractedfolder= os.path.join(basefolder, 'temp')
           if not os.path.exists(extractedfolder):
               os.makedirs(extractedfolder)
           print zipfilename
           file.save(zipfilename)
           zip = zipfile.ZipFile(zipfilename)
           zip.extractall(extractedfolder)
           if type=='csv':
              output= create_network_from_csv_files(extractedfolder)
              if(len(output))==1:
                  return output[0]
              elif len(output)==3:
                  return redirect (url_for('go_network', network_id=output[1], scenario_id=output[2]))
              else:
                  return "Error"
           elif type =='pywr':
               output =create_network_from_pywr_json(extractedfolder)
               if (len(output)) == 1:
                   return output[0]
               elif len(output) == 3:
                   # return redirect(url_for('.go_network', network_id=output[1],scenario_id=output[2] ))
                   return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
       else:
           return "file is not uploaded, zip file is only allowed"


#example of using ajax, will be needed in the future for network editing
@app.route('/_add_numbers')
def add_numbers():
    a = request.args.get('a')
    b = request.args.get('b')
    zip_file="C:\\work\\zip\\data.zip"
    zip = zipfile.ZipFile(zip_file)
    zip.extractall("C:\\work\\zip")
    return jsonify(result=int(a) + int(b))




@app.route('/network', methods=['GET'])
def go_network():
    """
        Get a user's projects
    """
    app.logger.info(request.args['scenario_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']

    network = net.get_network(network_id, False, 'N', scenario_ids=[scenario_id], **session)



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
    nodes_ids=[]
    attr_id_name={}

    for attr in network.attributes:
        attr_id = attr_id = attr[len(attr) - 2]  # attr[0]
        attr_name = attr[len(attr) - 1]
        attr_id_name[attr_id] = attr_name

    for node in network.nodes:
        nodes_ids.append(node.node_id)
        for attr in node.attributes:
            attr_id = attr_id=attr[len(attr)-2]#attr[0]
            attr_name = attr[len(attr) - 1]
            attr_id_name[attr_id] = attr_name

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

        nodes_.append({'id':node.node_id, 'group': nodes_types.index(type) + 1, 'x':float(node.node_x),'y': float(node.node_y), 'name':node.node_name, 'type':type,'res_type':'node'})


    links = {}
    link_ids=[]

    for link in network.links:
        links[link.link_id] = [link.node_1_id, link.node_2_id]
        for attr in  link.attributes:
            attr_id=attr[len(attr)-2]#attr[0]
            attr_name=attr[len(attr)-1]
            attr_id_name[attr_id]=attr_name

        link_ids.append(link.link_id)
        try:
            type = link.types[0].templatetype.type_name
            if (type in links_types) == False:
                links_types.append(type)
        except:
            type = None

        links_.append({'id': link.link_id,'source':node_index[link.node_1_id],'target':node_index[link.node_2_id],'value':links_types.index(type)+1, 'type':type, 'name':link.link_name, 'res_type':'link'})

    nodes_ras=[]



    sys.path.insert(0, "F:\work\HydraPlatform\HydraServer\python\HydraServer\soap_server")

    from hydra_complexmodels import ResourceAttr, ResourceScenario

    node_resourcescenarios = net.get_attributes_for_resource(network_id, scenario_id, "NODE", nodes_ids, 'N')

    for nodes in node_resourcescenarios:
        ra = ResourceAttr(nodes.resourceattr)
        ra.resourcescenario = ResourceScenario(nodes, ra.attr_id)
        nodes_ras.append(ra)

    links_ras = []
    link_resourcescenarios = net.get_attributes_for_resource(network_id, scenario_id, "LINK", link_ids, 'Y')
    for linkrs in link_resourcescenarios:
        ra = ResourceAttr(linkrs.resourceattr)
        ra.resourcescenario = ResourceScenario(linkrs, ra.attr_id)
        links_ras.append(ra)

    nodes_attrs=[]
    for res in nodes_ras:
        #print "***===>",  res
        for node in network.nodes:
            if(node.node_id ==  res.ref_id):
                attrr_name=attr_id_name[res.attr_id]
                vv=json.loads(res.resourcescenario.value.value)
                if(res.resourcescenario.value.type == "timeseries"):

                    values_=[]
                    for index in vv.keys():
                        for date_ in sorted(vv[index].keys()):
                            value=vv[index][date_]
                            values_.append({'date':date_, 'value': value})
                    vv=values_

                nodes_attrs.append({'id':node.node_id,'attr_id': res.attr_id ,'attrr_name': attrr_name, 'type':res.resourcescenario.value.type, 'values':vv})

    links_attrs = []
    for res in links_ras:
        #print "***===>",  res
        for link in network.links:
            if (link.link_id == res.ref_id):
                attrr_name = attr_id_name[res.attr_id]
                try:
                    vv = json.loads(res.resourcescenario.value.value)
                except:
                    vv=res.resourcescenario.value.value
                if (res.resourcescenario.value.type == "timeseries"):
                    values_ = []
                    for index in vv.keys():
                        for date_ in vv[index].keys():
                            value = vv[index][date_]
                            values_.append({'date': date_, 'value': value})
                    vv = values_

                    links_attrs.append({'id': link.link_id, 'attr_id': res.attr_id, 'attrr_name': attrr_name,
                                    'type': res.resourcescenario.value.type, 'values': vv})

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
                           links_=links_, \
                           nodes_attrs=nodes_attrs, \
                           links_attrs=links_attrs)


if __name__ == "__main__":


    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)
