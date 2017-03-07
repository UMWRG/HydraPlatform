import subprocess
import psutil
import os
from app_utilities import check_process_output, get_progress_from_output
import logging
log = logging.getLogger(__name__)

'''
run back ground process using the command and redircet the output to log file to be read later to get process progress ...
'''

def run_app(exe, args, use_wd=True):
    cmd = exe.split(' ') 
    for item in args:
        cmd.append('-'+item)
        cmd.append(args[item])

    if use_wd==True:
        print args, '----------------------------->'
        os.chdir(os.path.dirname(exe))

    f = open(os.path.join(".."+os.sep, ".."+os.sep,"log.txt"), "w")

    proc = subprocess.Popen(cmd, stdout=f)
    print proc
    print "Process id: ", proc.pid
    return proc.pid

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
        if proc.pid == pid and proc.status() != 'zombie':
            log.info("%s is found ===============> %s", pid, proc.status())
            isIt=True
            break

    logfile = os.path.join(".."+os.sep, ".."+os.sep, "log.txt")

    with open(logfile) as f:
        contents = f.read().splitlines()

    if(isIt == True):
        if len(contents)>0:
            status,  progress, total=get_progress_from_output(contents)
            print "===================>", progress, total, status
            print "status:2 ", status
            return isIt, progress, total, status
    else:
        status=check_process_output(contents)
        print "=======================>-------------------->===================>", status
        print contents
        progress=100,
        total=100
    print "status: ",  status
    return isIt, progress, total, status
