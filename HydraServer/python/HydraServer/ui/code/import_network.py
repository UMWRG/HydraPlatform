import os
import sys
import subprocess

from export_network import check_process_output

def import_network_from_pywr_json(directory, basefolder):
    os.chdir(directory)
    if os.path.exists('pywr.json'):
        pass
    else:
        return ["pywr json file (pywr.json) is not found ..."]
    pp = basefolder.split('\\')
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

def import_network_from_excel(directory, basefolder):
    os.chdir(directory)
    excel_file=None
    for file in os.listdir(directory):
        if file.endswith(".xls") or file.endswith(".xlsx"):
            excel_file=file
            break
    if excel_file == None:
        return ["Excel file is not found ..."]
    pp = basefolder.split('\\')
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


def import_network_from_csv_files(directory, basefolder):
    os.chdir(directory)
    if os.path.exists('network.csv'):
        pass
    else:
        return ["Network file (network.csv) is not found ...."]
    pp = basefolder.replace("\\HydraServer\\python\HydraServer\\ui", "").split('\\')
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