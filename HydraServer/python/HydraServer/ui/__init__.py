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

pp = os.path.realpath(__file__).split('\\')
pp1 = pp[0: (len(pp) - 1)]
basefolder_ = '\\'.join(pp1)

basefolder = os.path.dirname(__file__)

app = Flask(__name__)

#For use by the admin app, as it can't use zope transactions 
db_url = config.get('mysqld', 'url')
engine = create_engine(db_url) 
db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))

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
from polyvis   import *

if __name__ == "__main__":


    # Create data folder if it doesn't exist
    try:
        os.mkdir(DATA_FOLDER)
    except OSError:
        pass


    app.run(debug=True)


