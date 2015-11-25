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

    public class AttributeData
    {
        public string name { get; set; }
        public string value { get; set; }
        public string dimension { get; set; }
        public string cr_date { get; set; }
        public int created_by { get; set; }
        public string hidden { get; set; }
        public string type { get; set; }
        public string id { get; set; }
        public string unit { get; set; }
        public Metadata[] o_metadata { get; set; }
        public string metadata { get; set; }
    }

    }
