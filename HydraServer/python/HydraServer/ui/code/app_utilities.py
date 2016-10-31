import os
import zipfile


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


def create_zip_file(directory, zip_file_name):
    for file in os.listdir(directory):
        zf = zipfile.ZipFile(zip_file_name, mode='a')
        print "adding file ...", file
        zf.write(file)
        zf.close()


def check_process_output(output):
    print "Check: ", output
    message='<message>'
    errors='<errors>'
    err=[]
    line1="<message>Run successfully</message>"
    line2 =r"<message>Data import was successful.</message>"
    if (line2 in output or line1 in output):
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