import pandas as pd
import numpy as np
import os
import json
from . import app
from flask import request, jsonify, abort, session
import datetime

from code import scenario_utilities as scenarioutils
from code import attr_utilities as attrutils
from code import network_utilities as netutils

from werkzeug.exceptions import InternalServerError

from HydraLib.HydraException import HydraError, ResourceNotFoundError
from HydraServer.lib.objects import JSONObject, Dataset

from HydraServer.db import commit_transaction, rollback_transaction

@app.route('/upload_ebsd_data', methods=['POST'])
def do_upload_ebsd_data():
    """
        Read an excel file containing DO values (amongst others)
        for each WRZ.
        :params:
            scenario_id: int
            data_file: xlsfile
    """
    app.logger.info('test')

    data = request.get_data()
    user_id = session['user_id']
    
    if data == '' or len(data) == 0:
        app.logger.critical('No data sent')
        return jsonify({"Error" : "No Data Found"}), 400
    
    if len(request.files) > 0:
        data_file = request.files['data_file']
    else:
        return jsonify({"Error" : "No File Specified"}), 400

    scenario_id = int(request.form['scenario_id'])

    scenario = scenarioutils.get_scenario(scenario_id, user_id)

    network_id = scenario.network_id

    _process_data_file(data_file, network_id, scenario_id, user_id)

    if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles')):
        os.mkdir(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles'))
    
    now = datetime.datetime.now().strftime('%Y%m%d%H%M')
    data_file.save(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles' , now+'_'+data_file.filename))
    
    commit_transaction()

    app.logger.info("File read successfully")

    return jsonify({'status': 'OK', 'message': 'Data saved successfully'})

@app.route('/get_ebsd_results/<scenario_id>/<result_id>')
@app.route('/get_ebsd_results')
def do_get_ebsd_results(scenario_id, result_id):
    """
        Generate an excel file from the results of the ebse model (mga or non-mga).
        Mga / non mga is indicated by use of result ID.

        if no result id is provided to an mga scenario, an exception is thrown
    """
    app.logger.info("Generating excel file...")

    user_id = session['user_id']

    scenario = scenarioutils.get_scenario(scenario_id, user_id)


    app.logger.info("File export complete.")

    return jsonify({'adsf':'asdf'})

def _process_data_file(data_file, network_id, scenario_id, user_id):
    """
        Process the data file containing WRZ DO data amongst other things 

        returns a dictionary of values, keyed on WRZ name
    """
    app.logger.info('Processing data file %s', data_file.filename)

    xl_df = pd.read_excel(data_file, sheetname=None)

    attr_name_map = {
        'Distribution Input': 'DI',
        'Target Headroom' : 'THR',
        #'Potable Water Imported': ''
        #'Potable Water Exported': '',
        #'Deployable Output (baseline profile without reductions)': '',
        #'Baseline forecast changes to Deployable Output': '',
        #'Treatment Works Losses': '',
        #'Outage allowance': '',
        #'Water Available For Use (own sources)': '',
        #'Total Water Available For Use': '',
        
    }
    
    #These are the attributes which we know where they should go wihin Hydra.
    #This should be unnecessary when we have a full map of input files to hydra attributes
    known_attrs = attr_name_map.keys()


    all_attributes = attrutils.get_all_attributes() 

    attr_id_map = {}

    for a in all_attributes:
        if a.attr_name in attr_name_map.values():
            attr_id_map[a.attr_name] = a.attr_id

    wrzs = None
    wrz_nodes = []
    #Key = WRZ name
    #val = dict, keyed on attribute name
    #sub-val = hasahtable value, with scenario columns, time indices.
    attributes = {}
    for scenarioname, scenario_df in xl_df.items():
        app.logger.info("Processing scenario %s", scenarioname)
        if wrzs is None:
            #Get the unique wrz names
            wrzs = set(scenario_df['WRZ'])

            for w in wrzs:
                attributes[w.lower()] = {}
                try:
                    wrz_nodes.append(netutils.get_resource_by_name(network_id, 'NODE', w.lower(), user_id))
                except ResourceNotFoundError, e:
                    app.logger.warn('WRZ %s not found', w)
        
        for rowname in scenario_df.index:
            row = scenario_df.ix[rowname]
            wrzname = row['WRZ'].lower()
            attr_name = row['Component']

            if attr_name not in known_attrs:
                continue

            data = row[5:]
            data = data.replace(np.NaN, 0.0)
            
            db_attr_name = attr_name_map[attr_name]
            attr_id = attr_id_map[db_attr_name]

            if attributes[wrzname].get(attr_id):
                attributes[wrzname][attr_id][scenarioname] = dict(data)
            else:
                attributes[wrzname][attr_id] = {scenarioname : dict(data)}

    attr_ids = attr_id_map.values()
    new_rs = []
    for n in wrz_nodes:
        for a in n.attributes:
            if a.attr_id in attr_ids:
                new_rs.append(
                    JSONObject(dict(
                        resource_attr_id = a.resource_attr_id,
                        value =dict(
                            name      = 'EBSD dataset from file %s' % (data_file.filename),
                            type      =  'descriptor',        
                            value     = json.dumps(attributes[n.node_name.lower()][a.attr_id]),
                            metadata  =  {'data_type': 'hashtable'}
                        )
                    ))
                )

    for r in new_rs:
        r.value = Dataset(r.value)

    scenarioutils.update_resource_data(scenario_id, new_rs, user_id)







            
