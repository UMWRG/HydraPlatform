package JSONClientLib;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;

import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.json.JSONObject;

public class JSONConnector {

	public String session_id;
	public String user_id;
	public String URL;
	
	public JSONConnector(String URL){
		this.URL = URL;
	}
	
	/*
	 * Call the remote 'login' function and return a session ID.
	 * @param username
	 * @param password
	 */
	public void login(String username, String password) throws HydraClientException{

		//Create the login Object
		JSONObject uname_pwd = new JSONObject();
		uname_pwd.put("username", "root");
		uname_pwd.put("password", "");
		JSONObject resp = new JSONObject(call_function("login", uname_pwd));
		
		
		this.session_id = resp.get("session_id").toString();
		this.user_id = resp.get("user_id").toString();

	}
	
	/*
	 * A generic function to call a Hydra server function. Takes the name of the function
	 * and a JSONObject as the parameters. Returns a JSONObject.
	 * @param function_name
	 * @param parameters
	 */
	public String call_function(String function_name, JSONObject params) throws HydraClientException{
		System.out.println("Calling " + function_name);
		CloseableHttpClient httpClient = HttpClients.createDefault();
		if (this.URL == null){
			throw new HydraClientException("No URL defined!");
		}
		HttpPost req = new HttpPost(this.URL);

		try{
			
			//Create the login Object
			JSONObject req_obj = new JSONObject();
			req_obj.put(function_name, params);
			
			//Put the credentials into the req
			StringEntity input = new StringEntity(req_obj.toString());
			input.setContentType("application/json");
			req.setEntity(input);
			
			//No session ID is needed for Login, but it is necessary for all the rest.
			if(function_name != "login"){
				if (this.session_id == null){
					throw new HydraClientException("No session ID. Please log in and try again.");
				}
				req.addHeader("session_id", this.session_id);
				req.addHeader("user_id", this.user_id);
			}
			
			CloseableHttpResponse response = httpClient.execute(req);
			
			if (response.getStatusLine().getStatusCode() != 200) {
				System.out.println(response);
				throw new HydraClientException("Failed : HTTP error code : "
					+ response.getStatusLine().getStatusCode());
			}
			

			BufferedReader br = new BufferedReader(
	                        new InputStreamReader((response.getEntity().getContent())));
	 
			String full_output = "";
			String output_line;
			while ((output_line = br.readLine()) != null) {
				full_output += output_line;
			}
			//System.out.println(full_output);
			return full_output;

		} catch (UnsupportedEncodingException e) {
			e.printStackTrace();
			throw new HydraClientException("Bad encoding");
		} catch (ClientProtocolException e) {
			System.out.println("Bad client protocol");
			e.printStackTrace();
			throw new HydraClientException("Bad client protocol");
		} catch (IOException e) {
			System.out.println("IO Error. Is the server running?");
			e.printStackTrace();
			throw new HydraClientException("IO Error");
		}
	}

	/*
	 * Write the hydra modeller parsable output that all plugins should create.
	 */
	public void write_plugin_output(String network_id, int[] scenario_ids, String message, String[] errors, String[] warnings, String[] files){
		
		String scenario_xml = "";
		for (int s : scenario_ids){
			scenario_xml += "<scenario_id>"+s+"</scenario_id>\n";
		}
		
		String error_xml = "";
		for (String error: errors){
			error_xml += "\t<error>" + error + "</error>\n";
		}
		
		String warning_xml = "";
		for (String warning: warnings){
			warning_xml += "\t<warning>" + warning + "</warning>\n";
		}
		
		String files_xml = "";
		for (String f: files){
			files_xml += "\t<file>" + f + "</file>\n";
		}
		
		String output = "<plugin_result>\n"+
	    "<message>\n"+message+"</message>\n"+
	    "<plugin_name>ImportDSS</plugin_name>\n"+
	    "<network_id>"+network_id+"</network_id>\n"+
	    scenario_xml+
	    "<errors>\n"+error_xml+"</errors>\n"+
	    "<warnings>\n"+warning_xml+"</warnings>\n"+
	    "<files>\n"+files_xml+"</files>\n"+
	    "</plugin_result>";

		System.out.println(output);
	}
	
}
