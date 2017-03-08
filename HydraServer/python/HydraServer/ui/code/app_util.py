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

"""This module contains all functions that are executed as delayed or scheduled
function from the AppRegistry class and dependent classes. The reason for this
separate module is that python-rq can not hanlde functions defined in the
__main__ module.
"""


import os
import time
import hashlib
import logging
import subprocess

from lxml import etree

log = logging.getLogger(__name__)


class App(object):
    """A class representing an installed App.
    """

    def __init__(self, pxml=None):
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

        time.sleep(10)

        return "success"

    def _from_xml(self, pxml=None):
        """Initialise app from a given plugin.xml file.
        """
        self.pxml = pxml
        with open(self.pxml, 'r') as pluginfile:
            xmlroot = etree.parse(pluginfile).getroot()

        self.name = xmlroot.find('plugin_name').text
        self.description = xmlroot.find('plugin_description').text
        self.dir = xmlroot.find('plugin_dir').text
        self.mandatory_args = \
                self._parse_args(xmlroot.find('mandatory_args'))
        self.non_mandatory_args = \
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
