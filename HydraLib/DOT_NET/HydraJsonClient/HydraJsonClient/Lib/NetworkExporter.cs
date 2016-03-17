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
using HydraJsonClient.Hydra_Project;
using System.Web.Script.Serialization;
using System.Collections;

namespace HydraJsonClient.Lib
{
    public class NetworkExporter
    {
        JSONClient client; 

        public NetworkExporter(string server_addrs, string userName, string password, string sessionid)
        {
            User user = new User(userName, password, sessionid);
            client = new JSONClient(server_addrs, user);
        }

        public NetworkExporter(JSONClient client)
        {
            this.client = client;
        }

    
        public Network exportNetworkWithData(int network_id, int[] scenario_ids)
        {
            HydraNetworkUtil yh = new HydraNetworkUtil(network_id, scenario_ids);
            MessagesWriter.writeMessage("Requesting the network from the server");
            string hydra_respond = client.callServer("get_network", yh.getNetworkParameters());
            MessagesWriter.writeMessage("network is recieved from the server");            
            return getNetworkFromJsonString(hydra_respond);
        }

        public Network exportNetworkWithoutData(int network_id)
        {
            HydraNetworkUtil yh = new HydraNetworkUtil(network_id);
            MessagesWriter.writeMessage("Requesting the network from the server");
            string hydra_respond = client.callServer(yh.getNetworkWithoutDataStatement());
            MessagesWriter.writeMessage("network is recieved from the server");
            return getNetworkFromJsonString(hydra_respond);
        }


        public Network [] getAllNetworks(int projet_id)
        {
            Network[] networks=null;
            MessagesWriter.writeMessage("Requesting the networks list from the server");
            JavaScriptSerializer jss = new JavaScriptSerializer();
            jss.MaxJsonLength = 500000000;
            Hashtable args = new Hashtable();
            args["project_id"] = projet_id;
            try
            {                
                networks = jss.Deserialize<Network[]>(client.callServer("get_networks", args));
            }
            catch(System.Exception ex)
            { }
                return networks;
        }

        public Project[] getAllProjects()
        {
            JavaScriptSerializer jss = new JavaScriptSerializer();
            jss.MaxJsonLength = 500000000;
            Project [] projects = null;
            try
            {
                projects= jss.Deserialize<Project[]>(client.getAllProjetcs());
            }
            catch(System.Exception ex)
            {
            }
            return projects;
        }

        Network getNetworkFromJsonString(string hydra_respond)
        {
            Network network=null;
            JavaScriptSerializer jss = new JavaScriptSerializer();
            jss.MaxJsonLength = 500000000;
            try
            {
                network = jss.Deserialize<Network>(hydra_respond);
            }
            catch (System.Exception ex)
            {
                MessagesWriter.writeErrorMessage(ex.Message);
            }    

            return network;
        }

        public Hydra_Attr[] getAttributes()
        {
            JavaScriptSerializer jss = new JavaScriptSerializer();
            jss.MaxJsonLength = 500000000;
            Hydra_Attr[] atts = null;
            try
            {
                atts = jss.Deserialize<Hydra_Attr[]>(client.getAllAtributes());
            }
            catch (System.Exception ex)
            {
                MessagesWriter.writeErrorMessage(ex.Message);
            } 
        return atts;
         }

        public Rule[] getRulesForAScenario(int scenario_id)
        {
            Rule[] rules = null;
            Hashtable paras = new Hashtable();
            paras.Add("scenario_id", scenario_id);
            string hydra_respond = client.callServer("get_rules", paras);            
            try
            {
                JavaScriptSerializer jss = new JavaScriptSerializer();
                jss.MaxJsonLength = 500000000;
                rules = jss.Deserialize<Rule[]>(hydra_respond);
            }
            catch (System.Exception ex) {
                MessagesWriter.writeWarningMessage(ex.Message);
            }
            return rules;
        }

    }
}
