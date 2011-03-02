"""
Copyright (C)  2010 Andrew Hill, Sander Pick
"""
import cgi
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch

import os, sys, string, Cookie, sha, time, random, cgi, urllib,urllib2
import datetime, StringIO, pickle, base64
import uuid, zipfile
import xml.etree.cElementTree as ET

import wsgiref.handlers
#from google.appengine.ext.webapp import template
from django.utils import feedgenerator, simplejson
#from django.template import Context, Template
import logging


#project module storing all the db table models
from pb.DB import *
from pb.parse.phyloxml import *
from pb.methods import *
from pb.parse.newick import *

EXAMPLE_PHYLOBOX_KEY = 'tmp9c63a1c1-9d89-4562-97cf-b1a479e56460'


class DailyCron(webapp.RequestHandler):
  def get(self):   
    seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)

class DeleteTemporaryAnnotations(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    q = db.GqlQuery("SELECT __key__ FROM Annotation WHERE temporary = True AND addtime < :1", datetime.datetime.utcfromtimestamp(time.time()) - datetime.timedelta(days=2)).fetch(800)
    try:
        db.delete(q)
    except:
        pass
    return 200

class DeleteTemporaryNodes(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    d = []
    q = db.GqlQuery("SELECT __key__ FROM NodeIndex WHERE temporary = True AND addtime < :1", datetime.datetime.utcfromtimestamp(time.time()) - datetime.timedelta(days=2)).fetch(500)
    for n in q:
        d.append(n.parent())
    try:
        db.delete(q)
        db.delete(d)
    except:
        pass
    return 200

class DeleteTemporaryTrees(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    d = []
    q = db.GqlQuery("SELECT __key__ FROM TreeIndex WHERE temporary = True AND addtime < :1", datetime.datetime.utcfromtimestamp(time.time()) - datetime.timedelta(days=2)).fetch(200)
    for n in q:
        d.append(n.parent())
    try:
        db.delete(q)
        db.delete(d)
    except:
        pass
    return 200


application = webapp.WSGIApplication([('/cron/deletetempannotations', DeleteTemporaryAnnotations),
                                      ('/cron/deletetempnodes', DeleteTemporaryNodes),
                                      ('/cron/deletetemptrees', DeleteTemporaryTrees),
                                      ('/cron/dailycron', DailyCron)],      
                                     debug=False)
                                     
def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
