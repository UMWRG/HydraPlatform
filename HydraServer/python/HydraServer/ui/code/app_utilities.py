import os
import zipfile


def delete_files_from_folder(path,maxdepth=1):
    cpath=path.count(os.sep)
    for r,d,f in os.walk(path):
        if r.count(os.sep) - cpath <maxdepth:
            for files in f:
                try:
                    print "Removing %s" % (os.path.join(r,files))
                    os.remove(os.path.join(r,files))
                except Exception,e:
                    print e


def create_zip_file(directory, zip_file_name):
    for file in os.listdir(directory):
        zf = zipfile.ZipFile(zip_file_name, mode='a')
        print "adding file ...", file
        zf.write(file)
        zf.close()