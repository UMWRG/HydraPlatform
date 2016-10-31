from flask import Flask
import os
import sys

pp = os.path.realpath(__file__).split('\\')
pp1 = pp[0: (len(pp) - 1)]
basefolder_ = '\\'.join(pp1)

basefolder = os.path.dirname(__file__)

code= os.path.join(basefolder, 'code')
sys.path.insert(0, code)


import time


import random



app = Flask(__name__)



from routes import *

if __name__ == "__main__":


    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)
