"""
Controls the automatic update of our product queue
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
from DataStore import *
from phyloxml import *
from HelpControllers import *
from APIControllers import *
from GenericMethods import *
from NewickParser import *

EXAMPLE_PHYLOBOX_KEY = 'tmp9c63a1c1-9d89-4562-97cf-b1a479e56460'

def JSONify(data):
    pass
      
class AddUser(webapp.RequestHandler):
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
    if user is None:
        return 'you must be logged in'
    else:
        k = self.request.params.get('key', None)
        
        projects = treeOwners.gql("WHERE objId = :objId AND userName = :userName",
                    objId=k, userName = user).fetch(1)
                    
        if len(projects)<1: 
            return 'you need to save the tree first'
        else:
            newuser = self.request.params.get('email', None)
            
            if newuser is None:
                return "you didn't enter an email address"
            else:
                newuser = str(urllib.unquote(newuser))
                if len(newuser.split("@"))<1:
                    newuser = newuser.strip()+"@gmail.com"
                newuser = users.User(email=newuser)
                projects = treeOwners.gql("WHERE objId = :objId AND userName = :userName",
                    objId=k, userName = newuser).fetch(1)
                if 0<len(projects):
                    self.response.out.write(str(newuser)+" is already a collaborator")
                else:
                    tmpEntry = treeOwners(objId = k,
                                userName = newuser,
                                notes = 'Invited by '+str(user)
                              )
                    tmpEntry.put()
                    

                    self.response.out.write(200)
        
class TreeSave(webapp.RequestHandler):
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
    
    
    k = self.request.params.get('key', None)
    title = self.request.params.get('title', None)
    png = self.request.params.get('png', None)
    if png is not None:
        #ng = png.split(",")[1][0:-1]
        png = db.Blob(str(png)[1:-1])
        #png=base64.decodestring(png)
    if k is None:
        self.response.out.write(None)
    
    treefile = simplejson.loads(self.request.params.get('tree', None))
    
    if treefile is None:
        self.response.out.write(None)
        
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    
    treefile = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
    
    if cmp('tmp',k[:3])==0:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        tmpEntry = treeStore(objId = k,
                  objBlob = treefile,
                  userName = user,
                  objPng = png,
                  treeTitle = title,
                  originalAuthor = user,
                  version = version
                  )
        tmpEntry.put()
        
        tmpEntry = treeOwners(objId = k,
                  userName = user
                  )
        tmpEntry.put()
        
    else:
        if user is not None:
            #if the user is signed in, give them ownership of the tree object
            projects = treeOwners.gql("WHERE objId = :objId AND userName = :userName",
                                objId=k, userName = user).fetch(1)
                                
            
            if len(projects)==0:
                #if the user is trying to store a tree that isn't theirs, fork it as a new tree
                #but retain the name of the originalAuthor
                trees = treeStore.gql("WHERE objId = :objId",
                                    objId=k).fetch(1)
                newk = "phylobox-"+version+"-"+str(uuid.uuid4())
                
                for tree in trees:
                    tmpEntry = treeStore(objId = newk,
                              objBlob = treefile,
                              objPng = png,
                              treeTitle = title,
                              userName = user,
                              forkedObj = k,
                              originalAuthor = tree.originalAuthor,
                              version = version
                              )
                    tmpEntry.put()
        
                    tmpEntry = treeOwners(objId = newk,
                                          userName = user
                                          )
                    tmpEntry.put()
                k = newk
            else:
                fork = self.request.params.get('fork', None)
                if fork is not None:
                    #If the fork variable is sent, then we create a new
                    #key for the tree and send it back to the user
                    newk = "phylobox-"+version+"-"+str(uuid.uuid4())
                    trees = treeStore.gql("WHERE objId = :objId ",
                                    objId=k).fetch(1)
                    #if the user is the owner of the tree, update it.
                    for tree in trees:
                        tmpEntry = treeStore(objId = newk,
                                  objBlob = treefile,
                                  objPng = png,
                                  userName = user,
                                  treeTitle = title,
                                  forkedObj = k,
                                  originalAuthor = tree.originalAuthor,
                                  version = version
                                  )
                        tmpEntry.put()
            
                        tmpEntry = treeOwners(objId = newk,
                                              userName = user
                                              )
                        tmpEntry.put()
                    k = newk
                else:
                    #if we are not forking the tree, just store it
                    trees = treeStore.gql("WHERE objId = :objId ",
                                    objId=k).fetch(1)
                    #if the user is the owner of the tree, update it.
                    for tree in trees:
                        tree.objBlob = treefile
                        tree.objPng = png
                        tree.treeTitle = title
                        tree.last_update_date = datetime.datetime.now()
                        tree.put()
                    
        else:
            """ Store the forked tree as Anon """
                        
            trees = treeStore.gql("WHERE objId = :objId",
                                objId=k).fetch(1)
            newk = "phylobox-"+version+"-"+str(uuid.uuid4())
            for tree in trees:
                tmpEntry = treeStore(objId = newk,
                          objBlob = treefile,
                          objPng = png,
                          userName = user,
                          forkedObj = k,
                          treeTitle = title,
                          originalAuthor = tree.originalAuthor,
                          version = version
                          )
                tmpEntry.put()
    
                tmpEntry = treeOwners(objId = newk,
                          userName = user
                          )
                tmpEntry.put()
                k = newk
            
            #self.response.out.write('you are trying to fork a tree when not signed in')
    
    memcache.set("tree-data-"+k, treefile, 60)

    try:
        memcache.set("png-data-"+k, png, 60)
    except:
        pass
    #return the old (if not forked) or new key string (if forked or first save) to the user
    self.response.out.write(k)
    
# class OldTreeEditor(webapp.RequestHandler):
#   def post(self):
#     user,url,url_linktext = GetCurrentUser(self)
#                 
#     #phyloxml = open(self.request.POST.get('phyloxml'),'r').read()
#     treefile = UnzipFiles(self.request.POST.get('phyloxml'))
#     #print treefile
#     #set defaults
#     background = "1d1d1d"
#     color = "75a0cb"
#     if user:
#         author = str(user)
#     else:
#         author = "anon"
#     title = "Your tree"
#     description = "PhyloJSON Tree Generated at PhyloBox"
#     view_mode = 'Dendrogram'.lower()
#     focus = None
#     root = None
#     zoom = 0
#     width = 1
#     htulabels = False
#     branchlabels = False
#     leaflabels = False
#     node_radius = 1
#     
#     tree = PhyloXMLtoTree(treefile,color=color)
#     tree.load()
#     if tree.title is not None:
#         title = tree.title
#     if tree.rooted is not None:
#         root = tree.root
#     out = ''
#     output = []
#     for a,b in tree.objtree.tree.items():
#         if a != 0:
#             output.append(b.json())
#             
#     treefile = {}
#     treefile['v'] = 1
#     treefile['date'] = str(datetime.datetime.now())
#     treefile['author'] = author
#     treefile['title'] = title
#     treefile['description'] = description
#     treefile['root'] = root
#     treefile['environment'] = {}
#     treefile['environment']['root'] = tree.root
#     treefile['environment']['view_mode'] = view_mode
#     treefile['environment']['color'] = background
#     treefile['environment']['focus'] = focus
#     treefile['environment']['zoom'] = zoom
#     treefile['environment']['width'] = width
#     treefile['environment']['radius'] = node_radius
#     treefile['environment']['htulabels'] = htulabels
#     treefile['environment']['branchlabels'] = branchlabels
#     treefile['environment']['leaflabels'] = leaflabels
#     treefile['tree'] = output
#     treefile = str(simplejson.dumps(treefile).replace('\\/','/'))
#     
#     #self.response.out.write(treefile)
#     
#     k = self.request.params.get('k', None)
#     
#     if k is None:
#         version = os.environ['CURRENT_VERSION_ID'].split('.')
#         version = str(version[0])
#         k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
#         
#     #zip the string
#     treefile = ZipFiles(treefile)
#     
#     #i have removed a temp table from the data store
#     #now i just store tmp trees in memcache for 10 or so days
#     memcache.set("tree-data-"+k, treefile, 360000)
#     
#         
#     template_values = {
#             'key':k,
#             'tmp':True,
#             'user':user,
#             'url': url,
#             'url_linktext': url_linktext,
#             'collaborators': [],
#             }
#             
#             
#     path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#     header = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/toolMenu.html')
#     toolMenu = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/editorMenu.html')
#     bottomMenu = str(template.render(path, template_values))
#     
#     template_values['header'] = header
#     template_values['toolMenu'] = toolMenu
#     template_values['bottomMenu'] = bottomMenu
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/frame.html')
#     self.response.out.write(template.render(path, template_values))
#     
#     
#   def get(self):
#     user,url,url_linktext = GetCurrentUser(self)
#     
#     #Default, view the Baeolophus tree from GeoPhylo
#     #use POST above to allow users to upload their own files
#     k = self.request.params.get('k', None)
#     if k is None:
#         k = EXAMPLE_PHYLOBOX_KEY
#         treefile = open("examplejson",'r').read()
#         
#     #check memcache for the page first
#     data = memcache.get("tree-edit-"+k)
#     #return it if it exists
#     if data is not None:
#         self.response.out.write(data)
#     #else build the page
#     else:
#         
#         tmp = False
#         if cmp('tmp',k[:3])==0:
#             tmp=True
#             
#             
#         collaborators = []
#         results = treeOwners.gql("WHERE objId = :objId",
#                         objId=k).fetch(100)
#         for res in results:
#             collaborators.append(str(res.userName))
#             
#         template_values = {
#                 'key':k,
#                 'tmp':tmp,
#                 'user':user,
#                 'url': url,
#                 'url_linktext': url_linktext,
#                 'collaborators': collaborators
#                 }
#                 
#                 
#         path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#         header = str(template.render(path, template_values))
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/toolMenu.html')
#         toolMenu = str(template.render(path, template_values))
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/editorMenu.html')
#         bottomMenu = str(template.render(path, template_values))
#         
#         template_values['header'] = header
#         template_values['toolMenu'] = toolMenu
#         template_values['bottomMenu'] = bottomMenu
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/frame.html')
#         
#         #render the final page HTML
#         data = template.render(path, template_values)
#         
#         #store the final page in memcache
#         memcache.set("tree-edit-"+k, data, 5)
#         
#         #write the page
#         self.response.out.write(data)
#         
#         
# class OldEditor(webapp.RequestHandler):
#   def post(self):
#     user,url,url_linktext = GetCurrentUser(self)
#                 
#     #phyloxml = open(self.request.POST.get('phyloxml'),'r').read()
#     treefile = UnzipFiles(self.request.POST.get('phyloxml'))
#     #print treefile
#     #set defaults
#     background = "1d1d1d"
#     color = "75a0cb"
#     if user:
#         author = str(user)
#     else:
#         author = "anon"
#     title = "Your tree"
#     description = "PhyloJSON Tree Generated at PhyloBox"
#     view_mode = 'Dendrogram'.lower()
#     root = None
#     width = 1
#     htulabels = False
#     branchlabels = False
#     leaflabels = False
#     node_radius = 1
#     
#     tree = PhyloXMLtoTree(treefile,color=color)
#     tree.load()
#     if tree.title is not None:
#         title = tree.title
#     if tree.rooted is not None:
#         root = tree.root
#     out = ''
#     output = []
#     #output = {}
#     for a,b in tree.objtree.tree.items():
#         if a != 0:
#             output.append(b.json())
#             #output[a]= b.json()
#             
#     treefile = {}
#     treefile['v'] = 1
#     treefile['date'] = str(datetime.datetime.now())
#     treefile['author'] = author
#     treefile['title'] = title
#     treefile['description'] = description
#     treefile['root'] = root
#     treefile['environment'] = {}
#     treefile['environment']['root'] = tree.root
#     treefile['environment']['viewmode'] = view_mode
#     treefile['environment']['branchlenghts'] = True
#     treefile['environment']['3D'] = False
#     treefile['environment']['color'] = background
#     treefile['environment']['angvel'] = {'x':None,'y':None,'z':None}
#     treefile['environment']['offset'] = {'dx':0.0,'dy':0.0,'dz':0.0,'ax':0.0,'ay':0.0,'az':0.0}
#     treefile['environment']['width'] = width
#     treefile['environment']['radius'] = node_radius
#     treefile['environment']['htulabels'] = htulabels
#     treefile['environment']['branchlabels'] = branchlabels
#     treefile['environment']['leaflabels'] = leaflabels
#     treefile['environment']['primaryuri'] = None
#     treefile['tree'] = output
#     treefile = str(simplejson.dumps(treefile).replace('\\/','/'))
#     
#     #self.response.out.write(treefile)
#     
#     k = self.request.params.get('k', None)
#     
#     if k is None:
#         version = os.environ['CURRENT_VERSION_ID'].split('.')
#         version = str(version[0])
#         k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
#         
#     #zip the string
#     treefile = ZipFiles(treefile)
#     
#     #i have removed a temp table from the data store
#     #now i just store tmp trees in memcache for 10 or so days
#     memcache.set("tree-data-"+k, treefile, 360000)
#     
#         
#     template_values = {
#             'key':k,
#             'tmp':True,
#             'user':user,
#             'url': url,
#             'url_linktext': url_linktext,
#             'collaborators': [],
#             }
#             
#             
#     path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#     header = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/toolMenu.html')
#     toolMenu = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
#     optionsPanel = str(template.render(path, template_values))
#     
#     template_values['header'] = header
#     template_values['toolMenu'] = toolMenu
#     template_values['optionsPanel'] = optionsPanel
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/treeEditor.html')
#     self.response.out.write(template.render(path, template_values))
#     
#     
#   def get(self):
#     user,url,url_linktext = GetCurrentUser(self)
#     
#     #Default, view the Baeolophus tree from GeoPhylo
#     #use POST above to allow users to upload their own files
#     k = self.request.params.get('k', None)
#     if k is None:
#         k = EXAMPLE_PHYLOBOX_KEY
#         treefile = open("examplejson",'r').read()
#         
#     #check memcache for the page first
#     data = memcache.get("tree-edit-"+k)
#     #return it if it exists
#     if data is not None:
#         self.response.out.write(data)
#     #else build the page
#     else:
#         
#         tmp = False
#         if cmp('tmp',k[:3])==0:
#             tmp=True
#             
#             
#         collaborators = []
#         results = treeOwners.gql("WHERE objId = :objId",
#                         objId=k).fetch(100)
#         for res in results:
#             collaborators.append(str(res.userName))
#             
#         template_values = {
#                 'key':k,
#                 'tmp':tmp,
#                 'user':user,
#                 'url': url,
#                 'url_linktext': url_linktext,
#                 'collaborators': collaborators
#                 }
#                 
#                 
#         path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#         header = str(template.render(path, template_values))
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/toolMenu.html')
#         toolMenu = str(template.render(path, template_values))
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
#         optionsPanel = str(template.render(path, template_values))
#         
#         template_values['header'] = header
#         template_values['toolMenu'] = toolMenu
#         template_values['optionsPanel'] = optionsPanel
#         
#         path = os.path.join(os.path.dirname(__file__), 'templates/treeEditor.html')
#         
#         #render the final page HTML
#         data = template.render(path, template_values)
#         
#         #store the final page in memcache
#         memcache.set("tree-edit-"+k, data, 5)
#         
#         #write the page
#         self.response.out.write(data)
#         
class TreeEditor(webapp.RequestHandler):
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
                
    #phyloxml = open(self.request.POST.get('phyloxml'),'r').read()
    treefile = UnzipFiles(self.request.POST.get('phyloxml'))
    
    method = self.request.params.get('method', None)
    if method=="newick":
        treefile = ParseNewick(str(treefile))
        
    #print treefile
    #set defaults
    background = "1d1d1d"
    color = "75a0cb"
    if user:
        author = str(user)
    else:
        author = "anon"
    title = "Your tree"
    description = "PhyloJSON Tree Generated at PhyloBox"
    view_mode = 0
    root = None
    width = 1
    htulabels = False
    branchlabels = False
    leaflabels = False
    node_radius = 1
    
    tree = PhyloXMLtoTree(treefile,color=color)
    tree.load()
    if tree.title is not None:
        title = tree.title
    if tree.rooted is not None:
        root = tree.root
    out = ''
    output = []
    #output = {}
    for a,b in tree.objtree.tree.items():
        if a != 0:
            output.append(b.json())
            #output[a]= b.json()
            
    treefile = {}
    treefile['v'] = 1
    treefile['date'] = str(datetime.datetime.now())
    treefile['author'] = author
    treefile['title'] = title
    treefile['description'] = description
    treefile['root'] = root
    treefile['environment'] = {}
    treefile['environment']['root'] = tree.root
    treefile['environment']['viewmode'] = view_mode
    treefile['environment']['branchlenghts'] = True
    treefile['environment']['3D'] = False
    treefile['environment']['color'] = background
    treefile['environment']['angvel'] = {'x':None,'y':None,'z':None}
    treefile['environment']['offset'] = {'dx':0.0,'dy':0.0,'dz':None,'ax':0.0,'ay':0.0,'az':0.0}
    treefile['environment']['width'] = width
    treefile['environment']['radius'] = node_radius
    treefile['environment']['htulabels'] = htulabels
    treefile['environment']['branchlabels'] = branchlabels
    treefile['environment']['leaflabels'] = leaflabels
    treefile['environment']['primaryuri'] = None
    treefile['tree'] = output
    treefile = str(simplejson.dumps(treefile).replace('\\/','/'))
    
    #self.response.out.write(treefile)
    
    k = self.request.params.get('k', None)
    
    if k is None:
        version = os.environ['CURRENT_VERSION_ID'].split('.')
        version = str(version[0])
        k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
        
    #zip the string
    treefile = ZipFiles(treefile)
    
    #i have removed a temp table from the data store
    #now i just store tmp trees in memcache for 10 or so days
    memcache.set("tree-data-"+k, treefile, 360000)
    
        
    template_values = {
            'key':k,
            'tmp':True,
            'user':user,
            'url': url,
            'url_linktext': url_linktext,
            'collaborators': [],
            }
                
    path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
    header = str(template.render(path, template_values))
    
    path = os.path.join(os.path.dirname(__file__), 'templates/testtoolMenu.html')
    toolMenu = str(template.render(path, template_values))
    
    path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
    optionsPanel = str(template.render(path, template_values))
    
    template_values['header'] = header
    template_values['toolMenu'] = toolMenu
    template_values['optionsPanel'] = optionsPanel
    
    path = os.path.join(os.path.dirname(__file__), 'templates/newEngine.html')
    
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
    k = self.request.params.get('k', None)
    if k is None:
        k = EXAMPLE_PHYLOBOX_KEY
        treefile = open("examplejson",'r').read()
        
    #check memcache for the page first
    data = memcache.get("tree-edit-"+k)
    #return it if it exists
    if data is not None:
        self.response.out.write(data)
    #else build the page
    else:
        
        tmp = False
        if cmp('tmp',k[:3])==0:
            tmp=True
            
            
        collaborators = []
        results = treeOwners.gql("WHERE objId = :objId",
                        objId=k).fetch(100)
        for res in results:
            collaborators.append(str(res.userName))
            
        template_values = {
                'key':k,
                'tmp':tmp,
                'user':user,
                'url': url,
                'url_linktext': url_linktext,
                'collaborators': collaborators
                }
                
        path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
        header = str(template.render(path, template_values))
        
        path = os.path.join(os.path.dirname(__file__), 'templates/testtoolMenu.html')
        toolMenu = str(template.render(path, template_values))
        
        path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
        optionsPanel = str(template.render(path, template_values))
        
        template_values['header'] = header
        template_values['toolMenu'] = toolMenu
        template_values['optionsPanel'] = optionsPanel
        
        path = os.path.join(os.path.dirname(__file__), 'templates/newEngine.html')
        
        #render the final page HTML
        data = template.render(path, template_values)
            #store the final page in memcache
        #memcache.set("tree-edit-"+k, data, 5)
        
        #store the final page in memcache
        #write the page
        self.response.out.write(data)


################################################################ BETA
class Beta(webapp.RequestHandler):
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
                
    treefile = UnzipFiles(self.request.POST.get('phyloxml'))
    """temporary fix for crappy uploader to new uploader, should remove 'phyloxml in future"""
    if treefile is None:
        treefile = UnzipFiles(self.request.POST.get('tree-file'))
    
    method = self.request.params.get('method', None)
    if method=="newick":
        treefile = ParseNewick(str(treefile))
        
    #print treefile
    #set defaults
    background = "1d1d1d"
    color = "75a0cb"
    if user:
        author = str(user)
    else:
        author = "anon"
    title = "Your tree"
    description = "PhyloJSON Tree Generated at PhyloBox"
    view_mode = 0
    root = None
    width = 1
    htulabels = False
    branchlabels = False
    leaflabels = False
    node_radius = 1
    
    tree = PhyloXMLtoTree(treefile,color=color)
    tree.load()
    if tree.title is not None:
        title = tree.title
    if tree.rooted is not None:
        root = tree.root
    out = ''
    output = []
    #output = {}
    for a,b in tree.objtree.tree.items():
        if a != 0:
            output.append(b.json())
            #output[a]= b.json()
            
    treefile = {}
    treefile['v'] = 1
    treefile['date'] = str(datetime.datetime.now())
    treefile['author'] = author
    treefile['title'] = title
    treefile['description'] = description
    treefile['root'] = root
    treefile['environment'] = {}
    treefile['environment']['root'] = tree.root
    treefile['environment']['viewmode'] = view_mode
    treefile['environment']['branchlengths'] = True
    treefile['environment']['threeD'] = False
    treefile['environment']['color'] = background
    treefile['environment']['angvel'] = {'x':None,'y':None,'z':None}
    treefile['environment']['offset'] = {'dx':0.0,'dy':0.0,'dz':None,'ax':0.0,'ay':0.0,'az':0.0}
    treefile['environment']['width'] = width
    treefile['environment']['radius'] = node_radius
    treefile['environment']['htulabels'] = htulabels
    treefile['environment']['branchlabels'] = branchlabels
    treefile['environment']['leaflabels'] = leaflabels
    treefile['environment']['primaryuri'] = None
    treefile['tree'] = output
    treefile = str(simplejson.dumps(treefile).replace('\\/','/'))
    
    #self.response.out.write(treefile)
    
    k = self.request.params.get('k', None)
    
    if k is None:
        version = os.environ['CURRENT_VERSION_ID'].split('.')
        version = str(version[0])
        k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
        
    #zip the string
    treefile = ZipFiles(treefile)
    
    #i have removed a temp table from the data store
    #now i just store tmp trees in memcache for 10 or so days
    memcache.set("tree-data-"+k, treefile, 360000)
    
        
    template_values = {
            'key':k,
            'tmp':True,
            'user':user,
            'url': url,
            'url_linktext': url_linktext,
            'collaborators': [],
            }
                
    #path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
    #header = str(template.render(path, template_values))
    
    #path = os.path.join(os.path.dirname(__file__), 'templates/testtoolMenu.html')
    #toolMenu = str(template.render(path, template_values))
    
    #path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
    #optionsPanel = str(template.render(path, template_values))
    
    #template_values['header'] = header
    #template_values['toolMenu'] = toolMenu
    #template_values['optionsPanel'] = optionsPanel
    
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
    
    k = self.request.params.get('k', None)
    if k is None:
        #k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
        #treefile = open("examplejson",'r').read()
        template_values = {
                #'key':0,
                'user':user,
                'url': url,
                'url_linktext': url_linktext,
                }
        path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
        data = template.render(path, template_values)
        self.response.out.write(data)
    else:  
        #check memcache for the page first
        data = memcache.get("tree-edit-"+k)
        #return it if it exists
        if data is not None:
            self.response.out.write(data)
        #else build the page
        else:
            tmp = False
            if cmp('tmp',k[:3])==0:
                tmp=True
            
            collaborators = []
            results = treeOwners.gql("WHERE objId = :objId",
                            objId=k).fetch(100)
            for res in results:
                collaborators.append(str(res.userName))
            
            template_values = {
                    'key':k,
                    'tmp':tmp,
                    'user':user,
                    'url': url,
                    'url_linktext': url_linktext,
                    'collaborators': collaborators
                    }
        #set path
        path = os.path.join(os.path.dirname(__file__), 'templates/index.html')
        #render the final page HTML
        data = template.render(path, template_values)
        #store the final page in memcache
        #memcache.set("tree-edit-"+k, data, 5)
        #store the final page in memcache
        #write the page
        self.response.out.write(data)
