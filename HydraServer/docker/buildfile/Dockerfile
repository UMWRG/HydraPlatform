FROM base/archlinux:latest
RUN pacman -Syu --noconfirm
RUN pacman -S --noconfirm \
    git \
    python2 \
    python2-bcrypt \
    python2-cherrypy \
    python2-dateutil \
    python2-lxml \
    python2-pandas \
    python2-pip \
    python2-sqlalchemy

RUN pip2 install spyne zope.sqlalchemy

RUN git clone https://github.com/UMWRG/HydraPlatform.git root/HydraPlatform

CMD export PYTHONPATH=$PYTHONPATH:/root/HydraPlatform/HydraServer/python:/root/HydraPlatform/HydraLib/python && python2 root/HydraPlatform/HydraServer/server.py
