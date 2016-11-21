import zipfile
import os
import sys
import subprocess
import importlib
from run_hydra_app import *

from app_utilities import create_zip_file, check_process_output

def export_network_to_pywr_json(directory, network_id, scenario_id, basefolder):
    output_file = os.path.join(directory, ('network_' + network_id + '.json'))
    os.chdir(directory)
    print basefolder
    pywr_export = os.path.join(basefolder, "Apps", "pywr_app", "Exporter", "PywrExporter.py")
    exe = "python " + pywr_export
    args = {"t": network_id, "s": scenario_id, "o": output_file}
    print "Arg: ", args
    out= run_app_(exe, args, False)
    print "Output: ", out
    return out


def export_network_to_excel(directory, network_id, scenario_id, basefolder):
    output_file = os.path.join(directory, ('network_' + network_id))
    args = {"t": network_id, "s": scenario_id, "o": output_file}
    excel_import = os.path.join(basefolder, "Apps", "ExcelApp", "ExcelExporter", "ExcelExporter.exe")
    os.chdir(directory)
    out = run_app_(excel_import, args, False)
    print "Output: ", out
    return out


def export_network_to_csv(directory, network_id, scenario_id, basefolder):
    os.chdir(directory)
    pp = basefolder.replace("\\python\HydraServer\\ui", "").split('\\')
    pp1 = pp[0: (len(pp) - 1)]
    basefolder = '\\'.join(pp1)
    csv_export = os.path.join(basefolder, "HydraPlugins", "CSVplugin", "ExportCSV", "ExportCSV.py")
    use_wd = False
    exe = "python " + csv_export

    args = {"t": network_id, "s": scenario_id, "o": directory}
    return run_app_(exe, args, use_wd)