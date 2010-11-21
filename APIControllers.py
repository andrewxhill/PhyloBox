import cgi
from google.appengine.api import oauth
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch
from google.appengine.api import users
from google.appengine.api.labs import taskqueue


import os, sys, string, Cookie, sha, time, random, cgi, urllib,urllib2
import datetime, StringIO, pickle, urllib2, base64
import uuid, zipfile
from md5 import md5

import wsgiref.handlers
from google.appengine.ext.webapp import template
from django.utils import feedgenerator, simplejson
from django.template import Context, Template
import logging


#project module storing all the db table models
from TreeStore import *
#from DataStore import *
from GenericMethods import *
from phyloxml import *
from NewickParser import * 
      
class OldLookUp(webapp.RequestHandler):
  def allrequests(self):
    memtime = 300
    k = str(self.request.params.get('k', None)).strip()
    
    
    self.response.headers['Content-Type'] = 'application/json'
    if k is None:
        self.response.out.write(200)
        
    elif k == 'perm9c63a1c1-9d89-4562-97cf-b1a479e56460':
        treefile = open('examplejson','r').read()
        callback = self.request.params.get('callback', None)
        return treefile
        
    else:
        #hotfix, delete anytime after 12/10
        if k == "phylobox-2-0-818fbb99-50b6-4740-bb6f-f3f7b0fa7e53":
            k = "phylobox-2-0-c410fdb2-2e85-4248-9e01-a9e7657f35f5"
        
        #check memcache
        data = memcache.get("tree-data-"+k)
        #if exists return the data
        if data is not None:
            #iterate the memcache count for the tree
            dlcount = memcache.get("tree-download-ct-"+k)
            if dlcount is None:
                dlcount = 1
            #the iterator is stored in memcache for over 2 weeks,
            #as long as the tree itself is looked up a second time in
            #those two weeks, the value will be saved, some hits may
            #be missed.
            memcache.set("tree-download-ct-"+k, dlcount+1, 1500000)
            
            result = UnzipFiles(StringIO.StringIO(data),iszip=True)
            return result
        #else, query datastore
        else:
                
            key = db.Key.from_path('treeStore',k)
            r = treeStore.get(key)
            """
            query = treeStore.gql("WHERE objId = :objId",
                                objId=k)
            results = query.fetch(1)
            """
            if r is None:
                key = db.Key.from_path('treeStore',"phylobox-2-0-224efed9-f4bf-4f62-a386-24dd3afe3a5a")
                r = treeStore.get(key)
                
            try:
                result = UnzipFiles(StringIO.StringIO(r.objBlob),iszip=True)
                
                #get any downloads that have happened since the last request
                dlcount = memcache.get("tree-download-ct-"+k)
                if dlcount is None:
                    dlcount = 0
                #add them to the stored value
                dlcount += r.downloadCt + 1 #the 1 represents this access
                r.last_access_date = datetime.datetime.now()
                r.downloadCt = dlcount
                r.put()
                
                #create a count iterator in memcache
                memcache.set("tree-download-ct-"+k, 0, 1500000)
                
                #add tree to memcache
                memcache.set("tree-data-"+k, r.objBlob, memtime)
                
                return result
            except:
                out = '{"error":"nothing found"}'
                if k:
                    out += "<p>"+k+"</p>"
                return out
    
    
            
  def post(self):
    out = self.allrequests()

    callback = self.request.params.get('callback', None)
    if callback is not None:
        out = str(callback)+"("+result+")"
        
    self.response.out.write(out)
     
        
  def get(self):
    out = self.allrequests()
    out = simplejson.loads(out)
    out = simplejson.dumps(out,indent=4)
    callback = self.request.params.get('callback', None)
    if callback is not None:
        out = str(callback)+"("+out+")"
        
    self.response.out.write(out.replace("\\/","/"))



