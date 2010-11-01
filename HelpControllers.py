import cgi
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache

import os, sys, string, Cookie, sha, time, random, cgi, urllib,urllib2
import datetime, StringIO, pickle, urllib2
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
    
    
def GenericHelpTemplate(self):

    user,url,url_linktext = GetCurrentUser(self)
    template_values = {
            'user':user,
            'url': url,
            'url_linktext': url_linktext
            }
            
    path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
    template_values['header'] = str(template.render(path, template_values))
    
    path = os.path.join(os.path.dirname(__file__), 'templates/homeMenu.html')
    template_values['homeMenu'] = template.render(path, template_values)
    
    return template_values
    
    
class HelpDirectory(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/helpDirectory.html')
    self.response.out.write(template.render(path, template_values))     
    
class BloggerHelp(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/bloggerHelp.html')
    self.response.out.write(template.render(path, template_values))  
    
class WebEmbeddingHelp(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/embedHelp.html')
    self.response.out.write(template.render(path, template_values))  
    
class AboutPhylobox(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/aboutPhylobox.html')
    self.response.out.write(template.render(path, template_values))  
      
class ProjectsHelp(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/projectsHelp.html')
    self.response.out.write(template.render(path, template_values))  
    
class UploadHelp(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/uploadHelp.html')
    self.response.out.write(template.render(path, template_values))  
    
class ForkingHelp(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/forkingHelp.html')
    self.response.out.write(template.render(path, template_values))  
    

class GettingStarted(webapp.RequestHandler):
  def get(self):
    template_values = GenericHelpTemplate(self)  
    path = os.path.join(os.path.dirname(__file__), 'templates/helppages/gettingStarted.html')
    self.response.out.write(template.render(path, template_values))  
    
