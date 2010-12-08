import cgi
from google.appengine.api import oauth
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch
from google.appengine.api import users
from google.appengine.api.labs import taskqueue

import xml.etree.cElementTree as ET
NS_PXML = '{http://www.phyloxml.org}'


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

##################################################
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
        
        treeCollection = []
        collectionKeys = []
        
        try:
            treexml = ET.parse(StringIO.StringIO(treefile)).getroot()
        except:
            treefile = ParseNewick(str(treefile))
            treexml = ET.parse(StringIO.StringIO(treefile)).getroot()
            
        for treeXML in treexml.findall(NS_PXML+'phylogeny'):
                
            background = "23232F"
            color = "FFFFCC"
            if user:
                author = str(user)
            else:
                author = "anon"
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
            
            try:
                #parse a PhyloXML file
                tree = PhyloXMLtoTree(treeXML,color=color)
            except:
                #if xml parsing fails, assume file was Newick. Sophistication needed for future development
                tree = PhyloXMLtoTree(treeXML,color=color)
                
                
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
            treefile['root'] = root
            treefile['description'] = tree.description
            treefile['title'] = tree.title
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
            
            treeCollection.append(treefile)
            collectionKeys.append(k)
            
            #zip the string
            treefilezip = ZipFiles(str(simplejson.dumps(treefile).replace('\\/','/')))
            
            stored = False
            #don't delete the below method, it needs to be rewritten
            """
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
            """
            memcache.set("tree-data-%s" % k, treefilezip, cachetime)
        
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
        self.response.out.write("http://phylobox.appspot.com/#%s" % (k))
    else:
        if len(collectionKeys)==1:
            self.response.out.write(str(simplejson.dumps(treeCollection[0]).replace('\\/','/')))
        else:
            c = "phylobox-"+version+"-collection-"+str(uuid.uuid4())
            memcache.set("collection-data-%s" % c, collectionKeys, cachetime)
            treeGroup = {"collection":g,"trees":treeCollection}
            self.response.out.write(str(simplejson.dumps(treeCollection).replace('\\/','/')))
        
        
    if self.request.params.get('callback', None) is not None:
        self.response.out.write(")")

    logging.error('done')
    
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
        
class TreeSave(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
      
    #implement this as a taskqueue event, where just the 
    #key of a stored tree is sent here for processing into
    #tree, node, annotation, and index entities
    
    k = self.request.params.get('key', "abc") 
    
    temporary = self.request.params.get('temporary', None) 
    isMemcache = self.request.params.get('memcache', False) 
    
    if isMemcache:
        data = memcache.get("tree-data-%s" % k)
        treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(data),iszip=True))
    else:
        treefile = simplejson.loads(self.request.params.get('tree',None))
        
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    
    try:
        k = treefile["key"]
    except:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile["key"] = k
        
    
    key = db.Key.from_path('Tree', k)
    tree = db.get(key)
    if tree is None or users.get_current_user() not in tree.users:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        #k = "phylobox-2-0-553752e6-2d54-49f3-880d-e0a2fdef5e43"
        treefile["key"] = k
        key = db.Key.from_path('Tree', k)
        tree = Tree(key = key)
        if users.get_current_user() is not None:
            tree.users = [users.get_current_user()]
        
        
    tree.data = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
    tree.environment = simplejson.dumps(treefile["environment"]).replace('\\/','/')
    
    #treefile = simplejson.loads(treefile)
    tree.title = treefile["title"] if "title" in treefile.keys() else None
    tree.version = str(treefile["v"]) if "v" in treefile.keys() else None
    tree.author = treefile["author"] if "author" in treefile.keys() else None
    tree.description = treefile["description"] if "description" in treefile.keys() else None
    tree.put()
    
    params = {'key': k}
    if temporary is not None:
        params['temporary'] = True
        
    taskqueue.add(
        url='/api/treeparse', 
        params=params,
        name="01-%s-%s" % (k.replace('-',''),int(time.time()/10)))
        
    out = {'key': k}
    self.response.out.write(simplejson.dumps(out))
    
    
         