#####################################################################
        
        
        
# class NewEditor(webapp.RequestHandler):
#   def get(self):
#     user,url,url_linktext = GetCurrentUser(self)
#     d = 'phylobox-1-0-33f7b3fe-a423-425d-ad75-d119c62787db'
#     d = 'phylobox-1-0-abd1108d-2f21-4178-ba14-cd3cf5a07e0e' #for live site
#     key = self.request.params.get('k', d)
#     template_values = {
#             'key':key,
#             'tmp':False,
#             'user':user,
#             'url': "http://google.com",
#             'url_linktext': url_linktext,
#             'collaborators': []
#             }
#             
#     path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#     header = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/testtoolMenu.html')
#     toolMenu = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
#     optionsPanel = str(template.render(path, template_values))
#     
#     template_values['header'] = header
#     template_values['toolMenu'] = toolMenu
#     template_values['optionsPanel'] = optionsPanel
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/newEngine.html')
#     
#     #render the final page HTML
#     data = template.render(path, template_values)
#     
#     #store the final page in memcache
#     #write the page
#     self.response.out.write(data)
        
# class SanderTest(webapp.RequestHandler):
#   def get(self):
#     user,url,url_linktext = GetCurrentUser(self)
#     d = 'phylobox-1-0-33f7b3fe-a423-425d-ad75-d119c62787db'
#     d = 'phylobox-1-0-abd1108d-2f21-4178-ba14-cd3cf5a07e0e' #for live site
#     key = self.request.params.get('k', d)
#     template_values = {
#             'key':key,
#             'tmp':False,
#             'user':user,
#             'url': "http://google.com",
#             'url_linktext': url_linktext,
#             'collaborators': []
#             }
#             
#     path = os.path.join(os.path.dirname(__file__), 'templates/header.html')
#     header = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/testtoolMenu.html')
#     toolMenu = str(template.render(path, template_values))
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/optionsPanel.html')
#     optionsPanel = str(template.render(path, template_values))
#     
#     template_values['header'] = header
#     template_values['toolMenu'] = toolMenu
#     template_values['optionsPanel'] = optionsPanel
#     
#     path = os.path.join(os.path.dirname(__file__), 'templates/sanderEditor.html')
#     
#     #render the final page HTML
#     data = template.render(path, template_values)
#     
#     #store the final page in memcache
#     #write the page
#     self.response.out.write(data)
      
  
class MainPage(webapp.RequestHandler):
  def get(self): 
    user,url,url_linktext = GetCurrentUser(self)
  
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    k = "tmp-phylobox-"+version+"-"+str(uuid.uuid4())
      
    template_values = {
            'key':k,
            'user':user,
            'url': url,
            'url_linktext': url_linktext
            }
            
    path = os.path.join(os.path.dirname(__file__), 'templates/homeMenu.html')
    template_values['bottomMenu'] = template.render(path, template_values)
    
    path = os.path.join(os.path.dirname(__file__), 'templates/homepage.html')
    self.response.out.write(template.render(path, template_values))
      
         
