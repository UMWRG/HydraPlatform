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

using HydraJsonClient.Lib;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HydraJsonClient.Lib
{
    public class logWriter
    {
        
        static string log_file=string.Empty;

        /*
         *  set log file name which is used to write the log messages to
         */ 
        public static void setLofFile(string log_file_name)
        {
            {
                string folder = Hydra_Utilities.getIniHydraFolder();

                if (string.IsNullOrEmpty(folder))
                {
                    folder = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);
                    log_file = folder + "\\" + log_file_name;
                }
                else              
                    log_file = folder + "\\log\\" + log_file_name;

                writeNewSessionMessage();
            }
        }

        /*
         * Write a message to log file
         */

        public static void Writelog(string log_message, string message_type)
        {
            if (string.IsNullOrEmpty(log_file) || !File.Exists(log_file))
                return;
             try
            {
                using (StreamWriter log_writer = File.AppendText(log_file))
                {
                    log_writer.WriteLine(DateTime.Now + ": " + message_type + ": " + log_message);
                }
            }
            catch (Exception ex) { }

        }

        static void writeNewSessionMessage()
        {
            try
            {
               using (StreamWriter log_writer = File.AppendText(log_file))
                {
                    log_writer.WriteLine("--------------------------------------------------");
                    log_writer.WriteLine(DateTime.Now + ": New session");
                    log_writer.WriteLine("--------------------------------------------------");
                }
            }
             catch (Exception ex) { }
        }        
    }
}
