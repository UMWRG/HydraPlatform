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
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace HydraJsonClient.Hydra_Project
{
     [DataContract]

    public class Resourcegroup
    {
        public string status { get; set; }
        public string description { get; set; }
        public int network_id { get; set; }
        public string cr_date { get; set; }
        public object[] attributes { get; set; }
        public int id { get; set; }
        public Res_Type[] types { get; set; }
        public string type { get; set; }

        public string name { get; set; }

         public Resourcegroup()
        {
            attributes = new object[0];
            status = "A";
        }
    }
}
