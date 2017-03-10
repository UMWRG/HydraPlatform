# (c) Copyright 2013, 2014, University of Manchester
#
# HydraPlatform is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# HydraPlatform is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with HydraPlatform.  If not, see <http://www.gnu.org/licenses/>
#


import os
import sys
import glob
import time
import uuid
import logging
import hashlib
import subprocess

from lxml import etree
from datetime import datetime
from dateutil import parser as date_parser

from HydraLib import config

log = logging.getLogger(__name__)


class AppInterface(object):
    """A class providing convenience functions for the flask UI. 
    """

    def __init__(self):

        self.app_registry = AppRegistry()
        self.job_queue = JobQueue(config.get('plugin', 'queue_directory', None))
        self.job_queue.rebuild()

    def installed_apps_as_dict(self):
        """Return a list if installed apps as dict.
        """
        
        installedapps = []
        for key, app in self.app_registry.installed_apps.iteritems():
            appinfo = dict(id=key,
                           name=app.info['name'],
                           description=app.info['description'])
            installedapps.append(appinfo)

        return installedapps

    def app_info(self, app_id):
        return self.app_registry.installed_apps[app_id].info

    def run_app(self, app_id, network_id, scenario_id, user, options={}):
        app = self.app_registry.installed_apps[app_id]
        appjob = Job()
        appjob.create(app, network_id, scenario_id, user, options)
        self.job_queue.enqueue(appjob)
        return dict(jobid=appjob.id)

    def get_status(self, network_id=None, user_id=None, job_id=None):
        "Return the status of matching jobs."
        if job_id is not None:
            if job_id in self.job_queue.jobs.keys():
                return [dict(jobid=job_id,
                             status=self.job_queue.jobs[job_id].status)]
            else:
                return []
        else:
            matching_jobs = []
            for jid, job in self.job_queue.jobs.iteritems():
                if network_id is not None and user_id is not None:
                    if job.network_id == network_id and job.owner == user_id: 
                        matching_jobs.append(job)
                elif network_id is not None:
                    if job.network_id == network_id:
                        matching_jobs.append(job)
                elif user_id is not None:
                    if job.owner == user_id:
                        matching_jobs.append(job)

            response = []
            for job in matching_jobs:
                response.append(dict(jobid=job.id, status=job.status))
            return response


class AppRegistry(object):
    """A class holding all necessary information about installed Apps. Each App
    needs to be install in a folder specified in the config file. An App is
    identified by a 'plugin.xml' file.

    This class is the point of contact for UI functions.
    """

    def __init__(self):
        """Initialise job queue and similar...
        """
        self.install_path = config.get('plugin', 'default_directory')
        if self.install_path is None:
            log.critical("Plugin folder not defined in config.ini! "
                         "Cannot scan for installed plugins.")
            return None
        self.installed_apps = scan_installed_apps(self.install_path)

    def scan_apps(self):
        """Manually scan for new apps.
        """

        self.installed_apps = scan_installed_apps(self.install_path)


