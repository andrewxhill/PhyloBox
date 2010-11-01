import cgi
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache

import os, sys, string, Cookie, sha, time, random, cgi, urllib,urllib2
import datetime, StringIO, pickle
import uuid, zipfile

import wsgiref.handlers
from google.appengine.api import memcache, urlfetch
from google.appengine.ext.webapp import template
from django.utils import feedgenerator, simplejson
from django.template import Context, Template
import logging


def GetCurrentUser(self):
    user = users.get_current_user()
    if users.get_current_user():
        url = users.create_logout_url(self.request.uri)
        url_linktext = 'logout'
    else:
        url = users.create_login_url(self.request.uri)
        url_linktext = 'login'
    return user,url,url_linktext
    
    
#Zip a file for user download
def ZipFiles(data):
    zipstream=StringIO.StringIO()
    file = zipfile.ZipFile(file=zipstream,compression=zipfile.ZIP_DEFLATED,mode="w")
    file.writestr('tmp',data.encode("utf-8"))
    file.close()
    zipstream.seek(0)
    return zipstream.getvalue()
   
   
#Send any uploaded data that is either file or zipped file
#and it will returnd the string
def UnzipFiles(data,iszip=False):
    if iszip is False:
        #really means unknown
        try:
            if str(data.filename)[-3:]=="zip":
                data = data.file
                try:
                    tmp = zipfile.ZipFile(data, 'r')
                    names = []
                    for fn in tmp.namelist():
                        names.append(fn)
                    data = tmp.read(names[0])
                except:
                    try:
                        data = open(data,'r').read()
                    except:
                        return data
            else:
                try:
                    data = data.file.read()
                except:
                    data = open(data,'r').read()
        except:
            try:
                data = data.file.read()
            except:
                try:
                    str(data)
                except:
                    try:
                        data = data.read()
                    except:
                        pass
        return data
    else:
        tmp = zipfile.ZipFile(data, 'r')
        names = []
        for fn in tmp.namelist():
            names.append(fn)
        data = tmp.read(names[0])
        return data