############################
class TmpTest(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    out = []
    out.append(self.request.params.get('phyloFile', None))
    out.append(self.request.params.get('permanent', None))
    out.append(self.request.params.get('response', None))
    k = 'tmp-phylobox-2-0-448180af-56b0-44a0-904e-6740fc042b22'
    self.response.out.write(out)
    
class UserInfo(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    if users.get_current_user():
        d = {"user":users.get_current_user().nickname(),
             "email":users.get_current_user().email(),
             "endpoint": users.create_logout_url(self.request.uri)
            }
    else:
        d = {"user":None,
             "email":None,
             "endpoint": users.create_login_url(self.request.uri)
            }
    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(simplejson.dumps(d).replace('\\/','/'))
    
    
class AddNewTree(webapp.RequestHandler):
  def get(self):
    #self.response.out.write(404)  
    self.post()
      
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    cachetime = 9000
    
    #if self.request.params.get('phyloFile', None) is None:
    if self.request.params.get('phyloUrl', None) is not None:
        fileurl = str(self.request.params.get('phyloUrl', None)).strip()
        treefile = memcache.get("tree-data-"+str(fileurl).lower())
        if treefile is None:
            result = urlfetch.fetch(url=fileurl)
            if result.status_code == 200:
                treefile = result.content
                k=str(fileurl).lower()
                memcache.set("tree-data-"+k, treefile, cachetime)
    else:
        treefile = self.request.params.get('phyloFile', None)
    
    if treefile is not None:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile = UnzipFiles(treefile)
        background = "23232F"
        color = "FFFFCC"
        if user:
            author = str(user)
        else:
            author = "anon"
        description = "PhyloJSON Tree Generated at PhyloBox"
        view_mode = 'dendrogram'
        root = None
        width = 1
        htulabels = False
        branchlabels = False
        leaflabels = False
        node_radius = 1
        #set defaults
        branch_color = "FFFFFFFF"
        branch_width = 1.5
        icon = "http://geophylo.appspot.com/static_files/icons/a99.png"
        proximity = 2
        alt_grow = 15000
        title = "Untitled Tree"
        
        try:
            #parse a PhyloXML file
            tree = PhyloXMLtoTree(treefile,color=color)
        except:
            #if xml parsing fails, assume file was Newick. Sophistication needed for future development
            treefile = ParseNewick(str(treefile))
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
                
        treefile = {}
        treefile['v'] = 2
        treefile['k'] = k
        treefile['date'] = str(datetime.datetime.now())
        treefile['author'] = author
        treefile['title'] = title
        treefile['description'] = description
        treefile['root'] = root
        treefile['environment'] = {}
        treefile['environment']['root'] = tree.root
        treefile['environment']['viewmode'] = 0
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

        #zip the string
        treefilezip = ZipFiles(treefile)

        #i have removed a temp table from the data store
        #now i just store tmp trees in memcache for 10 or so days
        
        #handle storage time for the new tree
        stored = False
        if self.request.params.get('store', None):
            #do some long term storage here
            try:
                cachetime = 30 #number of days * sec/day
            except:
                if 'permanent' == self.request.params.get('store', None):
                    tmpEntry = treeStore(key_name=k,
                              objId = k,
                              objBlob = treefilezip,
                              userName = user,
                              treeTitle = title,
                              originalAuthor = user,
                              version = version
                              )
                    tmpEntry.put()
                    
                    tmpEntry = treeOwners(objId = k,
                              userName = user
                              )
                    tmpEntry.put()
                    stored = True
        memcache.set("tree-data-"+k, treefilezip, cachetime)
                    
            #memcache.set("tree-data-"+k, treefilezip, time)
    #self.response.headers['Content-Type'] = 'application/json'
    if self.request.params.get('callback', None) is not None:
        self.response.out.write(self.request.params.get('callback', None) + "(")
    if self.request.params.get('response', None) is not None and str(self.request.params.get('response', "")) == "key":
        out = {"key":k,"url":"http://phylobox.appspot.com/?%s" % (k)}
        self.response.out.write(simplejson.dumps(out).replace('\\/','/')) 
    elif self.request.params.get('response', None) is not None and str(self.request.params.get('response', "")) == "widget":
        self.response.out.write(403)
    elif self.request.params.get('response', None) is not None and str(self.request.params.get('response', "")) == "png":
        self.response.out.write(403)
    elif self.request.params.get('response', None) is not None and str(self.request.params.get('response', "")) == "link":
        self.response.out.write("http://phylobox.appspot.com/?%s" % (k))
    else:
        self.response.out.write(treefile)
    if self.request.params.get('callback', None) is not None:
        self.response.out.write(")")

############################
class TreeGroup(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    callback = self.request.params.get('callback', None)
    g = self.request.params.get('g', None)
    ks = []
    if g is None:
        ct = 0
        while ct != None:
            k = self.request.params.get('k%s'%ct, None)
            if k is None:
                ct = None
            else:
                ks.append(str(k))
                ct+=1
        if len(ks) > 0:
            title = self.request.params.get('title', "Untitled Group")
            desc = self.request.params.get('desc', "Untitled Group Created in PhyloBox")
            g = "group-"+str(hash(str(ks)))
            gr = treeGroup(
                      key=db.Key.from_path('treeGroup', g),
                      gid=g,
                      title=title,
                      description=desc,
                      ids= ks)
            gr.put()
            self.response.headers['Content-Type'] = 'application/json'
            self.response.out.write(simplejson.dumps({"group":g}).replace('\\/','/'))
        else:
            self.response.out.write(500)  
    else:
        key = db.Key.from_path('treeGroup',g)
        ent = treeGroup.get(key)
        out = {"group":g.lower(),
               "title":ent.title,
               "description":ent.description,
               "ids":ent.ids}
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps({"group":out}).replace('\\/','/'))
         
class OldTreeSave(webapp.RequestHandler):
  def post(self):
    self.get()
  def get(self):
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
    
    try:
        k = treefile["key"]
    except:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile["key"] = k
        
    
    key = db.Key.from_path('Tree', k, "TreeIndex", k)
    treeindex = db.get(key)
    tree = db.get(key.parent())
    if treeindex is None or user.lower() not in treeindex.users:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile["key"] = k
        key = db.Key.from_path('Tree', k, "TreeIndex", k)
        treeindex = TreeIndex(key=key)
        if user is not None:
            treeindex.users = [user.lower()]
        tree = Tree(key = key.parent())
        
        
    tree.data = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
    tree.put()
    
    treeindex.title = treefile["title"] if "title" in treefile.keys() else None
    treeindex.version = str(treefile["v"]) if "v" in treefile.keys() else None
    treeindex.date = treefile["date"] if "date" in treefile.keys() else None
    treeindex.root = str(treefile["root"]) if "root" in treefile.keys() else None
    treeindex.author = treefile["author"] if "author" in treefile.keys() else None
    treeindex.description = treefile["description"] if "description" in treefile.keys() else None
    treeindex.scientificName = treefile["scientificName"] if "scientificName" in treefile.keys() else None
    treeindex.scientificNameId = treefile["scientificNameId"] if "scientificNameId" in treefile.keys() else None
    treeindex.scientificNameAuthority = treefile["scientificNameAuthority"] if "scientificNameAuthority" in treefile.keys() else None
    
    nodelist = []
    
    
    for node in treefile["tree"]:
        nodekey = db.Key.from_path('TreeIndex', k, 'Node', node["id"])
        
        indexkey = db.Key.from_path('Node', str(nodekey), 'NodeIndex', str(node["id"]))
        newnode = db.get(nodekey)
        nodeindex = db.get(indexkey)
        if newnode is None:
            newnode = Node(key = nodekey)
            nodeindex = NodeIndex(key = indexkey)
        
        nodelist.append(indexkey)
            
        newnode.visibility = node["visibility"]     #tells the viewer what to draw
             #JSON encoded node
        children = []
        
        if "children" in node.keys() and node["children"] is not None:
            ct = len(node["children"])
            cct = 0
            while cct<ct:
                child = node["children"][cct]
                cct+=1
                children.append(db.Key.from_path('TreeIndex', k, 'Node', str(child["id"])))
        newnode.children = children
        newnode.data = simplejson.dumps(node)  
        newnode.put()
        nodeindex.id = node["id"]
        nodeindex.name = node["name"]
        nodeindex.nodeColor = node["ncolor"]
        nodeindex.branchColor = node["color"]
        nodeindex.branchLength = node["length"]
        nodeindex.branchConfidence = node["conf"]
        nodeindex.confidenceType = node["type"]
        nodeindex.date = node["date"]
        nodeindex.dateMin = node["dateMin"] if "dateMin" in node.keys() else None
        nodeindex.dateMax = node["dateMax"] if "dateMax" in node.keys() else None
        nodeindex.latitude = node["latitude"] if "latitude" in node.keys() else None
        nodeindex.longitude = node["longitude"] if "longitude" in node.keys() else None
        nodeindex.uncertainty = node["uncertainty"] if "uncertainty" in node.keys() else None
        nodeindex.altitude = node["altitude"] if "altitude" in node.keys() else None
        if "taxonomy" in node.keys() and node["taxonomy"] is not None:
            nodeindex.taxonomyString = str(node["taxonomy"])
            nodeindex.scientificName = node["taxonomy"]["scientific_name"].lower()  if "scientific_name" in node["taxonomy"].keys() else None
            #nodeindex.scientificNameId = node["scientificNameId"]  if "scientificNameId" in node.keys() else None
            #nodeindex.scientificNameAuthority = node["scientificNameAuthority"]  if "scientificNameAuthority" in node.keys() else None
        nodeindex.polygon = node["polygon"] if "polygon" in node.keys() else None
        uris = []
        if "uris" in node.keys():
            for uri in node["uris"]:
                uris.append(str(uri["url"]))
        nodeindex.uris = uris
        nodeindex.uriString = str(node["uris"]) if "uris" in node.keys() else None
        nodeindex.put()
    
    treeindex.nodes = nodelist
    treeindex.put()
    out = {"key": k}
    out = simplejson.dumps(out,indent=4).replace('\\/','/')
    if self.request.params.get('callback', None) is not None:
        self.response.out.write(self.request.params.get('callback', None) + "(" + out +")") 
    else:
        self.response.out.write(out) 
    
    #self.response.out.write(str(k))
    """
    
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
                tmpEntry = treeStore(
                          key=db.Key.from_path('treeStore', newk),
                          objId = newk,
                          objBlob = treefile,
                          objPng = png,
                          treeTitle = title,
                          userName = user,
                          forkedObj = k,
                          originalAuthor = tree.originalAuthor,
                          version = version
                          )
                tmpEntry.put()
    
                tmpEntry = treeOwners(
                              objId = newk,
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
                    tmpEntry = treeStore(
                              key=db.Key.from_path('treeStore', newk),
                              objId = newk,
                              objBlob = treefile,
                              objPng = png,
                              userName = user,
                              treeTitle = title,
                              forkedObj = k,
                              originalAuthor = tree.originalAuthor,
                              version = version
                              )
                    tmpEntry.put()
        
                    tmpEntry = treeOwners(
                                  objId = newk,
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
        #Store the forked tree as Anon
        
        newk = "phylobox-"+version+"-"+str(uuid.uuid4())
        trees = treeStore.gql("WHERE objId = :objId",
                            objId=k).fetch(1)
        
        if len(trees)==0:
            tmpEntry = treeStore(
                      key=db.Key.from_path('treeStore', newk),
                      objId = newk,
                      objBlob = treefile,
                      objPng = png,
                      userName = user,
                      forkedObj = k,
                      treeTitle = title,
                      version = version
                      )
            tmpEntry.put()
            
            tmpEntry = treeOwners(
                      objId = newk,
                      userName = user
                      )
            tmpEntry.put()
            k = newk
        else:
            for tree in trees:
                tmpEntry = treeStore(
                          key=db.Key.from_path('treeStore', newk),
                          objId = newk,
                          objBlob = treefile,
                          objPng = png,
                          userName = user,
                          forkedObj = k,
                          treeTitle = title,
                          originalAuthor = tree.originalAuthor,
                          version = version
                          )
                tmpEntry.put()

                tmpEntry = treeOwners(
                              objId = newk,
                              userName = user
                              )
                tmpEntry.put()
                k = newk
        
        #self.response.out.write('you are trying to fork a tree when not signed in')

    memcache.set("tree-data-"+k, treefile, 60000)

    try:
        memcache.set("png-data-"+k, png, 60000)
    except:
        pass
    #return the old (if not forked) or new key string (if forked or first save) to the user
    
    
    self.response.headers['Content-Type'] = "text/javascript; charset=utf-8"
    out = {"key":k}
    self.response.out.write(simplejson.dumps(out).replace('\\/','/')) 
    """
         
class TreeSave(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
      
    #implement this as a taskqueue event, where just the 
    #key of a stored tree is sent here for processing into
    #tree, node, annotation, and index entities
    
    k = self.request.params.get('key', "abc") 
    
    treefile = self.request.params.get('',simplejson.load(open('bcl_2.json','r')))
        
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    
    try:
        k = treefile["key"]
    except:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile["key"] = k
        
    
    key = db.Key.from_path('Tree', k)
    tree = db.get(key)
    indexkey = db.Key.from_path('Tree', k, 'TreeIndex', k)
    treeindex = db.get(indexkey)
    if treeindex is None or users.get_current_user() not in treeindex.users:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        #k = "phylobox-2-0-553752e6-2d54-49f3-880d-e0a2fdef5e43"
        treefile["key"] = k
        key = db.Key.from_path('Tree', k)
        tree = Tree(key = key)
        if users.get_current_user() is not None:
            treeindex.users = [users.get_current_user()]
        
        
    tree.data = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
    tree.environment = simplejson.dumps(treefile["environment"]).replace('\\/','/')
    tree.put()
        
    taskqueue.add(
        url='/treeparse', 
        params={'key': k},
        name="treeparse-%s" % k)
        
    out = {'key': k}
    self.response.out.write(simplejson.dumps(out))
    
    
         
class TreeParse(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    
    tree = db.get(db.Key.from_path('Tree', k))
    treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(tree.data),iszip=True))
    
    tree.title = treefile["title"] if "title" in treefile.keys() else None
    tree.version = str(treefile["v"]) if "v" in treefile.keys() else None
    tree.author = treefile["author"] if "author" in treefile.keys() else None
    tree.description = treefile["description"] if "description" in treefile.keys() else None
    tree.put()
    
    indexkey = db.Key.from_path('Tree', k, 'TreeIndex', k)
    treeindex = TreeIndex(key=indexkey)

    treeindex.title = treefile["title"] if "title" in treefile.keys() else None
    treeindex.date = treefile["date"] if "date" in treefile.keys() else None
    treeindex.root = str(treefile["root"]) if "root" in treefile.keys() else None
    treeindex.author = treefile["author"] if "author" in treefile.keys() else None
    treeindex.scientificName = treefile["scientificName"] if "scientificName" in treefile.keys() else None
    treeindex.scientificNameId = treefile["scientificNameId"] if "scientificNameId" in treefile.keys() else None
    treeindex.scientificNameAuthority = treefile["scientificNameAuthority"] if "scientificNameAuthority" in treefile.keys() else None
    treeindex.put()
    
    
    for node in treefile["tree"]:
        if 'id' not in node.keys() or node['id'] is None:
            node['id'] = random.randint(0,1000000000000)
            
        nodekey = db.Key.from_path('Tree', k, 'Node', str(node["id"]))
        newnode = db.get(nodekey)
        if newnode is None:
            newnode = Node(key = nodekey)
        
            
        newnode.visibility = node["visibility"]     #tells the viewer what to draw
             #JSON encoded node
        children = []
        
        if "children" in node.keys() and node["children"] is not None:
            ct = len(node["children"])
            cct = 0
            while cct<ct:
                child = node["children"][cct]
                cct+=1
                children.append(db.Key.from_path('Tree', k, 'Node', str(child["id"])))
        newnode.children = children
        newnode.data = simplejson.dumps(node)  
        newnode.put()
        
        taskqueue.add(
            url='/nodeparse', 
            params={'key': k,'id':node["id"]},
            name="nodeparse-%s-%s" % (k,node["id"]))
        
    return 200
    
class NodeParse(webapp.RequestHandler):
  def post(self):
    k = self.request.params.get('key', None)
    id = self.request.params.get('id', None)
    indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    nodeindex = db.get(indexkey)
    if nodeindex is None:
        nodeindex = NodeIndex(key = indexkey)
    
    indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    node = simplejson.loads(nodeindex.parent().data)
    
    nodeindex.tree = db.Key.from_path('Tree', k)
    nodeindex.id = node["id"]
    nodeindex.name = node["name"] if "name" in node.keys() else None
    nodeindex.nodeColor = node["ncolor"] if "ncolor" in node.keys() else None
    nodeindex.branchColor = node["color"] if "color" in node.keys() else None
    nodeindex.branchLength = node["length"] if "length" in node.keys() else None
    nodeindex.branchConfidence = node["conf"] if "conf" in node.keys() and type(node["conf"]) == type(1) else None
    nodeindex.confidenceType = node["type"] if "type" in node.keys() else None
    nodeindex.put()

    temporal_annotations = [
            "data","dateMin","dateMax",]
    geographic_annotations = [
            "latitude","longitude","uncertainty","altitude","polygon",]
    
    for a in temporal_annotations:
        if a in node.keys() and node[a] is not None:
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "time"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = node[a]
            annotation.put()
    for a in geographic_annotations:
        if a in node.keys() and node[a] is not None:
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "geography"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = node[a]
            annotation.put()
    if 'taxonomy' in node.keys() and node['taxonomy'] is not None:
        for a,b in node["taxonomy"].items():
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "taxonomy"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = b
            annotation.put()
    if 'uri' in node.keys() and node['uri'] is not None:
        for a,b in node["uris"].items():
            annotation = Annotation(parent=nodeindex.key())
            logging.error(newnode.key())
            annotation.node = nodeindex
            annotation.category = "uri"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = b
            annotation.put()
                
    return 200
      
      
class LookUp(webapp.RequestHandler):
  def post(self):
      self.get()
  def get(self):
    def getChildren(childKey,output,depth=0,maxDepth=-1):
        child = db.get(childKey)
        output.append(child.data)
        if len(child.children)>0:
            for c in child.children:
                getChildren(c,output,depth+1,maxDepth)
        return output
        
    k = self.request.params.get('k',"phylobox-2-0-553752e6-2d54-49f3-880d-e0a2fdef5e43")
    
    #get the stored tree json object straight from the datastore
    def queryTreeByKey(k):
        #tree = db.get(db.Key.from_path('Tree', k, 'TreeIndex', k))
        tree = db.get(db.Key.from_path('Tree', k))
        treeData = UnzipFiles(StringIO.StringIO(tree.data),iszip=True)
        self.response.out.write("%s" % (treeData) )
    
    #get a tree from the treeIndex and return the tree json object
    def simulatedSearch():
        treeIndex = db.get(db.Key.from_path('Tree', k, 'TreeIndex', k))
        tree = treeIndex.parent()
        treeData = UnzipFiles(StringIO.StringIO(tree.data),iszip=True)
        self.response.out.write("%s" % (treeData) )
        
    def simulatedNodeSearch():
        node = db.get(db.Key.from_path('Tree', k, 'Node', "100"))
        tree = node.parent()
        treeData = UnzipFiles(StringIO.StringIO(tree.data),iszip=True)
        self.response.out.write("%s" % (treeData) )
        
    def simulatedAnnotationSearch():
        query = Annotation.all(keys_only = True).filter("name =",'code')
        result = query.fetch(1)
        annotation = result[0]
        node = annotation.parent()
        tree = node.parent()
        treeData = UnzipFiles(StringIO.StringIO(tree.data),iszip=True)
        self.response.out.write("%s" % (treeData) )
    
    def simulatedSubtreeSearch(k):
        rootId = "105"
        out = []
        tree = db.get(db.Key.from_path('Tree', k))
        nodeKey = db.Key.from_path('Tree', k, 'Node', rootId)
        self.response.out.write("""{
            "description": "%s: subqueried at %s", 
            "author": "%s", 
            "k": "%s", 
            "title": "%s", 
            "environment": %s,
            "v": 2, 
            "date": "2010-11-20 01:46:57.943914", 
            "root": %s
            "tree": [""" % (tree.title,rootId,tree.author,k,tree.title,tree.environment,rootId))
            
        for c in getChildren(nodeKey,[]):
            self.response.out.write("%s," % (c) )
        self.response.out.write("]}")
    
    simulatedSubtreeSearch("phylobox-2-0-026672fe-c07a-4515-8c43-4327ffa27a92")

"""
class UpdateAnnotation(webapp.RequestHandler):
  def post(self):
    #fork join queue magic here
"""
