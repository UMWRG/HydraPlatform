How to set up your account for SVN+SSH and Trac
===============================================

SVN+SSH for Windows users
-------------------------

#. Install PuTTY and friends: http://the.earth.li/~sgtatham/putty/latest/x86/putty-0.63-installer.exe

#. Start PuTTYgen (puttygen.exe) and generate a new SSH-2/RSA key.

#. Add a passphrase.

#. Save both keys (private and public).

#. Send the **public** key and a username you'd like to have to the system
   administrator (currently `p.meier@ucl.ac.uk <mailto:p.meier@ucl.ac.uk>`_) 

#. Once your account is created it's time to test it:

    a. Start up  PuTTY.
           
    b. In the "Session" tab enter the hostname
       (ec2-54-229-95-247.eu-west-1.compute.amazonaws.com), port 22 is fine.

    c. Go to the "SSH -> Auth" tab and load your private key file generated
       before.

    d. Go back to the "Session" tab, give the connection a name (it is best if
       you use the domain name as session name) and hit "Save"

    e. Select the connection just created and hit "Open"

    f. A window will ask you for your username and private key passphrase

    g. If you see no error messages, your account is created successfully.
       **Congratulations!**

It is highly recommended for Windows users to install TortoiseSVN. The URL of
the SVN repository is::

    svn+ssh://<username>@ec2-54-229-95-247.eu-west-1.compute.amazonaws.com/home/svn/svnrepository/HYDRA


.. note::

    If you connect the first time to the SVN server, TortoiseSVN might ask you
    for the password multiple times (usually twice).


SVN+SSH for Linux users
-----------------------

Creating an account is pretty much the same as the procedure for Windows users. A few
helpful commands are listed below.

#. Generate a key pair::
 
    ssh-keygen -b 2048 -t rsa -N <passphrase> -f <keyfile>

#. Let ssh know that you would like to use this key-file for connection with the
   Hydra server. Add the following to ``~/.ssh/config``::
    
    Host ec2-54-229-95-247.eu-west-1.compute.amazonaws.com ec2hydra
        Hostname ec2-54-229-95-247.eu-west-1.compute.amazonaws.com
        IdentityFile <keyfile>
        User <username>
        ForwardX11 no
   
   This will also provide a shortcut to the server which allows you to connect like this::

        ssh <username>@ec2hydra
 


Trac
----

#. Register as a new user to Trac (top right on the Trac main page)
   The Trac page can be found at:
    
   http://ec2-54-229-95-247.eu-west-1.compute.amazonaws.com/trac/

