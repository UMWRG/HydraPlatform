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
import json
import time
import logging
import hashlib
import subprocess

from lxml import etree
from flask import jsonify
from datetime import datetime

from HydraLib import config

log = logging.getLogger(__name__)


class AppRegistry(object):
    """A class holding all necessary information about installed Apps. Each App
    needs to be install in a folder specified in the config file. An App is
    identified by a 'plugin.xml' file.

    This class is the point of contact for UI functions.
    """

    def __init__(self):
        """Initialise job queue and similar...
        """
        self.job_queue = JobQueue(config.get('plugin', 'queue_directory', None))

        self.installed_apps = self.scan_apps()

    def scan_apps(self):
        """Enqueue the scan_installed_apps function. Usually this will run fast,
        but we don't want to delay the server startup process.
        """
        plugin_path = config.get('plugin', 'default_directory')
        if plugin_path is None:
            log.critical("Plugin folder not defined in config.ini! "
                         "Cannot scan for installed plugins.")
            return None

        return scan_installed_apps(plugin_path)

    def create_job(self, app_id, network_id, scenario_id, user_id):
        """Create a job and run it.
        """
        appjob = self.installed_apps[app_id]
        newjob = self.job_queue.enqueue(appjob.run,
                                        {'network_id': network_id,
                                         'scenario_id': scenario_id})
        newjob.description = "%s, net: %s, scen: %s" % (appjob.name, network_id,
                                                        scenario_id)


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

    def run(self, options):
        """Execute the app.
        """
        log.info('Running app %s with options %s.' % (self.name, options))
        #TODO: do some magic to run the app

        import pudb
        pudb.set_trace()
        subprocess.check_call([self.dir, cmdargs])

        return "success"

    def info_as_json(self):
        """Return App info as json string.
        """
        return jsonify(self.info)

    def _from_xml(self, pxml=None):
        """Initialise app info from a given plugin.xml file.
        """
        self.pxml = pxml
        with open(self.pxml, 'r') as pluginfile:
            xmlroot = etree.parse(pluginfile).getroot()

        log.info("Loading xml: %s." % self.pxml)
        self.info['name'] = xmlroot.find('plugin_name').text
        self.info['description'] = xmlroot.find('plugin_description').text
        self.info['category'] = xmlroot.find('plugin_category').text
        self.info['command'] = xmlroot.find('plugin_command').text
        self.info['shell'] = xmlroot.find('plugin_shell').text
        self.info['location'] = xmlroot.find('plugin_location').text
        self.info['mandatory_args'] = \
                self._parse_args(xmlroot.find('mandatory_args'))
        self.info['non_mandatory_args'] = \
                self._parse_args(xmlroot.find('non_mandatory_args'))

    def _parse_args(self, argroot):
        """Parse arument block of plugin.xml.
        """

        args = []

        for arg in argroot.iterchildren():
            argument = AppArg()
            argument.from_xml(arg)
            args.append(argument)

        return args


class AppArg(object):
    """Class defining an argument to an App.
    """

    def __init__(self):
        self.switch = None
        self.name = None
        self.multiple = False
        self.argtype = None
        self.help = None
        self.defaultval = None
        self.allownew = None

    def from_xml(self, xmlarg):
        """Create an argument from an lxml.Element object.
        """

        self.switch = xmlarg.find('switch').text if xmlarg.find('switch') is not None else None
        self.name = xmlarg.find('name').text if xmlarg.find('name') is not None else None
        self.multiple = xmlarg.find('multiple').text if xmlarg.find('multiple') is not None else False
        self.argtype = xmlarg.find('argtype').text if xmlarg.find('argtype') is not None else None
        self.help = xmlarg.find('help').text if xmlarg.find('help') is not None else None
        self.defaultval = xmlarg.find('defaultval').text if xmlarg.find('defaultval') is not None else None
        self.allownew = xmlarg.find('allownew').text if xmlarg.find('allownew') is not None else None


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

    def enqueue(self, command, arguments, user):
        pass

    def list_jobs(self):
        pass

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
        self.app = None
        self.user = None
        self.network_id = None

    def create(self):
        pass

    @property
    def status(self):
        pass

    @property
    def is_finished(self):
        """Convenience function.
        """
        return True if self.status == 'finished' else False


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
    appreg = AppRegistry()

    import pudb
    pudb.set_trace()