class TreeParse(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    
    temporary = self.request.params.get('temporary', None) 
    
    tree = db.get(db.Key.from_path('Tree', k))
    treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(tree.data),iszip=True))
    
    indexkey = db.Key.from_path('Tree', k, 'TreeIndex', k)
    treeindex = db.get(indexkey)
    if treeindex is None:
        treeindex = TreeIndex(key=indexkey)
        
    if users.get_current_user() is not None:
        if users.get_current_user() not in treeindex.users:
            treeindex.users.append([users.get_current_user()])

    treeindex.title = treefile["title"] if "title" in treefile.keys() else None
    treeindex.date = treefile["date"] if "date" in treefile.keys() else None
    treeindex.root = str(treefile["root"]) if "root" in treefile.keys() else None
    treeindex.author = treefile["author"] if "author" in treefile.keys() else None
    treeindex.scientificName = treefile["scientificName"] if "scientificName" in treefile.keys() else None
    treeindex.scientificNameId = treefile["scientificNameId"] if "scientificNameId" in treefile.keys() else None
    treeindex.scientificNameAuthority = treefile["scientificNameAuthority"] if "scientificNameAuthority" in treefile.keys() else None
    
    if temporary is not None:
        treeindex.temporary = True
        
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
        
        params = {'key': k,'id':node["id"]}
        if temporary is not None:
            params['temporary'] = True
            
        taskqueue.add(
            url='/api/nodeparse', 
            params=params,
            name="%s-%s-%s" % (int(time.time()/10),k.replace('-',''),node["id"]))
        
    return 200
    
