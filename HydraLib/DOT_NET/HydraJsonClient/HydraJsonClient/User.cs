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
using System.Runtime.Serialization;


namespace HydraJsonClient
{
     
   public class User
    {   
    public string user_name {get; set;}    
    public string password { get; set; }    
    public int  user_id {get; set;}
    public string sessonid { get; set; }

    public User(string user_name, string password, string sessionid) 
        {
            this.user_name = user_name;
            this.password = password;
            this.sessonid = sessionid;
        }        

    public string getLoginParameters()
        {
           return  "{\"login\": {\"username\": \""+user_name+"\", \"password\": \""+password+"\"}}";
            
        }
    }
}
