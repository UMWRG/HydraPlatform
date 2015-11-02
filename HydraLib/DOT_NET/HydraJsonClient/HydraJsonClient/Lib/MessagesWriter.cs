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
using System.Xml;

namespace HydraJsonClient.Lib
{
   public  class MessagesWriter
    {
       static public string plugin_name="";
       static bool is_error_reporter = false;

       static public void writeMessage(string message)       
       {
           Console.WriteLine(DateTime.Now+": "+message);
           logWriter.Writelog(message, "Informal");
       }
       // add message to the current line
       static public void addMessage(string message)
       {
           Console.Write(message);
       }

       static public void writeProgressMessage(int current, int total)
       {
           Console.WriteLine("!!Progress "+ current+"/"+total);           
       }

       static public void writeErrorMessage(string error_message, string network_id, string scenario_id)
       {
           if (!is_error_reporter)
           {             
               error_message = createXmlResultMessage(error_message, "", "", network_id, scenario_id);
               is_error_reporter = true;
               Console.ForegroundColor = ConsoleColor.Red;
               Console.Error.WriteLine(DateTime.Now + ": Error: " + error_message);
               logWriter.Writelog(error_message, "Error");
               //Console.ReadKey();
               Environment.Exit(0);
           }
       }

       static public void writeErrorMessage(string error_message)
       {
           if (!is_error_reporter)
           {
               error_message = createXmlResultMessage(error_message, "", "", "", "");
               is_error_reporter = true;
               Console.ForegroundColor = ConsoleColor.Red;
               Console.Error.WriteLine(DateTime.Now + ": Error: " + error_message);
               logWriter.Writelog(error_message, "Error");
               //Console.ReadKey();             
               Environment.Exit(0);
           }
       }

       static public void writeWarningMessage(string warning_message)
       {
           Console.WriteLine(DateTime.Now + ": Warning: " + warning_message);
           logWriter.Writelog(warning_message, "Warning");
       }

       // create xml message which contains the plugin run result
       static public string createXmlResultMessage(string erros, string message, string warning, string network_id, string scenarion_id)
       {
           if (is_error_reporter)
               return "";
           
           XmlDocument doc = new XmlDocument();
           XmlElement element = (XmlElement)doc.AppendChild(doc.CreateElement("plugin_result"));
           element.AppendChild(doc.CreateElement("message")).InnerText = message;
           element.AppendChild(doc.CreateElement("plugin_name")).InnerText = plugin_name;
           element.AppendChild(doc.CreateElement("network_id")).InnerText = network_id;
           element.AppendChild(doc.CreateElement("scenario_id")).InnerText = scenarion_id;
           element.AppendChild(doc.CreateElement("errors")).InnerText = erros;
           element.AppendChild(doc.CreateElement("warnings")).InnerText = warning;
           StringBuilder sb = new StringBuilder();
           XmlWriterSettings settings = new XmlWriterSettings
           {
               Indent = true,
               IndentChars = "  ",
               NewLineChars = "\r\n",
               NewLineHandling = NewLineHandling.Replace
           };
           using (XmlWriter writer = XmlWriter.Create(sb, settings))
           {
               doc.Save(writer);
           }           
           return sb.ToString();
       }
    }
}
