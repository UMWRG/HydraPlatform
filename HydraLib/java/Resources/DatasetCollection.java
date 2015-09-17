package Resources;

import org.json.JSONArray;
import org.json.JSONObject;

/*
 * A hydra dataset collection: A list of dastaset IDS. 
 */
public class DatasetCollection extends Resource {
	
	public int[] dataset_ids;
	public String name;
	
	public DatasetCollection(){
		
	}
	
	/*
	 * Take a json object (returned from a get_collection request)
	 */
	public DatasetCollection(JSONObject json_collection){
		this.name        = json_collection.getString("name");
		//Populate dataset_ids by iterating over the array in the collection
		JSONArray ids = json_collection.getJSONArray("dataset_ids");
		
		int[] tmp_dataset_ids = new int[ids.length()];
		
		for (int i=0;i<ids.length();i++){
			tmp_dataset_ids[i] = ids.getInt(i);
		}
		this.dataset_ids = tmp_dataset_ids;
	}
	
	public DatasetCollection(String name, int[] dataset_ids){
		this.name        = name;
		this.dataset_ids = dataset_ids;
	}

}
