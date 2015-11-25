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

namespace HydraJsonClient.Lib
{
   public  class HydraNetworkUtil
    {
        public int  network_id { get; set; }
        public int template_id {get; set;}
        public int  [] scenario_ids {get; set;}

        public HydraNetworkUtil(int network_id, int[] scenario_ids)
        {
            this.network_id = network_id;
            this.scenario_ids = scenario_ids;
            
        }

        public HydraNetworkUtil(int network_id)
        {
            this.network_id = network_id;            

        }
        string get_scenario_ids_string()
        {
            string ids = "";
            int counter = 0;
            foreach(int id in scenario_ids)
            {
                if (counter == 0)
                    ids = id.ToString();
                else
                    ids = ids + ", " + id;
                counter += 1;

            }
            return ids;

        }

        public string getNetworkWithDataStatement()
        {
            
            return  "{\"get_network\": {\"network_id\":" + network_id + ", \"scenario_ids\": [" + get_scenario_ids_string() + "], \"template_id\": null, \"include_data\": \"Y\"}}"; ;
        }

       public Hashtable getNetworkParameters()
        {
            Hashtable net = new Hashtable();
            net.Add("network_id", network_id);
            net.Add("scenario_ids", scenario_ids);
            net.Add("template_id", null);
            net.Add("include_data", "Y");
            return net;

        }

        public string getNetworkWithoutDataStatement()
        {
            return "{\"get_network\": {\"network_id\": " + network_id + ", \"summary\": \"N\", \"include_data\": \"N\"}}";
        }
    }
}
