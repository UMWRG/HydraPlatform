How to develop a plug-in
========================

A quick introduction to the SOAP interface provided by the Hydra server.

General concepts
----------------

The client - server based architecture of Hydra allows very flexible plug-in
development. Basically a plug-in is a stand-alone executable which connects to
the server. The connection to the server is established using the SOAP protocol.
This implies that a plug-in can be written in any programming language that is
capable of implementing a client to a SOAP service. 


Developing a plug-in
--------------------

Connect to the server
*********************

- Config file
- SOAP interface


Creating a network instance
***************************

- using complex models

Building the network
********************

- The concept of temporary ID (negative) or ``name, (x, y)``

Nodes
^^^^^

Links
^^^^^

Adding data / attributes
************************

- Unique negative ID replaces the ID (for unsaved scenarios)

Hydra data types
^^^^^^^^^^^^^^^^

