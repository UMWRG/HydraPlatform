import pandas as pd
import os
import json
from . import app
from flask import request, jsonify, abort
import datetime

from code import scenario_utilities as scenarioutils

from werkzeug.exceptions import InternalServerError

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
    
    if data == '' or len(data) == 0:
        app.logger.critical('No data sent')
        return jsonify({"Error" : "No Data Found"}), 400
    
    if len(request.files) > 0:
        data_file = request.files['data_file']
    else:
        return jsonify({"Error" : "No File Specified"}), 400

    scenario_id = int(request.form['scenario_id'])

    _process_data_file(data_file)

    if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles')):
        os.mkdir(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles'))
    
    now = datetime.datetime.now().strftime('%Y%m%d%H%M')
    data_file.save(os.path.join(app.config['UPLOAD_FOLDER'] , 'datafiles' , now+'_'+data_file.filename))

    app.logger.info("File read successfully")

    return jsonify({'status': 'OK', 'message': 'Data saved successfully'})

def _process_data_file(data_file):
    """
        Process the data file containing WRZ DO data amongst other things 

        returns a dictionary of values, keyed on WRZ name
    """
    app.logger.info('Processing data file %s', data_file.filename)

    xl_df = pd.read_excel(data_file, sheetname=None)

    wrzs = None
    for scenarioname, scenario_df in xl_df.items():

        if wrzs is None:
            #Get the unique wrz names
            wrzs = set(scenario_df['WRZ'])

    app.logger.info('WRZs: %s', wrzs)

    import pudb; pudb.set_trace()


