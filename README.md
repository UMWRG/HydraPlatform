HydraPlatform
=============

### ***Warning***
#### This repository is deprecated. The hydra platform repository has been moved to https://github.com/hydraplatform


A library and web server for managing networks. Full documentation can be found [here](http://umwrg.github.io/HydraPlatform/).

Installation
------------
Hydra Platform is not a traditional python library, so must be installed
in a slightly different way:

1. Clone Hydra Platform
2. cd '/path/to/HydraPlatform/HydraServer'
3. Install the necessary dependencies: 'python setup.py develop'
**note if you are using linux, you need to remove the 'winpaths' entry from setup.py**
4. (a) Run the server (linux):
  i. chmod +x run_server.sh
  i(i. ./run_server.sh
5. (b) Run the server(windows)
	i. double-click on run_server.bat or in cmd.exe type run_server.bat in the HydraServer folder.

Dependencies
------------
    zope.sqlalchemy >= 0.4
    sqlalchemy
    numpy
    pandas
    bcrypt
    lxml
    mysql-connector-python
    suds
    spyne >= 2.12
    winpaths
    cheroot
    python-dateutil

FAQ
---
- CFFI won't install on Ubuntu!
  - If this occurs, make sure you have both "libffi-dev" and "python-dev" installed through apt-get. 