class App(object):
    """A class representing an installed App.
    """

    def __init__(self, pxml=None):
        self.info = dict()
        self._from_xml(pxml=pxml)

    @property
    def unique_id(self):
        """Create a persistent and unique ID for the app.
        """
        with open(self.pxml, 'r') as pluginfile:
            return hashlib.md5(pluginfile.read()).hexdigest()

    def default_parameters(self):
        """Return default parameters defined in plugin.xml
        """
        pass

    def cli_command(self, network_id, scenario_id, options):
        """Generate a command line command based on the network and scenario ids
        and a given set of options.
        """
        command_elements = []
        command_elements.append(self.shell)
        command_elements.append(os.path.join(self.location, self.command))

        # Work out the commandline option for network id and scenario id
        netid_switch = self._get_switch('network')
        scenid_switch = self._get_switch('scenario')

        command_elements.append(netid_switch)
        command_elements.append(str(network_id))
        command_elements.append(scenid_switch)
        command_elements.append(str(scenario_id))

        for opt, val in options.iteritems():
            opt_switch = self._get_switch(opt)

            # Handle true/false switches
            for arg in self.info['switches']:
                if arg['name'] == opt:
                    if val is True:
                        command_elements.append(arg['switch'])

            if opt_switch is not None:
                command_elements.append(opt_switch)
                command_elements.append(str(val))

        return ' '.join(command_elements)

    def _from_xml(self, pxml=None):
        """Initialise app info from a given plugin.xml file.
        """
        self.pxml = pxml
        with open(self.pxml, 'r') as pluginfile:
            xmlroot = etree.parse(pluginfile).getroot()

        log.debug("Loading xml: %s." % self.pxml)

        # Public properties
        self.info['name'] = xmlroot.find('plugin_name').text
        self.info['description'] = xmlroot.find('plugin_description').text
        self.info['category'] = xmlroot.find('plugin_category').text
        self.info['mandatory_args'] = \
                self._parse_args(xmlroot.find('mandatory_args'))
        self.info['non_mandatory_args'] = \
                self._parse_args(xmlroot.find('non_mandatory_args'))
        self.info['switches'] = \
                self._parse_args(xmlroot.find('switches'), isswitch=True)

        # Private properties
        self.command = xmlroot.find('plugin_command').text
        self.shell = xmlroot.find('plugin_shell').text
        self.location = os.path.join(os.path.dirname(pxml),
                                     xmlroot.find('plugin_location').text)

    def _parse_args(self, argroot, isswitch=False):
        """Parse arument block of plugin.xml.
        """

        args = []

        for arg in argroot.iterchildren():
            argument = AppArg()
            argument.from_xml(arg, isswitch=isswitch)
            args.append(argument)

        return args

    def _get_switch(self, resource):
        if resource == 'network':
            keywords = ['net', 'network']
        elif resource == 'scenario':
            keywords = ['scen', 'scenario']
        else:  # handle other options
            keywords = [resource]

        matching_args = dict()

        for arg in self.info['mandatory_args'] + \
                self.info['non_mandatory_args']:
            matchscore = 0
            for kw in keywords:
                if kw in arg['name']:
                    matchscore += 1

            # 'net_id' is better than 'net', 'id' is worse than 'net' --> 'id
            # gives half a point
            if 'id' in arg['name']:
                matchscore += .5
            matching_args[arg['switch']] = matchscore

        sortidx = sorted([(v,i) for i, v in enumerate(matching_args.values())])
        keyidx = sortidx[-1][1]
        if sortidx[-1][0] > 0.5:
            return matching_args.keys()[keyidx]
        else:
            return None


class AppArg(dict):
    """Extension of dict() read app arguments from an xml etree.
    """

    def from_xml(self, xmlarg, isswitch=False):
        """Create an argument from an lxml.Element object.
        """

        self.__setitem__('switch', xmlarg.find('switch').text 
                         if xmlarg.find('switch') is not None else None)
        self.__setitem__('name', xmlarg.find('name').text 
                         if xmlarg.find('name') is not None else None)
        self.__setitem__('help', xmlarg.find('help').text
                         if xmlarg.find('help') is not None else None)
        if isswitch is False:
            self.__setitem__('multiple', xmlarg.find('multiple').text
                             if xmlarg.find('multiple') is not None else False)
            self.__setitem__('argtype', xmlarg.find('argtype').text 
                             if xmlarg.find('argtype') is not None else None)
            self.__setitem__('defaultval', xmlarg.find('defaultval').text
                             if xmlarg.find('defaultval') is not None else None)
            self.__setitem__('allownew', xmlarg.find('allownew').text
                             if xmlarg.find('allownew') is not None else None)


class JobQueue(object):
    """Interact with a simple file based job queue. 

    The queue is organised using four folders:
    
    queued/
    running/
    finished/
    failed/
    
    Each job is a separate file containing the commandline to be executed. The
    filename and the job ID are identical.
    """

    def __init__(self, root):
        self.root = root 
        if self.root is None:
            self.root = os.path.expanduser('~/.hydra/jobqueue')
        log.info('Establish job queue in %s.' % self.root)

        if not os.path.isdir(self.root):
            log.debug('Creating folder %s.' % self.root)
            os.mkdir(self.root)

        self.folders = {'queued': 'queued',
                        'running': 'running',
                        'finished': 'finished',
                        'failed':  'failed',
                        }

        # Create folder structure if necessary
        for folder in self.folders.values():
            if not os.path.isdir(os.path.join(self.root, folder)):
                log.debug('Creating folder %s.' % folder)
                os.mkdir(os.path.join(self.root, folder))

        self.commentstr = '#'
        if 'win' in sys.platform:
            self.commentstr = 'rem'
        self.jobs = dict()

    def enqueue(self, job):
        job.enqueued_at = datetime.now()
        job.job_queue = self
        self.jobs[job.id] = job

        with open(os.path.join(self.root, self.folders['queued'], job.file), 'w') \
                as jobfile:
            jobfile.write('\n'.join(["%s owner=%s" % (self.commentstr,
                                                      job.owner),
                                     "%s network_id=%s" % (self.commentstr,
                                                           job.network_id),
                                     "%s scenario_id=%s" % (self.commentstr,
                                                            job.scenario_id),
                                     "%s created_at=%s" % (self.commentstr,
                                                           job.created_at),
                                     "%s enqueued_at=%s" % (self.commentstr,
                                                            job.enqueued_at),
                                     "\n"]))
            jobfile.write(job.command)
            jobfile.write('\n')

    def rebuild(self):
        """Rebuild job queue after server restart.
        """
        for folder in self.folders.values():
            for jr, jf, jobfiles in os.walk(os.path.join(self.root, folder)):
                for jfile in jobfiles:
                    exjob = Job()
                    exjob.from_file(os.path.join(jr, jfile))
                    exjob.job_queue = self
                    self.jobs[exjob.id] = exjob

    def expunge_old_jobs(self):
        """Delete finished job from list as it reaches a certain age.
        Function for scheduled execution.
        """
        for key, job in self.jobs.iteritems():
            if job.is_finished is True and \
                    (datetime.now - job.enqueued_at).total_seconds() > 86400:
                job.cleanup()
                job.delete()
                del self.jobs[key]


