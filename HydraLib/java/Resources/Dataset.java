package Resources;

import java.util.Enumeration;
import java.util.Hashtable;
import java.util.Iterator;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.json.JSONObject;

import JSONClientLib.HydraClientException;

/*
 * A dataset paired with Hydra. Has all the necessary attributes for communicating
 * datasets with Hydra.
 */
public class Dataset extends Resource{

	public String format="yyyy-MM-dd'T'HH:mm:ss.000000000Z";
	
	public int id;
	public String type;
	public String unit;
	public String dimension;
	public String name;
	public Hashtable<DateTime, Double> value;
	public Hashtable<String, String> metadata;
	
	public Dataset(){

	}
	
	public Dataset(String name, String type, String unit, String dimension){
		this.name = name;
		this.type = type;
		this.unit = unit;
		this.dimension = dimension;
	}
	
	public Dataset(JSONObject json_dataset) throws HydraClientException{
		this.name      = json_dataset.getString("name");
		this.type      = json_dataset.getString("type");
		JSONObject json_val = new JSONObject(json_dataset.getString("value"));

		if (this.type.equals("timeseries")){
			this.value = new Hashtable<DateTime, Double>(); 
			
			//Pick out the first index from the timeseries and use that. Assume
			//we always use the 1st index.
			String idx = json_val.keys().next();
			JSONObject ts_val = json_val.getJSONObject(idx);
			
			//Go through all the times in the timeseries dict and build the hashtable
			Iterator<String> keys = ts_val.keys();
			while(keys.hasNext()){
				String key = keys.next();
				DateTimeFormatter formatter = DateTimeFormat.forPattern(this.format);
				this.value.put(formatter.parseDateTime(key), ts_val.getDouble(key));
			}
			
			
		}else {
			throw new HydraClientException("Dataset " + json_dataset.getInt("id") + "is not a timeseries");
		}

		if (!json_dataset.get("unit").equals(null)){
			this.unit      = json_dataset.getString("unit");
		}else{
			this.unit      = null;
		}
		
		if (!json_dataset.get("dimension").equals(null)){
			this.dimension = json_dataset.getString("dimension");
		}else{
			this.dimension = null;
		}
		
		JSONObject metadata = new JSONObject(json_dataset.getString("metadata"));
		this.metadata = new Hashtable<String, String>();
		Iterator<String> metadata_names = metadata.keys();
		while(metadata_names.hasNext()){
			String metadata_name = metadata_names.next();
			String metadata_value = metadata.getString(metadata_name);
			this.metadata.put(metadata_name, metadata_value);
		}
	}
	
	public JSONObject getAsJSON(){
		
		JSONObject json_obj = new JSONObject();
		json_obj.put("name", this.name);
		json_obj.put("type", this.type);
		json_obj.put("unit", this.unit);
		json_obj.put("dimension", this.dimension);
		
		if (this.type == "timeseries"){
			Enumeration<DateTime> keys= this.value.keys();
			JSONObject ts_val = new JSONObject();
			while(keys.hasMoreElements()){
				DateTime dt = keys.nextElement();
				ts_val.put(dt.toString(), this.value.get(dt));
			}
			JSONObject ts_wrapper_val = new JSONObject();
			ts_wrapper_val.put("idx", ts_val);
			json_obj.put("value", ts_wrapper_val.toString());
		}
		
		if (this.metadata.isEmpty() == false){
			Enumeration<String> keys= this.metadata.keys();
			JSONObject meta_val = new JSONObject();
			while(keys.hasMoreElements()){
				String name = keys.nextElement();
				meta_val.put(name, this.metadata.get(name));
			}
			json_obj.put("metadata", meta_val.toString());	
			
		}
		return json_obj;
	}

	
	public void set_metadata(String key, String val){
		if (val != null){
			this.metadata.put(key, val);
		}
	}
	
	public String get_metadata(String key){
		return this.metadata.get(key);
	}
	
	public int get_metadata(String key, int default_value){
		String val = this.metadata.get(key);
		if (val == null){
			return default_value;
		}else{
			return Integer.parseInt(val);
		}
	}
	
	public String get_metadata(String key, String default_value){
		String val = this.metadata.get(key);
		if (val == null){
			return default_value;
		}else{
			return val;
		}
	}
	
	public Double get_metadata(String key, Double default_value){
		String val = this.metadata.get(key);
		if (val == null){
			return default_value;
		}else{
			return Double.parseDouble(val);
		}		
	}
}
