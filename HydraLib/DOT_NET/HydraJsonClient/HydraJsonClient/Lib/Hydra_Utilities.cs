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

using Microsoft.Win32;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;
using System.Web.Script.Serialization;
using System.Globalization;

namespace HydraJsonClient.Lib
{
    public class Hydra_Utilities
    {
        // search local machine for hydra.ini file and read the Hydra connection parameters
        static public Hashtable readHydraIniFile()
         {
        Hashtable connection_parameters = new Hashtable();
        string ini_file = getInifile();
        if (System.IO.File.Exists(ini_file))
        {
            string port = "port";
            string domains = "domain";
            string user = "user";
            string password = "password";
            MessagesWriter.writeMessage("File: " + ini_file);
            string[] lines = System.IO.File.ReadAllLines(ini_file);
            for (int i = 0; i < lines.Length; i++)
            {
                if (connection_parameters.Contains(user) && connection_parameters.Contains(password) && connection_parameters.Contains(port) && connection_parameters.Contains(domains))
                    break;
                if (lines[i].Equals("[hydra_server]"))
                {

                    for (int j = i + 1; j < lines.Length; j++)
                    {
                        if (lines[j].StartsWith("port"))
                            connection_parameters.Add(port, lines[j].ToLower().Replace("port", "").Replace("=", "").Trim());
                        else
                            if (lines[j].StartsWith("domain"))
                                connection_parameters.Add(domains, lines[j].ToLower().Replace("domain", "").Replace("=", "").Trim());
                            else
                                if (lines[j].StartsWith("{"))
                                    break;
                        if (connection_parameters.Contains(port) && connection_parameters.Contains(domains))
                            break;
                    }
                }
                else
                    if (lines[i].Equals("[hydra_client]"))
                    {
                        Console.WriteLine("From Client ....");
                        for (int j = i + 1; j < lines.Length; j++)
                        {
                            if (lines[j].StartsWith("user"))                                
                                connection_parameters.Add(user, lines[j].ToLower().Replace("user", "").Replace("=", "").Trim());                            

                            else
                                if (lines[j].StartsWith("password"))
                                    connection_parameters.Add(password, lines[j].ToLower().Replace("password", "").Replace("=", "").Trim());
                                else
                                    if (lines[j].StartsWith("{"))
                                        break;

                            if (connection_parameters.Contains(user)&& connection_parameters.Contains(password))
                                break;
                        }
                    }
            }
        }
        else
            MessagesWriter.writeMessage("Could not find Hydra ini file ");        

        return connection_parameters;
      }

       static string getInifile()
        {
            return getIniHydraFolder()+ "\\hydra.ini";                  
        }

       public static string getIniHydraFolder()
       {
           string hydra_public_folder = ""; 
           string hydra_folder = Environment.GetFolderPath(Environment.SpecialFolder.CommonDocuments) + "\\hydra";
           if (!System.IO.Directory.Exists(hydra_folder))
           {
               hydra_folder = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData) + "\\hydra";
               if (System.IO.Directory.Exists(hydra_folder))
                   hydra_public_folder = hydra_folder;
           }
           else
               hydra_public_folder = hydra_folder;
           return hydra_public_folder;
       }
       
               // parse JSON string to Hashtable 

        public static Hashtable parseHashtable(string hashtable_string)
        {
            JavaScriptSerializer jss = new JavaScriptSerializer();           
            Hashtable hashtable = new Hashtable ();
            Hashtable retuned_values = new Hashtable();
            if (string.IsNullOrEmpty(hashtable_string))
                return hashtable;           
             try
             {
                  hashtable = jss.Deserialize<Hashtable>(hashtable_string);
             }
             catch(System.Exception ex)
             {
                 return null;
             }
            return hashtable;           
        }

        

    }
}
