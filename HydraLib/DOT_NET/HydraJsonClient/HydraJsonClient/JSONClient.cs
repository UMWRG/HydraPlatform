
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
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Runtime.Serialization.Json;


namespace HydraJsonClient
{
    public class JSONClient
    {
        public string webAddr { get; set;}
        public HttpWebRequest httpWebRequest { get; set; }
        public string r_method {get; set;}
        public User user {get; set;}
        public Cookie cookie { get; set;}
        public List<Cookie> cookies { get; set; }

        public JSONClient(string webAddr, User user )
        {
            this.user = user;
            this.webAddr = webAddr;
            if (string.IsNullOrEmpty(user.sessonid))                           
                getUser();            
        }

        public string getAllAtributes()
        {
            return callServer("get_all_attributes", new Hashtable());
        }

        public string getAllProjetcs()
        {
            return callServer("get_projects", new Hashtable());
        }

        public string getAllDimensions()
        {
            return callServer("get_all_dimensions", new Hashtable());
        }

       


        /*
         * send request to Hydra server and receive the respond using function name and its arguments
         * */

        public string callServer(string function, Hashtable args)
        {
            string result = "";
            try
            {                
                Hashtable jsontable=new Hashtable();
                jsontable.Add(function, args);
                JavaScriptSerializer js = new JavaScriptSerializer();
                js.MaxJsonLength = 50000000;
                string request=js.Serialize(jsontable);
                httpWebRequest = (HttpWebRequest)WebRequest.Create(webAddr);
                httpWebRequest.KeepAlive = false;
                httpWebRequest.Timeout = System.Threading.Timeout.Infinite;
                httpWebRequest.ProtocolVersion = HttpVersion.Version10;
                httpWebRequest.Method = "POST";
                addCookie();
                httpWebRequest.Headers.Add("sessionid", user.sessonid);
                using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                {
                    streamWriter.Write(request);
                    streamWriter.Flush();
                }
                var httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
                if (cookies == null && string.IsNullOrEmpty(user.sessonid))
                    this.getCokkie(httpResponse);


                using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
                {
                    result = streamReader.ReadToEnd();
                }
            }
            catch (System.Net.WebException ex)
            {
                string errormessage = "1: ";
                try
                {
                    using (var streamReader = new StreamReader(ex.Response.GetResponseStream()))
                    {
                        errormessage = streamReader.ReadToEnd();
                        MessagesWriter.writeErrorMessage("2: "+ex.Message + "\nDetailed server response: " + errormessage, "", "");
                    }
                }
                catch (System.NullReferenceException ex2)
                {
                    MessagesWriter.writeErrorMessage("3: No connection can be established ");
                }

            }
            catch (System.NullReferenceException ex)
            {
                MessagesWriter.writeErrorMessage("4: "+ex.Message, "", "");
            }
            catch (Exception ex)
            {
                MessagesWriter.writeErrorMessage(""+ex.Message, "", "");
            }
            return result;
        }

        /*
         * send request to Hydra server and receive the respond using string which represent function name and its arguments        
         * */
        public string callServer(string request)
        {            
            string result="";
            try 
            { 
                httpWebRequest = (HttpWebRequest)WebRequest.Create(webAddr);
                httpWebRequest.KeepAlive = false;
                httpWebRequest.Timeout = System.Threading.Timeout.Infinite;
                httpWebRequest.ProtocolVersion = HttpVersion.Version10;
                httpWebRequest.Method = "POST";
                addCookie();
                httpWebRequest.Headers.Add("sessionid", user.sessonid);
                 using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                    {                   
                        streamWriter.Write(request);
                        streamWriter.Flush();
                    }
                var httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
                if (cookies == null && string.IsNullOrEmpty(user.sessonid))
                    this.getCokkie(httpResponse);                                 
               
                using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
                    {
                         result = streamReader.ReadToEnd();
                    }
             }
            catch (System.Net.WebException ex)
            {                              
                string errormessage = "";
                try
                {
                    using (var streamReader = new StreamReader(ex.Response.GetResponseStream()))
                    {
                        errormessage = streamReader.ReadToEnd();
                        MessagesWriter.writeErrorMessage(ex.Message + "\nDetailed server response: " + errormessage, "", "");
                    }
                }
                catch (System.NullReferenceException ex2)
                {
                    MessagesWriter.writeErrorMessage("No connection can be established ");
                }
                                
            }
                catch (System.NullReferenceException ex)
            {
                MessagesWriter.writeErrorMessage(ex.Message, "", "");                
            }
            catch (Exception ex)
                {
                    MessagesWriter.writeErrorMessage(ex.Message, "", "");                
                }            
            return result;
        }

         void getUser()
            {            
                string res = callServer(user.getLoginParameters()); 
                JavaScriptSerializer js = new JavaScriptSerializer();
                try
                {

                    hydra_user uses = js.Deserialize<hydra_user>(res);
                    user.sessonid = uses.session_id;
                   
                }
                catch (System.Exception ex) {
                MessagesWriter.writeErrorMessage(ex.Message, "", "");
            }       
            }


         void getCokkie(HttpWebResponse httpResponse)
         {
             cookies = new List<Cookie>();
              for (int i = 0; i < httpResponse.Headers.Count; i++)
               {                    
                    string name = httpResponse.Headers.GetKey(i);

                    if (name != "Set-Cookie")
                        continue; 
                    string value = httpResponse.Headers.Get(i);
                    foreach (var singleCookie in value.Split(','))
                    {
                        Match match = Regex.Match(singleCookie, "(.+?)=(.+?);");
                        if (match.Captures.Count == 0)
                            continue;
                        cookies.Add(new Cookie(match.Groups[1].ToString(), 
                                match.Groups[2].ToString(), "/", httpWebRequest.Host.Split(':')[0]));
                    }
                }
         }
         
         public void addCookie()
         {
             if (cookies != null && cookies.Count>0)
             {                 
                 CookieContainer requestCookieContainer = new CookieContainer();

                 foreach (Cookie cookie in cookies)
                            requestCookieContainer.Add(cookie);                   
                 
                 httpWebRequest.CookieContainer = requestCookieContainer;
             }
             else
                 if(!string.IsNullOrEmpty(user.sessonid))
             {
                 CookieContainer requestCookieContainer = new CookieContainer();
                 requestCookieContainer.Add(new Cookie("beaker.session.id", user.sessonid, "/", httpWebRequest.Host.Split(':')[0]));
                 httpWebRequest.CookieContainer = requestCookieContainer;                   

             }
         }        


        }
    }

