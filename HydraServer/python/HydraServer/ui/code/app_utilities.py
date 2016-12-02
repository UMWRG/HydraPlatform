import os
import shutil
import sys
import zipfile


def delete_files_from_folder(path_,maxdepth=12):
    files_list=[]
    for file in os.listdir(path_):
        files_list.append(os.path.join(path_, file))

    for path in files_list:
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
        except Exception, e:
            print e

            '''
            cpath=path.count(os.sep)
            for r,d,f in os.walk(path):
                if r.count(os.sep) - cpath <maxdepth:
                    for files in f:
                        try:
                            print "Removing %s" % (os.path.join(r,files))
                            os.remove(os.path.join(r,files))
                        except Exception,e:
                            print e
            '''
####################################################
def create_zip_file(path, zip_file_name):
    base_directory = os.path.dirname(path)
    files_directories_list = os.walk(path)
    try:
        zip_file = zipfile.ZipFile(zip_file_name, 'w', zipfile.ZIP_DEFLATED)
        for root, directories, files in files_directories_list:
            for directory in directories:
                real_path = os.path.join(root, directory)
                zip_path = real_path.replace(base_directory + '\\','')
                zip_file.write(real_path, zip_path)
            for file_name in files:
                if file_name==os.path.basename(zip_file_name):
                    continue
                real_path = os.path.join(root, file_name)
                zip_path = real_path.replace(base_directory + '\\','')
                zip_file.write(real_path, zip_path)
    except Exception, e:
        print e
        return e


    zip_file.close()

############################################################################
def check_process_output(output):
    output=strip_output_lines(output)
    scenario_id=0
    network_id=None

    print "Check: ", output
    message='<message>'
    errors='<errors>'
    err=[]
    line1="<message>Run successfully</message>"
    line2 ="<message>Data import was successful.</message>"
    line3="<message>Export complete</message>"
    if (line2 in output or line1 in output or line3 in output):
        print "-----------------------------------------------------------"
        for line in output:
            if line.startswith('<network_id>'):
                network_id = (line.replace('<network_id>', '').replace('</network_id>', ''))
            elif line.startswith('<scenario_id>'):
                scenario_id = (line.replace('<scenario_id>', '').replace('</scenario_id>', ''))
        return ["Data import was successful", network_id, scenario_id]
    else:
        for line in output:
            if line.startswith(message):
                message=line.replace(message,'')
                message=message.replace('</message>','')
            elif line.strip().startswith(errors):
                for i in range (output.index    (line)+1, len(output)-1):
                    if output[i].strip().startswith('</errors>'):
                        return 'Error: '+'\n'.join(err)
                    else:
                        err.append(output[i].replace('<error>','').replace('</error>',''))

    return ["Error"]


def strip_output_lines (output):
    new_outpute=[]
    for line in output:
        new_outpute.append(line.strip())
    return new_outpute


def get_progress_from_output(output):
    progress=0
    total=100
    status='Pending'
    output =strip_output_lines(output)
    for i in range( 0, len(output)):

        line = (output[len(output)-1-i])
        if line.startswith("!!Progress"):
            line = line.replace('!!Progress', '')
            line = line.split('/')
            if len(line) == 2:
                progress = int(line[0])
                total = int(line[1])
                status='Running'
                break
    return  status, progress, total