class NodeParse(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    
    temporary = self.request.params.get('temporary', None) 
    
    id = self.request.params.get('id', None)
    logging.error("%s: %s" % (k,id))
    indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    """
    nodeindex = NodeIndex.get(indexkey)
    if nodeindex is None:
    """
    nodeindex = NodeIndex(key = indexkey, parent=db.Key.from_path('Tree', k, 'Node', str(id)))
    
    #indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    logging.error(nodeindex.parent())
    node = simplejson.loads(nodeindex.parent().data)
    
    nodeindex.tree = db.Key.from_path('Tree', k)
    nodeindex.id = node["id"]
    nodeindex.name = node["name"] if "name" in node.keys() else None
    nodeindex.nodeColor = node["ncolor"] if "ncolor" in node.keys() else None
    nodeindex.branchColor = node["color"] if "color" in node.keys() else None
    nodeindex.branchLength = node["length"] if "length" in node.keys() else None
    nodeindex.branchConfidence = node["conf"] if "conf" in node.keys() and type(node["conf"]) == type(1) else None
    nodeindex.confidenceType = node["type"] if "type" in node.keys() else None
    
    if temporary is not None:
        nodeindex.temporary = True
        
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
            annotation.triplet = "%s:%s:%s" % ("time",a.lower().strip(),node[a].lower().strip())
            if temporary is not None:
                annotation.temporary = True
            annotation.put()
    for a in geographic_annotations:
        if a in node.keys() and node[a] is not None:
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "geography"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = node[a]
            annotation.triplet = "%s:%s:%s" % ("geography",a.lower().strip(),node[a].lower().strip())
            if temporary is not None:
                annotation.temporary = True
            annotation.put()
    if 'taxonomy' in node.keys() and node['taxonomy'] is not None:
        for a,b in node["taxonomy"].items():
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "taxonomy"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = b
            annotation.triplet = "%s:%s:%s" % ("taxonomy",a.lower().strip(),b.lower().strip())
            if temporary is not None:
                annotation.temporary = True
            annotation.put()
    if 'uri' in node.keys() and node['uri'] is not None:
        for a,b in node["uri"].items():
            annotation = Annotation(parent=nodeindex.key())
            annotation.node = nodeindex
            annotation.category = "uri"
            annotation.user = users.get_current_user()
            annotation.name = a
            annotation.value = b
            annotation.triplet = "%s:%s:%s" % ("uri",a.lower().strip(),b.lower().strip())
            if temporary is not None:
                annotation.temporary = True
            annotation.put()
                
    return 200
      
      
class Annotations(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    node = self.request.params.get('node', None)
    c = self.request.params.get('category', None)
    n = self.request.params.get('name', None)
    v = self.request.params.get('value', None)
    
    indexkey = db.Key.from_path('Tree', k, 'Node', str(node), 'NodeIndex', str(node))
    nodeindex = db.get(indexkey)
    annotation = Annotation(parent=nodeindex.key())
    
    annotation.node = nodeindex
    annotation.category = c
    annotation.user = users.get_current_user()
    annotation.name = n
    annotation.value = v
    annotation.triplet = "%s:%s:%s" % (c.lower().strip(),n.lower().strip(),v.lower().strip())
    annotation.temporary = nodeindex.temporary
    annotation.put()
    
    
    
class LookUp(webapp.RequestHandler):
  def getChildren(self,childKey,output,depth=0,maxDepth=-1,root=False):
    child = db.get(childKey)
    data = child.data
    if root:
        data = simplejson.loads(data)
        data['parent_id'] = None
        data = simplejson.dumps(data)
    output.append(data)
    if len(child.children)>0:
        for c in child.children:
            self.getChildren(c,output,depth+1,maxDepth)
    return output 

  #get the stored tree json object straight from the datastore
  def queryTreeByKey(self):
    #tree = db.get(db.Key.from_path('Tree', k, 'TreeIndex', k))
    k = self.request.params.get('k',None)
    data = memcache.get("tree-data-%s" % k)
    logging.error(data)
    if data is None:
        data = db.get(db.Key.from_path('Tree', k)).data
        memcache.set("tree-data-%s" % k, data, 2000)
    treeData = UnzipFiles(StringIO.StringIO(data),iszip=True)
    logging.error(treeData)
    return treeData 
    
  def annotationSearch(self):
    k = self.request.params.get('k',None)
    c = self.request.params.get('category','taxonomy')
    n = self.request.params.get('name','id')
    v = self.request.params.get('value','16414')
    searchValue = "%s:%s:%s" % (c.lower().strip(),n.lower().strip(),v.lower().strip())
    logging.error(searchValue)
    query = Annotation.all(keys_only = True).filter("triplet =",'%s' % searchValue)
    result = query.fetch(1)[0]
    id = db.get(result.node()).id
    logging.error(id)
    return self.querySubtree(rootId=id)

  def querySubtree(self,rootId=None):
    k = self.request.params.get('k',None)
    if rootId is None:
        rootId = self.request.params.get('rootid',None)
    out = []
    tree = db.get(db.Key.from_path('Tree', k))
    env = simplejson.loads(tree.environment)
    env['root'] = rootId
    output = """{
        "description": "%s: subqueried at %s", 
        "author": "%s", 
        "k": "%s", 
        "title": "%s", 
        "environment": %s,
        "v": 2, 
        "date": "%s", 
        "root": %s,
        "tree": [""" % (tree.title,rootId,tree.author,k,tree.title,simplejson.dumps(env),tree.addtime,rootId) 
    
    rootNode = db.Key.from_path('Tree', k, 'Node', str(rootId))
    for c in self.getChildren(rootNode,[],root=True):
        output += "%s," % (c) 
    output += "]}"
    return output
    
  def post(self,method):
    self.get(method)
  def get(self,method):
    methods = {'queryTreeByKey': self.queryTreeByKey,
               'subtreeSearch': self.querySubtree,
               'annotationSearch': self.annotationSearch}
    
    #temporary workaround until JS handles the method independently
    method = 'annotationSearch'
        
    logging.error(method)
    cb = self.request.params.get('callback')
    if cb is not None:
        self.response.out.write("%s (" % (cb) )
    
    self.response.out.write( methods[method]() )
    
    if cb is not None:
        self.response.out.write(")")


application = webapp.WSGIApplication([('/api/new', AddNewTree),
                                      ('/api/group', TreeGroup),
                                      ('/api/user', UserInfo),
                                      ('/api/save', TreeSave),
                                      ('/api/treeparse', TreeParse),
                                      ('/api/nodeparse', NodeParse),
                                      ('/api/adduser', AddUser),
                                      ('/api/annotations', Annotations),
                                      ('/api/lookup/(.*)', LookUp)],      
                                     debug=False)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
