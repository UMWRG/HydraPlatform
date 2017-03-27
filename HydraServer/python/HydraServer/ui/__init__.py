from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from flask import Flask
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from HydraServer.db import model
from HydraLib import config
from wtforms import PasswordField
import os
import bcrypt

import traceback

from HydraLib.HydraException import HydraError

from HydraServer.db import commit_transaction, rollback_transaction, close_session

from functools import wraps

pp = os.path.realpath(__file__).split('\\')
pp1 = pp[0: (len(pp) - 1)]
basefolder_ = '\\'.join(pp1)

basefolder = os.path.dirname(__file__)

app = Flask(__name__)


def requires_login(func):
    @wraps(func)
    def wrapped(*args, **kwargs):

        try:
            beaker_session = request.environ['beaker.session']
        except:
            app.logger.critical("No beaker information found!")
            return redirect(url_for('index'))

        try:
            #Manually expire the DB session so it can pick up changes made
            #by other processes.
            close_session()

            fn = func(*args,**kwargs)
            
            close_session()

            return fn
        except HydraError as e:
            log.critical(e)
            rollback_transaction()
            traceback.print_exc(file=sys.stdout)
            code = "HydraError %s"%e.code
            raise Exception(e.message, code)
        except Exception, e:
            log.exception(e)
            app.logger.warn("Not logged in.")
            traceback.print_exc(file=sys.stdout)
            rollback_transaction()
            raise Exception (e.message)

    return wrapped

#For use by the admin app, as it can't use zope transactions 
db_url = config.get('mysqld', 'url')
engine = create_engine(db_url) 
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))

from app_manager import appmanager, appinterface 
app.register_blueprint(appmanager)

admin = Admin(app, name='microblog', template_mode='bootstrap3')

class UserView(ModelView):
    form_excluded_columns = ('password')
    form_extra_fields = {
        'password2': PasswordField('Password')
    }

    form_columns = (
        'username',
        'display_name',
        'password2',
        'last_login',
        'last_edit',
        'cr_date',
        'roleusers',
    )

    def on_model_change(self, form, User, is_created=False):
        if form.password2.data is not None:
            User.password = bcrypt.hashpw(form.password2.data.encode('utf-8'), bcrypt.gensalt())

admin.add_view(UserView(model.User, db_session))
admin.add_view(ModelView(model.Perm, db_session))
admin.add_view(ModelView(model.Role, db_session))
admin.add_view(ModelView(model.RolePerm, db_session))
admin.add_view(ModelView(model.RoleUser, db_session))

app.debug = True
from routes import * 
from ebsd   import *
from polyvis   import *

if __name__ == "__main__":


    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)


