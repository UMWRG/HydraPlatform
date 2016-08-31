import zipfile
import os
import sys
import subprocess
import importlib

from app_utilities import create_zip_file

def check_process_output(output):
    print "Check: ", output
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

def export_network_to_pywr_json(directory, zip_file_name, network_id, scenario_id, basefolder):
    output_file = os.path.join(directory, ('network_' + network_id + '.json'))
    os.chdir(directory)
    print basefolder
    pywr_import = os.path.join(basefolder, "Apps", "pywr_app", "Exporter", "PywrExporter.py")
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