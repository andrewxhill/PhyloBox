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
from TreeStore import *
from phyloxml import *
from GenericMethods import *
from NewickParser import *

EXAMPLE_PHYLOBOX_KEY = 'tmp9c63a1c1-9d89-4562-97cf-b1a479e56460'

def JSONify(data):
    pass
      
################################################################ BETA
class MainPage(webapp.RequestHandler):
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
        
    template_values = {
            'key':k,
            'user':user,
            'url': url,
            'url_linktext': url_linktext,
            'collaborators': [],
            }
                
    path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
    
    #render the final page HTML
    data = template.render(path, template_values)
    #store the final page in memcache
    #write the page
    self.response.out.write(data)
    
    
  def get(self):
    user,url,url_linktext = GetCurrentUser(self)
    #print url
    #Default, view the Baeolophus tree from GeoPhylo
    #use POST above to allow users to upload their own files
    # swp - combine mainpage function with beta
    
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    
    template_values = {
            #'key':0,
            'user':user,
            'url': url,
            'url_linktext': url_linktext,
            }
    path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
    data = template.render(path, template_values)
    self.response.out.write(data)

class ProjectViewer(webapp.RequestHandler):
  def get(self):
    user,url,url_linktext = GetCurrentUser(self)

    if user is None:
        self.redirect(users.create_login_url(self.request.uri))
    else:
        query = treeOwners.gql("WHERE userName = :userName",
                            userName=user)
        trees = query.fetch(999)
            
        rows = []
        rowType = 'even'
        ct = 1
        for tree in trees:
            id = str(tree.objId)
            collaborators = []
            for c in treeOwners.gql("WHERE objId = :objId", objId=id).fetch(999):
                if c.userName != user:
                    tmp = str(c.userName).split('@')[0]
                    collaborators.append(tmp)
                
            notes = str(tree.notes)
            query = treeStore.gql("WHERE objId = :objId ORDER BY last_update_date DESC",
                                objId=id)
            results = query.fetch(999)
            for r in results:
                if not r.inTrash:
                    row = {}
                    row['viewLink'] = "/tree/edit?k="+r.objId
                    row['treeId'] = str(r.objId)
                    row['title'] = str(r.treeTitle).strip()
                    if len(row['title'])>37:
                        row['title'] = row['title'][0:37].strip()+"..."
                    row['deleteLink'] = "/tree/delete?k="+r.objId
                    if r.originalAuthor == user:
                        row['author'] = "<i>you</i>"
                    else:
                        row['author'] = str(r.originalAuthor).split('@')[0]
                    row['last_update_date'] = datetime.datetime.date(r.last_update_date).isoformat()
                    row['downloadCt'] = r.downloadCt
                    row['rowType'] = rowType
                    if 0<len(collaborators):
                        collaborators.append('you')
                        row['collaborators'] = collaborators
                    row['rowCt'] = ct
                    ct+=1
                    
                    rows.append(row)
                    
                    if rowType=='even':
                        rowType = 'odd'
                    else:
                        rowType = 'even'
        
        template_values = {
                'user':user,
                'url': url,
                'url_linktext': url_linktext,
                'rows': rows
                }
                
        path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
        template_values['header'] = template.render(path, template_values)
    
        path = os.path.join(os.path.dirname(__file__), 'templates/homeMenu.html')
        template_values['homeMenu'] = template.render(path, template_values)
        
        path = os.path.join(os.path.dirname(__file__), 'templates/projects.html')
        
        self.response.out.write(template.render(path, template_values))
            
            
class Examples(webapp.RequestHandler):
  def get(self,name):
        path = os.path.join(os.path.dirname(__file__), 'templates/examples/%s' % name)
        self.response.out.write(template.render(path, {}))

application = webapp.WSGIApplication([('/', MainPage),
                                      ('/projects', ProjectViewer),
                                      ('/examples/([^/]+)?', Examples)],      
                                     debug=False)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()

