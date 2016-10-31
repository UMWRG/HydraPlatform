import subprocess
import psutil
import json
import os
from app_utilities import create_zip_file, check_process_output


'''
run back ground process using the command and redircet the output to log file to be read later to get process progress ...
'''

def run_app_(exe, args):
    arg = ''
    for item in args.keys():
        arg = arg + ' -' + item + ' ' + args[item]
    cmd = exe + ' ' + arg
    print args, '----------------------------->'
    os.chdir(os.path.dirname(exe))
    f = open("..\\..\\log.txt", "w")

    proc = subprocess.Popen(cmd, stdout=f)
    print "Process id: ", proc.pid
    return proc.pid

    '''
    cmd = "python C:\work\csv_reader\process_tester.py"
    f = open("c:\\temp\\blah.txt", "w")
    proc = subprocess.Popen(cmd, stdout=f)

    print "Process id: ", proc.pid
    return proc.pid
    '''


'''
get running proces by its id and return its status i.e. still running or not
'''
def get_app_progress(pid):
    pid=int (pid)
    status = 'Pending'
    progress=0
    total=100
    isIt=False
    for proc in psutil.process_iter():
        if proc.pid == pid:
            isIt=True
            print pid , " is found ===============>", proc.status()
            break
    with open("..\\..\\log.txt") as f:
        contents = f.read().splitlines()

    if(isIt == True):
        if len(contents)>0:
            line =contents[len(contents)-1]
            if line.startswith("!!Progress"):
                line=line.replace('!!Progress', '')
                line=line.split('/')
                if len(line)==2:
                    progress=int (line[0])
                    total=int (line[1])
                    status="Running"
            else:
                progress=0
                total=100

            print "===================>", progress, total, status
            return isIt, progress, total, status
    else:
        status=check_process_output(contents)
        progress=100,
        total=100

    return isIt, progress, total, status