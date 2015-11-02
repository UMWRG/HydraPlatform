/*
# (c) Copyright 2015, University of Manchester
#
# HydraJsonClient is free software: you can redistribute it and/or modify
# it under the terms of the LGPL General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# HydraJsonClient is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# LGPL General Public License for more details.
# 
# You should have received a copy of the LGPL General Public License
# along with HydraJsonClient.  If not, see < http://www.gnu.org/licenses/lgpl-3.0.en.html/>
#
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
//
using HydraJsonClient;
using HydraJsonClient.Lib;
using HydraJsonClient.Hydra_Project;

namespace SampleProject
{
    class Program
    {
        /*
         * 
         * The user needs to set a reference to HydraJsonClient project
         * He can open it as a project in the solution, and set a reference to it 
         * or add a reference to HydraJsonClient.dll 
         * 
         * */
        static void Main(string[] args)
        {
            /**
             * The following parameters should be gotten from args or extracted from "hyra.ini", but for simplicity, they are hard coded in this example
             */
            int network_id = 2; // network id
            int [] scenario_ids = {2}; // scenarios ids
            string user_name = "root";
            string password = ""; //user password
            string server_addrs = "http://127.0.0.1:8080/json/";
            string sessionid = null; 

            /* 
             * if session id is provided, it will be used to connect to the server otherwsie, it will use user_name and password to connectto the server and get sessionid
             * */

            // intialize hydraNetworkExporter class with connection parameters
 
            NetworkExporter hydraNetworkExporter = new NetworkExporter(server_addrs, user_name, password, sessionid);

            // export the network with its id and scenarioa ids

            Network network = hydraNetworkExporter.exportNetworkWithData(network_id, scenario_ids);

            //it returned an object of Network class which contains all the network components and data  and the user has access to all of them

            MessagesWriter.writeMessage("\nNetwork: "+network.name+" is exported\nNo of nodes: "+network.nodes.Length+"\nNo of links: "+network.links.Length);

        }
    }
}
