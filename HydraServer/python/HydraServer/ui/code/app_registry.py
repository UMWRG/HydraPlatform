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

from redis import Redis, StrictRedis
from rq import Queue, get_failed_queue, push_connection
from rq.job import Job

from datetime import datetime

from HydraLib import config

from app_util import scan_installed_apps

log = logging.getLogger(__name__)


class AppRegistry(object):
    """A class holding all necessary information about installed Apps. Each App
    needs to be install in a folder specified in the config file. An App is
    identified by a 'plugin.xml' file.

    This class is the point of contact for UI functions.
    """

    def __init__(self):
        """Initialise job queue and similar...

        To execute jobs in the background a worker needs to be activated:

            $ rq worker
        """
        self.conn = StrictRedis()
        push_connection(self.conn)
        self.job_queue = Queue(connection=self.conn)

        self.installed_app_job = self.scan_apps()
        self.jobs = dict()  # indexed by pid

    def scan_apps(self):
        """Enqueue the scan_installed_apps function. Usually this will run fast,
        but we don't want to delay the server startup process.
        """
        plugin_path = config.get('plugin', 'default_directory')
        if plugin_path is None:
            log.critical("Plugin folder not defined in config.ini! "
                         "Cannot scan for installed plugins.")
            return None

        return self.job_queue.enqueue(scan_installed_apps, plugin_path)

    @property
    def installed_apps(self):
        return self.installed_app_job.result

    def create_job(self, app_id, network_id, scenario_id):
        """Create a job and run it.
        """
        appjob = self.installed_apps[app_id]
        newjob = self.job_queue.enqueue(appjob.run,
                                        {'network_id': network_id,
                                         'scenario_id': scenario_id})
        newjob.description = "%s, net: %s, scen: %s" % (appjob.name, network_id,
                                                        scenario_id)
        self.jobs[newjob.id] = newjob

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


# for testing only
if __name__ == '__main__':
    appreg = AppRegistry()
    time.sleep(1)
    appreg.create_job(appreg.installed_apps.keys()[0], 0, 0)
    import pudb
    pudb.set_trace()
