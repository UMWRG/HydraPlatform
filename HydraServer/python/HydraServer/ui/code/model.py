import json

import logging
log = logging.getLogger(__name__)

from decimal import Decimal

from datetime import datetime

class JSONObject(dict):
    """
        A dictionary object whose attributes can be accesed via a '.'.
        Pass in a nested dictionary, a SQLAlchemy object or a JSON string. 
    """
    def __init__(self, obj_dict, parent=None):
        if isinstance(obj_dict, str) or isinstance(obj_dict, unicode):
            try:
                obj = json.loads(obj_dict)
                assert isinstance(obj, dict), "JSON string does not evaluate to a dict"
            except Exception:
                log.critical("Error with: %s", obj_dict)
                raise ValueError("Unable to read string value. Make sure it's JSON serialisable")
        elif hasattr(obj_dict, '_asdict'):
            #A special case, trying to load a SQLAlchemy object, which is a 'dict' object
            obj = obj_dict._asdict()
        elif hasattr(obj_dict, '__dict__'):
            #A special case, trying to load a SQLAlchemy object, which is a 'dict' object
            obj = obj_dict.__dict__
        elif isinstance(obj_dict, dict):
            obj = obj_dict
        else:
            log.critical("Error with value: %s" , obj_dict)
            raise ValueError("Unrecognised value. It must be a valid JSON dict, a SQLAlchemy result or a dictionary.")

        for k, v in obj.items():
            if isinstance(v, dict):
                setattr(self, k, JSONObject(v, obj_dict))
            elif isinstance(v, list):
                #another special case for datasets
                if k == 'metadata':
                    setattr(self, k, JSONObject(obj_dict.get_metadata_as_dict()))
                else:
                    l = [JSONObject(item, obj_dict) for item in v]
                    setattr(self, k, l)
            elif hasattr(v, '_sa_instance_state') and v != parent: #Special case for SQLAlchemy obhjects

                l = JSONObject(v)
                setattr(self, k, l)
            elif isinstance(v, Decimal):
                v = float(v)
            else:
                if k == '_sa_instance_state':# or hasattr(v, '_sa_instance_state'): #Special case for SQLAlchemy obhjects
                    continue
                if type(v) == type(parent):
                    continue

                #try:
                #    v = int(v)
                #except:
                #    pass

                #try:
                #    v = float(v)
                #except:
                #    pass

                if k == 'layout' and v is not None:
                    #Check if the layout is valid json or evaluates to a dict.
                    try:
                        v = json.loads(v)
                    except:
                        try:
                           v = eval(v)
                        except:
                           continue
                    #We're only interested in dicts
                    if not isinstance(v, dict):
                        continue
                    v = JSONObject(v)

                if isinstance(v, datetime):
                    v = str(v)

                setattr(self, k, v)

    def __getattr__(self, name):
        return self.get(name, None)

    def __setattr__(self, name, value):
        super(JSONObject, self).__setattr__(name, value)
        self[name] = value

    def as_json(self):

        return json.dumps(self)

    def get_layout(self):
        return None
        if hasattr(self, 'layout'):
            return self.layout
        else:
            return None

    #Only for type attrs. How best to generalise this?
    def get_properties(self):
        if self.get('properties') and self.get('properties') is not None:
            return str(self.properties)
        else:
            return None