class Job(object):
    """A job object. Each job owns a job file within the JobQueue structure and
    belongs to one network and a user.
    """

    def __init__(self):
        self.id = None
        self.app = None
        self.owner = None
        self.network_id = None
        self.scenario_id = None
        self.command = None
        self.file = None
        self.created_at = None
        self.job_queue = None
        self.enqueued_at = None

    def create(self, app, network_id, scenario_id, owner, options):
        self.id = str(uuid.uuid4())
        self.app = app
        self.owner = owner
        self.network_id = network_id
        self.scenario_id = scenario_id
        self.command = app.cli_command(network_id, scenario_id, options)
        self.file = '.'.join([self.id, 'job'])
        self.created_at = datetime.now()

    def from_file(self, jobfile):
        """Reconstruct Job object from a file in the job queue folder.
        """

        self.file = os.path.basename(jobfile)
        self.id = self.file.split('.')[0]
        with open(jobfile, 'r') as jf:
            jobdata = jf.read()

        jobdata = jobdata.split('\n')
        for line in jobdata:
            if line.startswith('#') or line.startswith('rem'):
                if 'owner' in line:
                    self.owner = line.split('=')[-1]
                elif 'network_id' in line:
                    self.network_id = int(line.split('=')[-1])
                elif 'scenario_id' in line:
                    self.scenario_id = int(line.split('=')[-1])
                elif 'created_at' in line:
                    self.created_at = date_parser.parse(line.split('=')[-1])
                elif 'enqueued_at' in line:
                    self.enqueued_at = date_parser.parse(line.split('=')[-1])
            elif len(line) > 0:
                self.command = line

    @property
    def status(self):
        jobfilepath = glob.glob(self.job_queue.root + os.sep + '*' + os.sep +
                                self.file)[0]
        status = jobfilepath.replace(self.job_queue.root + os.sep, '')
        status = status.replace(os.sep + self.file, '')
        return status

    @property
    def is_queued(self):
        """Convenience function.
        """
        return True if self.status == 'queued' else False

    @property
    def is_running(self):
        """Convenience function.
        """
        return True if self.status == 'running' else False

    @property
    def is_finished(self):
        """Convenience function.
        """
        return True if self.status == 'finished' else False

    @property
    def is_failed(self):
        """Convenience function.
        """
        return True if self.status == 'failed' else False


def scan_installed_apps(plugin_path):
    """Scan installed Apps and retrieve necessary information. Returns a
    dictionary indexed by a hash of the 'plugin.xml' file to guarantee
    persistency after server restart and allow for the installation of
    different versions of the same App.
    """

    plugin_files = []
    for proot, pfolders, pfiles in os.walk(plugin_path):
        for item in pfiles:
            if item == 'plugin.xml':
                plugin_files.append(os.path.join(proot, item))

    installed_apps = dict()
    for pxml in plugin_files:
        app = App(pxml=pxml)
        appkey = app.unique_id
        installed_apps[appkey] = app

    return installed_apps


# for testing only
if __name__ == '__main__':
    appinterface = AppInterface()
    job1 = appinterface.run_app('a8f43cfadc154b1dfbc98aa13aca38b8', 1, 1,
                                'root', 
                                options={'dummyswitch': True,
                                         'dummy3': 3.14,
                                         'failswitch': False})
    job2 = appinterface.run_app('a8f43cfadc154b1dfbc98aa13aca38b8', 1, 1,
                                'another_user', 
                                options={'dummyswitch': True,
                                         'dummy3': 3.14,
                                         'failswitch': False})
    job3 = appinterface.run_app('a8f43cfadc154b1dfbc98aa13aca38b8', 2, 1,
                                'root', 
                                options={'failswitch': True, 'dummy3': 3.14})

    status1 = appinterface.get_status(user_id='root')  # Should return job1 & 3
    status2 = appinterface.get_status(network_id=1)    # Should return job1 & 2
    status3 = appinterface.get_status(network_id=1, user_id='root')  # returns job1

    import pudb
    pudb.set_trace()
