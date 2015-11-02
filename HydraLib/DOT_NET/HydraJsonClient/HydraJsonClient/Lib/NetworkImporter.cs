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
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using HydraJsonClient.Hydra_Project;

namespace HydraJsonClient.Lib
{
    public class NetworkImporter
    {
        public JSONClient client;
        JavaScriptSerializer jss;

        public NetworkImporter(string server_addrs, string userName, string password, string sessionid)
        {
            User user = new User(userName, password, sessionid);
            client = new JSONClient(server_addrs, user);
            jss = new JavaScriptSerializer();
            jss.MaxJsonLength = int.MaxValue;
        }

        public Hashtable getNetworkParameters(int network_id, int projectid)
        {
            Hashtable req_net = new Hashtable();
            if (projectid == -1)
                req_net.Add("network_id", network_id);
            else
                if (network_id==-1)
                    req_net.Add("project_id", projectid);
            req_net.Add("include_data", "N");
            req_net.Add("summary", "Y");
            req_net.Add("scenarios", new int[0]);
            return req_net;
        }

        public int getProjectIdForNetwork(int network_id)
        {
            int project_id = -1;          
            string net_string = client.callServer("get_network", getNetworkParameters(network_id, -1));

            var json_array = net_string.Split(',');
            foreach (string item in json_array)
            {
                if (item.Trim().StartsWith("\"project_id"))
                {
                    var project_part = item.Trim().Split(':');
                    try
                    {
                        project_id = Convert.ToInt32(project_part[1]);
                    }
                    catch (System.Exception ex)
                    { }
                }
            }
            return project_id;
        }

        public int getNetworIdkForProject(int project_id)
        {
            int network_id = -1;             
            string net_string = client.callServer("get_networks", getNetworkParameters(-1, project_id));
            var json_array = net_string.Split(',');
            foreach (string item in json_array)
            {
                if (item.Trim().StartsWith("\"network_id"))
                {
                    var project_part = item.Trim().Split(':');
                    try
                    {
                        network_id = Convert.ToInt32(project_part[1]);
                    }
                    catch (System.Exception ex)
                    { }
                }
            }            
            return network_id;
        }

        public Project addProject(Project project)
        {            
            Hashtable project_table = new Hashtable();
            project_table.Add("project", project);
            string pst = client.callServer("add_project",project_table);            
            project = jss.Deserialize<Project>(pst);
            return project;
        }      

        Hydra_Attr[] savettributes(List<Hydra_Attr> attrs)
        {         
            Hashtable attr_table = new Hashtable();
            attr_table.Add("attrs", attrs);
            string pst = client.callServer("add_attributes", attr_table);
            Hydra_Attr[] attrs_r = jss.Deserialize<Hydra_Attr[]>(pst);                                    
            return attrs_r;
        }

        // check if some or all the attributes already saved in Hydra, then create the ones which are not found

        public Hydra_Attr[] addAttributes(List<Hydra_Attr> attrs)
        {
            Hydra_Attr[] e_attributes = jss.Deserialize<Hydra_Attr[]>(client.getAllAtributes());
            Hydra_Attr[] atts = null;
            List<Hydra_Attr> not_new_attrs = new List<Hydra_Attr>();
            List<Hydra_Attr> existing_Attrs = new List<Hydra_Attr>();
            foreach (Hydra_Attr attribute in attrs)
                foreach (Hydra_Attr e_attribute in e_attributes)
                {                    
                    try
                    {
                        if (attribute.name.ToLower().Trim().Equals(e_attribute.name.ToLower().Trim()) && attribute.dimen.ToLower().Equals(e_attribute.dimen.ToLower()))
                        {
                            not_new_attrs.Add(attribute);
                            existing_Attrs.Add(e_attribute);
                            //break;
                        }
                    }
                    catch (System.Exception ex) {
                        //Console.WriteLine(attribute.name + "\n" + e_attribute.name + "\n" + attribute.dimen + "\natt: " + e_attribute.dimen);
                    }
                }
            foreach (Hydra_Attr attr in not_new_attrs)
            {             
                attrs.Remove(attr);
            }            
            atts = savettributes(attrs);
            int c_length = atts.Length;
           
            Array.Resize<Hydra_Attr>(ref atts, atts.Length + existing_Attrs.Count);
            existing_Attrs.CopyTo(atts, c_length);                       
            return atts;
        }

        public void assignTypesToRresources(ResourceType[] ress)
        {          
            Hashtable res_table = new Hashtable();
            res_table.Add("resource_types", ress);
            string result = client.callServer("assign_types_to_resources", res_table);
            
        }

        public Network  addNetwork(Network network)
          {                        
           Hashtable net_table = new Hashtable();
           net_table.Add("net", network);
           string post = client.callServer("add_network", net_table);
           Network network_r = jss.Deserialize<Network>(post);
           return network_r;
        }

        public Network updateNetwork(Network network)
        {         
            Hashtable net_table = new Hashtable();
            net_table.Add("net", network);
            string pst = client.callServer("update_network", net_table);
            Network network_2 = jss.Deserialize<Network>(pst);
            return network_2;
        }

        public Rule addRule(Rule rule, int scenario_id)
        {
            Hashtable rule_table = new Hashtable();
            rule_table.Add("rule", rule);
            rule_table.Add("scenario_id", scenario_id);
            string pst = client.callServer("add_rule", rule_table);
            //Network network_2 = jss.Deserialize<Network>(pst);
            Rule rule_ = jss.Deserialize<Rule>(pst);
            return rule_;;
        }

        public Resourcegroup addTemplate(string template_file)
        {
            System.IO.StreamReader streamReader = new System.IO.StreamReader(template_file);
            string template_text = "";
            int i=0;
            do
            {
                if(i==0)
                    template_text = streamReader.ReadLine();
                else
                    template_text = template_text + "%n" + streamReader.ReadLine();
                i += 1;
            }       
                  while (streamReader.Peek() != -1);
            streamReader.Close();
            template_text = template_text.Replace("\\", "\\\\");
            template_text = template_text.Replace("\"", "\\\"");
            template_text = template_text.Replace("%n", "\\n");
            template_text = System.Text.RegularExpressions.Regex.Replace(template_text, @"\s+", " ");
            string statment = "{\"upload_template_xml\": {\"template_xml\": \"" + template_text + "\"}}";
            string respond = client.callServer(statment);        
            Resourcegroup resourcegroup = jss.Deserialize<Resourcegroup>(respond);       
            return resourcegroup;                        
        }
    }
}

