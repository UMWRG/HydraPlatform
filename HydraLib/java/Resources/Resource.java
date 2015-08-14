package Resources;

import java.lang.reflect.Field;

import org.json.JSONException;
import org.json.JSONObject;

public class Resource {

	public JSONObject getAsJSON(){
		
		JSONObject json_obj = new JSONObject();
		//All of the public attributes of the class in question
		for (Field f : getClass().getDeclaredFields()) {
		    try {
				if (f.get(this) instanceof Resource){
					Resource ts = (Resource) f.get(this);
					json_obj.put(f.getName(), ts.getAsJSON());
				}else{
					json_obj.put(f.getName(), f.get(this));
				}
			} catch (IllegalArgumentException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IllegalAccessException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		  }
		
		return json_obj;
	}
}
