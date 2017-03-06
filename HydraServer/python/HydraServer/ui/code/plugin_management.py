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


import time
import logging

from redis import Redis
from rq import Queue

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
        self.job_queue = Queue(connection=Redis())

        self.installed_apps = self.job_queue.enqueue(self.scan_apps)

    def scan_apps(self):
        """Scan installed Apps and retrieve necessary information.
        Function for scheduled execution.
        """
        pass

    def expunge_job(self):
        """Delete finished job from list as it reaches a certain age.
        Function for scheduled execution.
        """
        pass


class App(object):
    """A class representing an installed App.
    """

    def __init__(self):
        pass

    def parse_appdef(self, pxml=None):
        """Parse the plugin.xml file.
        """
        pass

    def default_parameters(self):
        """Return default parameters defined in plugin.xml
        """
        pass


class AppJob(object):
    """A class defining a disposable app job instance. The instance holds
    information on one single execution of an App, its arguments, status, etc.
    """

    def __init__(self, app, options=None):
        if options is None:
            self.options = app.default_parameters()
        else:
            self.options = options
        self.pid = None
        self.timestamp = time.time()

    @property
    def status(self):
        """Return the status of the process.
        """
        pass

    def run(self):
        """Run the model (delayed).
        """
        pass