class DailyCron(webapp.RequestHandler):
  def get(self):   
    seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)

class SignOut(webapp.RequestHandler):
  def get(self):
    self.redirect(users.create_logout_url("/"))
    
class SignIn(webapp.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write('Hello, ' + user.nickname())
        else:
            self.redirect(users.create_login_url(self.request.uri))
            
            
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
            
            
class TreeFullscreen(webapp.RequestHandler):
  def get(self):
    k = self.request.params.get('k', None)
    if k is None:
        self.redirect('/')
    else:
        data = memcache.get("fullscreen-data-"+k)
        if data is not None:
            self.response.out.write(data)
        else:
            template_values = {
                    'key':k
                    }
            path = os.path.join(os.path.dirname(__file__), 'templates/fullscreen.html')
            data = template.render(path, template_values)
            
            #add to memcache
            memcache.set("fullscreen-data-"+k, data, 300)
            self.response.out.write(data)
    
    
class PrintPhyloJSON(webapp.RequestHandler):
  def get(self):
    examp = open('examplejson','r').read()
    self.response.out.write(examp)
    
class PhyloJSON_1(webapp.RequestHandler):
  def get(self):
    spec = open('phylojson/specs/Version-1','r').read()
    
    self.response.out.write("<html><body><pre>"+spec+"</pre></body></html>")
        
        
          
class AndroidBrowser(webapp.RequestHandler):
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
                    collaborators.append(c.userName)
                
            notes = str(tree.notes)
            query = treeStore.gql("WHERE objId = :objId ORDER BY last_update_date DESC",
                                objId=id)
            results = query.fetch(999)
            for r in results:
                row = {}
                row['viewLink'] = "/mobile/canvas?k="+r.objId
                row['treeId'] = str(r.objId)
                if 23<len(str(r.treeTitle).strip()):
                    row['title'] = str(r.treeTitle)[0:23].strip()+"..."
                else:
                    row['title'] = str(r.treeTitle)
                    
                row['deleteLink'] = "/tree/delete?k="+r.objId
                
                if r.originalAuthor == user:
                    row['author'] = "<i>you</i>"
                else:
                    if 10<len(str(r.originalAuthor).strip()):
                        row['author'] = str(r.originalAuthor)[0:10].strip()
                    else:
                        row['author'] = str(r.originalAuthor)
                        
                row['last_update_date'] = datetime.datetime.date(r.last_update_date).isoformat()
                row['downloadCt'] = r.downloadCt
                row['rowType'] = rowType
                if 0<len(collaborators):
                    collaborators.append('you')
                    row['collaborators'] = collaborators
                row['rowCt'] = ct
                row['nextRow'] = ct+1
                row['lastRow'] = ct-1
                ct+=1
                
                rows.append(row)
                
                if rowType=='even':
                    rowType = 'odd'
                else:
                    rowType = 'even'
                    
        rows[0]['lastRow'] = len(rows)
        rows[-1]['nextRow'] = 1
        
        template_values = {
                'user':user,
                'url': url,
                'url_linktext': url_linktext,
                'rows': rows
                }
        
        path = os.path.join(os.path.dirname(__file__), 'templates/mobile/android.html')
        self.response.out.write(template.render(path, template_values))



class AppleBrowser(webapp.RequestHandler):
  def get(self):
    template_values = {}
    path = os.path.join(os.path.dirname(__file__), 'templates/mobile/apple.html')
    self.response.out.write(template.render(path, template_values))

class MobileCanvas(webapp.RequestHandler):
  def get(self):
    k = self.request.params.get('k', None)
    template_values = {'key':k}
    path = os.path.join(os.path.dirname(__file__), 'templates/mobile/canvas.html')
    self.response.out.write(template.render(path, template_values))

class MobileFullscreen(webapp.RequestHandler):
  def get(self):
    k = self.request.params.get('k', None)
    template_values = {'key':k}
    path = os.path.join(os.path.dirname(__file__), 'templates/mobile/fullscreen.html')
    self.response.out.write(template.render(path, template_values))



application = webapp.WSGIApplication(
                                     [('/', Beta),
                                      ('/new', AddNewTree),
                                      ('/group', TreeGroup),
                                      ('/user', UserInfo),
                                      ('/test', TmpTest),
                                      ('/signin', SignIn),
                                      ('/signout', SignOut),
                                      ('/projects', ProjectViewer),
                                      #('/tree/oldold', OldTreeEditor),
                                      ('/tree/edit', TreeEditor),
                                      #('/tree/old', OldEditor),
                                      #('/tree/sander', SanderTest),
                                      ('/tree/fullscreen', TreeFullscreen),
                                      ('/save', TreeSave),
                                      ('/tree/adduser', AddUser),
                                      #('/tree/widget', WidgetViewer),
                                      ('/help', HelpDirectory),
                                      ('/help/start', GettingStarted),
                                      ('/help/blogger', BloggerHelp),
                                      ('/help/embed', WebEmbeddingHelp),
                                      ('/help/about', AboutPhylobox),
                                      ('/help/projects', ProjectsHelp),
                                      ('/help/upload', UploadHelp),
                                      ('/help/fork', ForkingHelp),
                                      ('/api', APIServices),
                                      ('/api/authors', AuthorLineage),
                                      ('/api/create', CreatePhyloBox),
                                      ('/api/convert', ConvertToPhyloJSON),
                                      ('/api/image.png', PngOutput),
                                      ('/phylojson/example', PrintPhyloJSON),
                                      ('/phylojson/test', TestSpec),
                                      ('/phylojson/version/1', PhyloJSON_1),
                                      ('/mobile/a', AndroidBrowser),
                                      ('/mobile/i', AndroidBrowser),
                                      #('/mobile/i', AppleBrowser),
                                      ('/mobile/canvas', MobileCanvas),
                                      ('/mobile/fullscreen', MobileFullscreen),
                                      ('/lookup', LookUp),
                                      ('/api/lookup', LookUp),
                                      ('/dailycron', DailyCron)],      
                                     debug=False)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()

