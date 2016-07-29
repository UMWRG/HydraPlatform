from flask import Flask, jsonify, Response, json, request, redirect, url_for, escape, send_file

import requests

import logging

from HydraServer.lib import project as proj
from HydraServer.lib import network as net

from HydraServer.lib import scenario as sen

from HydraServer.util.hdb import login_user

from flask import render_template

from werkzeug import secure_filename

import zipfile
import os
import sys
import subprocess
import importlib
from os.path import join
from functools import wraps
from HydraServer.soap_server.hydra_complexmodels import ResourceAttr, ResourceScenario

UPLOAD_FOLDER = 'uploaded_files'
ALLOWED_EXTENSIONS = set(['zip'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


DATA_FOLDER = 'python/HydraServer/ui/data'

app = Flask(__name__)


def requires_login(func):
    @wraps(func)
    def wrapped(*args, **kwargs):
        try:
            beaker_session = request.environ['beaker.session']
        except:
            app.logger.critical("No beaker information found!")
            return redirect(url_for('index'))
        try:
            user_id = beaker_session['user_id']
            return func(*args, **kwargs)
        except:
            app.logger.warn("Not logged in.")
            return redirect(url_for('index'))

    return wrapped

@app.route('/')
def index():

    app.logger.info("Index")
    session_info = request.environ.get('beaker.session')
    app.logger.info("Session: %s", session_info)
    if 'user_id' not in session_info:
        app.logger.info("Going to login page.")
        return render_template('login.html', msg="")
    else:
        user_id = session_info['user_id']
        username = escape(session_info['username'])
        projects = proj.get_projects(user_id, **{'user_id':user_id})
        app.logger.info("Logged in. Going to projects page.")
        net_scn={'network_id': 0,'scenario_id':0}

        return render_template('projects.html',
                               display_name=username,
                               username=username,
                               projects=projects,net_scn=net_scn)

@app.route('/login', methods=['GET', 'POST'])
def do_login():
    app.logger.info("Received login request.")
    if request.method == 'POST':
        try:
            user_id = login_user(request.form['username'], request.form['password'])
        except Exception, e:
            app.logger.exception(e)
            app.logger.warn("Bad login for user %s", request.form['username'])
            return render_template('login.html', msg="Unable to log in")

        request.environ['beaker.session']['username'] = request.form['username']
        request.environ['beaker.session']['user_id'] = user_id
        request.environ['beaker.session'].save()

        app.logger.info("Good login %s. Redirecting to index (%s)"%(request.form['username'], url_for('index')))

        app.logger.info(request.environ['beaker.session'])

        return redirect(url_for('index'))

    app.logger.warn("Login request was not a post. Redirecting to login page.")
    return render_template('login.html', msg="")

@app.route('/do_logout', methods=['GET', 'POST'])
def do_logout():
    app.logger.info("Logging out %s", request.environ['beaker.session']['username'])
    # remove the username from the session if it's there
    request.environ['beaker.session'].delete()
    app.logger.info(request.environ.get('beaker.session'))
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

@app.route('/header', methods=['GET'])
def go_about():
    return render_template('about.html')


'''
@app.route('/header', methods=['GET'])
def go_export_network():
    app.logger.info(request.args['scenario_id'])

    app.logger.info(request.args['network_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']


    print network_id,', scenario: '+scenario_id
    return "It iS Working ...network_id: "+network_id+', scenario: '+scenario_id
 '''


@app.route('/header/<export_to>, <network_id>, <scenario_id>, <message>' , methods=['GET', 'POST'])
def go_export_network(export_to, network_id, scenario_id, message):
    basefolder = os.path.join(os.path.dirname(os.path.realpath(__file__)), UPLOAD_FOLDER)
    directory = os.path.join(basefolder, 'temp')
    delete_files_from_folder(directory)
    if(export_to== 'pywr'):
        zip_file_name = os.path.join(directory, ('network_' + network_id + '.zip'))
        out_proce=export_network_to_pywr_json(directory,zip_file_name, network_id, scenario_id )
        if not os.path.exists(zip_file_name):
            return "An error occurred!!!"
        return send_file(zip_file_name, as_attachment=True)

def export_network_to_pywr_json(directory, zip_file_name, network_id, scenario_id):
    print "==============>", zip_file_name
    output_file = os.path.join(directory, ('network_' + network_id + '.json'))
    os.chdir(directory)
    pp = os.path.realpath(__file__).split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    pywr_import = os.path.join(basefolder, "Apps", "pywr_app", "Exporter", "PywrExporter.py")
    print "===>", pywr_import, output_file
    cmd = "python " + pywr_import + ' -t '+network_id+' -s '+scenario_id +' -o '+output_file
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output = []
    while True:
        line = proc.stdout.readline()
        if line != '':
            output.append(line.replace('\n', '').strip())
        else:
            break
    create_zip_file(directory, zip_file_name)

    return check_process_output(output)

def create_zip_file(directory, zip_file_name):
    for file in os.listdir(directory):
        zf = zipfile.ZipFile(zip_file_name, mode='a')
        print "adding file ...", file
        zf.write(file)
        zf.close()


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
@requires_login
def go_project(project_id):
    """
        Get a user's projects
    """

    project = proj.get_project(project_id, **request.environ['beaker.session'])
    app.logger.info("Project %s retrieved", project.project_name)
    '''
    if the project has only one network and the network has only one scenario, it will display network '''
    if len(project.networks)==1 and len(project.networks[0].scenarios)==1:
        return redirect(url_for('go_network', network_id=project.networks[0].network_id, scenario_id=project.networks[0].scenarios[0].scenario_id))
    else:
        return render_template('project.html',\
                          username=request.environ['beaker.session']['username'],\
                          display_name=request.environ['beaker.session']['username'],\
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

def create_network_from_excel(directory):
    os.chdir(directory)
    excel_file=None
    for file in os.listdir(directory):
        if file.endswith(".xls") or file.endswith(".xlsx"):
            excel_file=file
            break
    if excel_file == None:
        return ["Excel file is not found ..."]
    pp = os.path.realpath(__file__).split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    excel_import = os.path.join(basefolder, "Apps", "ExcelApp", "ExcelImporter", "ExcelImporter.exe")
    cmd =excel_import + " -i "+ directory+"\\"+ excel_file +" -m "+directory+"\\"+"template.xml"
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
    pp = os.path.realpath(__file__).replace("\\HydraServer\\python\HydraServer\\ui", "").split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    csv_import = os.path.join(basefolder, "HydraPlugins", "CSVplugin", "ImportCSV", "ImportCSV.py")
    # mname = os.path.dirname(csv_import)
    if os.path.exists('network.csv'):
        cmd = "python " + csv_import + " -t network.csv -m template.xml -x "
    else:
        cmd = "python " + csv_import + " -t network.csv -x "
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    output = []
    while True:
        line = proc.stdout.readline()
        if line != '':
            output.append(line.replace('\n', '').strip())
        else:
            break
    print output
    return check_process_output(output)


def create_network_from_pywr_json(directory):
    os.chdir(directory)
    if os.path.exists('pywr.json'):
        pass
    else:
        return ["pywr json file (pywr.json) is not found ..."]
    pp = os.path.realpath(__file__).split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    pywr_import=os.path.join(basefolder,"Apps","pywr_app", "Importer","PywrImporter.py")
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
        print line
        if line != '':
            output.append(line.replace('\n','').strip())
        else:
            break

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
    line1="<message>Run successfully</message>"
    line2 =r"<message>Data import was successful.</message>"
    if (line2 in output or line1 in output):
        for line in output:
            if line.startswith('<network_id>'):
                network_id = (line.replace('<network_id>', '').replace('</network_id>', ''))
            elif line.startswith('<scenario_id>'):
                scenario_id = (line.replace('<scenario_id>', '').replace('</scenario_id>', ''))
        return ["Data import was successful", network_id, scenario_id]
    return ["Error"]

def delete_files_from_folder(path,maxdepth=1):
    cpath=path.count(os.sep)
    for r,d,f in os.walk(path):
        if r.count(os.sep) - cpath <maxdepth:
            for files in f:
                try:
                    print "Removing %s" % (os.path.join(r,files))
                    os.remove(os.path.join(r,files))
                except Exception,e:
                    print e

def get_uploaded_file_name(file_type):
    try:
        file = request.files[file_type]
        return file
    except Exception as e:
        return None



@app.route('/uploader', methods = ['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
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
            print zipfilename
            file.save(zipfilename)
            zip = zipfile.ZipFile(zipfilename)
            zip.extractall(extractedfolder)
            if type=='csv':
                output= create_network_from_csv_files(extractedfolder)
                if(len(output))==1:
                    return redirect(url_for('go_import_network', import_from=type ,message=output[0]))
                    #return output[0]
                elif len(output)==3:
                    return redirect (url_for('go_network', network_id=output[1], scenario_id=output[2]))
                else:
                    return redirect(url_for('go_import_network', import_from=type ,message='Error while improting the network!'))
            elif type =='pywr':
                output =create_network_from_pywr_json(extractedfolder)
                if (len(output)) == 1:
                    return redirect(url_for('go_import_network', import_from=type, message=output[0]))
                elif len(output) == 3:
                    # return redirect(url_for('.go_network', network_id=output[1],scenario_id=output[2] ))
                    return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
            elif type =='excel':
                output =create_network_from_excel(extractedfolder)
                return redirect(url_for('go_network', network_id=output[1], scenario_id=output[2]))
            else:
                return redirect(url_for('go_import_network', import_from=type, message="zip file is only allowed"))



#example of using ajax, will be needed in the future for network editing
@app.route('/_add_numbers')
def add_numbers():
    a = request.args.get('a')
    b = request.args.get('b')
    zip_file="C:\\work\\zip\\data.zip"
    zip = zipfile.ZipFile(zip_file)
    zip.extractall("C:\\work\\zip")
    return jsonify(result=int(a) + int(b))



def get_dict(obj):
    if not  hasattr(obj,"__dict__"):
        return obj
    result = {}
    for key, val in obj.__dict__.items():

        if key.startswith("_"):
            continue
        if isinstance(val, list):
            element = []
            for item in val:
                element.append(get_dict(item))
        else:
            element = get_dict(obj.__dict__[key])
        result[key] = element
    return result


@app.route('/network', methods=['GET'])
@requires_login
def go_network():
    """
        Get a user's projects
    """
    app.logger.info(request.args['scenario_id'])

    scenario_id = request.args['scenario_id']
    network_id = request.args['network_id']

    network = net.get_network(network_id, False, 'Y', scenario_ids=[scenario_id], **request.environ['beaker.session'])

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

    node_resourcescenarios = net.get_attributes_for_resource(network_id, scenario_id, "NODE", nodes_ids, 'N')
    ii=0;
    for nodes in node_resourcescenarios:
        ii=ii+1
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
    for node_ in network.nodes:
        ress=sen.get_resource_data('NODE', node_.node_id, scenario_id, None, **request.environ['beaker.session'])
        for res in ress:
            attrr_name_ = attr_id_name[res.resourceattr.attr_id]
            try:
                vv = json.loads(res.dataset.value)
            except:
                vv = res.dataset.value

            if (res.dataset.data_type == "timeseries"):
                values_ = []
                for index in vv.keys():
                    for date_ in sorted(vv[index].keys()):
                        value = vv[index][date_]
                        values_.append({'date': date_, 'value': value})
                vv = values_
            nodes_attrs.append({'id': node_.node_id, 'attr_id': res.resourceattr.attr_id, 'attrr_name': attrr_name_,
                                'type': res.dataset.data_type, 'values': vv})

    links_attrs = []
    for link_ in network.links:
        ress = sen.get_resource_data('LINK', link_.link_id, scenario_id, None, **request.environ['beaker.session'])
        for res in ress:
            attrr_name_ = attr_id_name[res.resourceattr.attr_id]
            try:
                vv = json.loads(res.dataset.value)
            except:
                vv = res.dataset.value

            if (res.dataset.data_type == "timeseries"):
                values_ = []
                for index in vv.keys():
                    for date_ in sorted(vv[index].keys()):
                        value = vv[index][date_]
                        values_.append({'date': date_, 'value': value})
                vv = values_
            links_attrs.append({'id': link_.link_id, 'attr_id': res.resourceattr.attr_id, 'attrr_name': attrr_name_,
                                'type': res.dataset.data_type, 'values': vv})


    #Get the min, max x and y coords
    extents = net.get_network_extents(network_id, **request.environ['beaker.session'])
    app.logger.info(node_coords)

    app.logger.info("Network %s retrieved", network.network_name)

    net_scn={'network_id': network_id, 'scenario_id': scenario_id}

    return render_template('network.html',\
                scenario_id=scenario_id,
                node_coords=node_coords,\
                links=links,\
                username=request.environ['beaker.session']['username'],\
                display_name=request.environ['beaker.session']['username'],\
                node_name_map=node_name_map,\
                extents=extents,\
                network=network,\
                           nodes_=nodes_,\
                           links_=links_, \
                           nodes_attrs=nodes_attrs, net_scn=net_scn, \
links_attrs=links_attrs)


if __name__ == "__main__":


    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)
