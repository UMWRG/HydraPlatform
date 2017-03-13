import pandas as pd
import numpy as np
import os
import json
from . import app
from flask import request, jsonify, abort, session, send_from_directory
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

@app.route('/get_ebsd_results/scenario/<scenario_id>/solution/<solution_id>')
@app.route('/get_ebsd_results')
def do_get_ebsd_results(scenario_id, solution_id):
    """
        Generate an excel file from the results of the ebse model (mga or non-mga).
        Mga / non mga is indicated by use of result ID.

        if no result id is provided to an mga scenario, an exception is thrown
    """
    app.logger.info("Generating excel file...")

    user_id = session['user_id']

    scenario = scenarioutils.get_scenario(scenario_id, user_id)
    app.logger.info("Scenario Retrieved")

    flow_df, cols = _get_flow_data(scenario, solution_id)

    balance_df = _get_balance_data(scenario, solution_id, cols)
    

    writer = pd.ExcelWriter('/tmp/EBSD_Results.xlsx', engine='xlsxwriter')
    flow_df.to_excel(writer, sheet_name='Flows')
    balance_df.to_excel(writer, sheet_name='Balance')
    
    workbook = writer.book
    #Formatting...
    worksheet = writer.sheets['Flows']
    worksheet = writer.sheets['Balance']

    writer.save()
    
    app.logger.info("File export complete.")
    
    return send_from_directory('/tmp/','EBSD_Results.xlsx', as_attachment=True)

def _get_balance_data(scenario, solution_id, cols):
    n = scenario.network
    
#    for ra in n.attributes:
#        if ra.attr.attr_name.lower() == 'cost':
#            ra_id = ra.resource_attr_id 
#            break
#
#    for rs in scenario.resourcescenarios:
#        if rs.resource_attr_id == ra_id:
#            costval = rs.dataset.value
#            all_results = json.loads(costval)
#            import pudb; pudb.set_trace()
#            sample_df = pd.read_json(json.dumps(all_results['0'])).transpose()
#            

    balance_cols = pd.MultiIndex.from_tuples(cols)

    idx_data = [
            ('Initial Supply demand Balance', 'Available DO'),
            ('Initial Supply demand Balance', 'DI_THR_DATA'),
            ('Initial Supply demand Balance', 'TOTAL_EXISTING_IMPORT'),
            ('Initial Supply demand Balance', 'TOTAL_EXISTING_EXPORT'),
            ('Exisiting Imports', 'test'),
            ('Exisiting Exports', 'test'),
            ('Selected Options', 'test', 'test1'),
            ('Final Supply Demand Balance', 'bal'),
          ]

    idx = pd.MultiIndex.from_tuples(idx_data)

    xl_df = pd.DataFrame(index=idx, columns=balance_cols)

    return xl_df

def _get_flow_data(scenario, solution_id):
    app.logger.info('Getting Flow Data')

    flows = {}
    flow_attr_id = None
    jn_attr_id = None
    link_nodes = {}
    link_jns = {}

    #Identify the 'flow' attribute by its name, 'Q'
    for rs in scenario.resourcescenarios:
        ra = rs.resourceattr
        a = ra.attr
        #Only interested in Links
        if ra.link is None:
            continue
        else:
            link_nodes[ra.link.link_name] = (ra.link.node_a.node_name, ra.link.node_b.node_name)
            #Avoid interrogating the attribute each time, if the correct attr ID is known
            if flow_attr_id is not None and ra.attr_id == flow_attr_id:
                flows[ra.link.link_name] = rs.dataset.value
            elif a.attr_name == 'Q':
                flow_attr_id = a.attr_id
                flows[ra.link.link_name] = rs.dataset.value
            elif jn_attr_id is not None and ra.attr_id == jn_attr_id:
                link_jns[ra.link.link_name] = rs.dataset.value
            elif a.attr_name == 'jun_node':
                jn_attr_id = a.attr_id
                link_jns[ra.link.link_name] = rs.dataset.value


    app.logger.info("Flow data extracted")
    flow_dfs = {}
    for linkname in flows:
        try:
            all_results = json.loads(flows[linkname])
        except:
            raise Exception("Flow value on link %s is not valid. Unable to parse JSON."%(linkname))
        result = all_results.get(str(solution_id))
        if result is None:
            raise Exception("Unable to find data for sultion %s on link %s "%(solution_id, linkname))

        #
        flowdf = pd.read_json(json.dumps(result)).transpose()
        
        #If all the values are 0, then there is no flow, hence the option was never chosen
        x = flowdf == 0
        y = x.all()

        if y.all() == False:
            flow_dfs[linkname] = pd.read_json(json.dumps(result)).transpose()
        

    app.logger.info("Flow data converted to dataframes")

    linknames = flow_dfs.keys()

    cols = [
        ('Link', 'From'),
        ('Link', 'Jn'),
        ('Link', 'To'),
    ]

    #Get the column from the 1st entry in the flow_dfs
    sample_df = flow_dfs.values()[0]

    for c in sample_df.columns:
        for i in sample_df.index:
            cols.append((c, i))

    df_cols = pd.MultiIndex.from_tuples(cols)
    
    xl_df = pd.DataFrame(index=linknames, columns=df_cols)
    
    for linkname in flow_dfs:
        df = flow_dfs[linkname]
        xl_df[('Link', 'From')][linkname] = link_nodes[linkname][0]
        xl_df[('Link', 'Jn')][linkname]   = link_jns[linkname]
        xl_df[('Link', 'To')][linkname]   = link_nodes[linkname][1]

        for c in df.columns:
            for i in df.index:
                xl_df[(c, i)][linkname] = df[c][i]

    return xl_df, cols[3:]


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







            
