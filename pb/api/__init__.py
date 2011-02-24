import cgi
from google.appengine.api import oauth
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch
from google.appengine.api import users
from google.appengine.api import taskqueue

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
from pb.DB import *
#from DataStore import *
from pb.methods import *
from pb.parsing.phyloxml import *
from pb.parsing.nexml import *
from pb.parsing.newick import * 

##################################################
class UserInfo(webapp.RequestHandler):
  def removeRedirect(self,url):
      out = ''
      url = url.split('?',1)
      out+=url[0]+'?'
      for u in url[1].split('&'):
          u = u.split('=')
          if u[0] != 'continue':
              out+= '%s=%s&' % (u[0],u[1])
      return out
      
  def get(self):
    self.post()
  def post(self):
    url = self.request.params.get('url', "/") 
    if users.get_current_user():
        d = {"user":users.get_current_user().nickname(),
             "email":users.get_current_user().email(),
             "endpoint": users.create_logout_url(url)
            }
    else:
        d = {"user":None,
             "email":None,
             "endpoint": users.create_login_url(url)
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
    k = None
    userKey = None
    user,url,url_linktext = GetCurrentUser(self)
    if users.get_current_user() is not None:
        userKey = db.Key.from_path('UserProfile', str(users.get_current_user()).lower())
        userProfile = UserProfile.get(userKey)
        if userProfile is None:
            userProfile = UserProfile(key=userKey)
            userProfile.user = users.get_current_user()
            userProfile.put()
    
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    cachetime = 9000
    treefile = None
    treeCollection = []
    collectionKeys = []
    treeSizes = []
    
    wasCached = False
    
    #if self.request.params.get('phyloFile', None) is None:
    fileurl = self.request.params.get('phyloUrl', None)
    stringxml = self.request.params.get('stringXml', None)
    if fileurl is not None:
        k="phylobox-%s-%s" % (version,hash(fileurl))
        data = memcache.get("tree-data-"+k)
        if data is None:
            result = urlfetch.fetch(url=fileurl)
            if result.status_code == 200:
                treefile = result.content
        else:
            wasCached = True
            treeCollection.append({"treefile":simplejson.loads(UnzipFiles(StringIO.StringIO(data),iszip=True))})
            collectionKeys.append(k)
            treeSizes.append(len(treeCollection[0]))
    elif stringxml is not None:
        treefile = ET.fromstring(stringxml.strip())
        treefile = ET.tostring(treefile) #.read()
        #logging.error(treefile)
    else:
        treefile = self.request.params.get('phyloFile', None)
    
    if treefile is not None:
        if k is None:
            k = "phylobox-"+version+"-"+str(uuid.uuid4())
            
        treefile = UnzipFiles(treefile)
        treefile = treefile.decode('latin1').encode('utf8')
        treexml = ET.parse(StringIO.StringIO(treefile)).getroot()
        
        try:
            treexml = ET.parse(StringIO.StringIO(treefile)).getroot()
        except:
            treefile = ParseNewick(str(treefile))
            treexml = ET.parse(StringIO.StringIO(treefile)).getroot()
             
        NS_XML = "{%s}" % str(treexml).split('{')[1].split('}')[0]
        
        if 'phyloxml' in str(treexml):
            xmlType = 'phyloxml'
            topE = 'phylogeny'
        else:
            xmlType = 'nexml'
            treexml = treexml.findall(NS_XML+'trees')[0]
            topE = 'tree'
            
        for treeXML in treexml.findall(NS_XML+topE):
            
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
            
            if xmlType=='phyloxml':
                #parse a PhyloXML file
                tree = PhyloXMLtoTree(treeXML,color=color,k=k)
            else:
                #if xml parsing fails, assume file was Newick. Sophistication needed for future development
                tree = NeXMLtoTree(treeXML,color=color,k=k)
                
                
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
            
            if tree.description is not None:
                treefile['description'] = tree.description
            elif fileurl is not None:
                treefile['description'] = fileurl
            else:
                treefile['description'] = None
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
            
            treeSizes.append(len(output))
            treeColl = {"treefile":treefile,"tasks":tree.objtree.tasks,"puts":tree.objtree.puts}
            treeCollection.append(treeColl)
            collectionKeys.append(k)
            
            #zip the string
            treefilezip = ZipFiles(str(simplejson.dumps(treefile).replace('\\/','/')))
            
            stored = False

            try:
                inMemcache = True
                memcache.set("tree-data-%s" % k, treefilezip, cachetime)
            except:
                userKey = db.Key.from_path('UserProfile', str(users.get_current_user()).lower())
                tree = Tree.get_or_insert(k)
                tree.data = treefilezip
                tree.users.append(userKey)
                tree.put()
                inMemcache = False
    
    for coll in treeCollection:
        if wasCached is False:
            t = coll["treefile"]
            k = t['k']
            key = db.Key.from_path('Tree', k)
            tree = db.get(key)
            existing = True
            if tree is None or userKey not in tree.users:
                k = "phylobox-"+version+"-"+str(uuid.uuid4())
                #k = "phylobox-2-0-553752e6-2d54-49f3-880d-e0a2fdef5e43"
                treefile["key"] = k
                key = db.Key.from_path('Tree', k)
                tree = Tree(key = key)
                if userKey is not None:
                    tree.users = [userKey]
                existing = False
                #tree.data = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
                tree.environment = simplejson.dumps(treefile["environment"]).replace('\\/','/')
                
                #treefile = simplejson.loads(treefile)
                tree.title = t["title"] if "title" in t.keys() else None
                tree.version = str(t["v"]) if "v" in t.keys() else None
                tree.author = t["author"] if "author" in t.keys() else None
                tree.description = t["description"] if "description" in t.keys() else None
                tree.put()
                
                indexkey = db.Key.from_path('Tree', k, 'TreeIndex', k)
                treeindex = db.get(indexkey)
                if treeindex is None:
                    treeindex = TreeIndex(key=indexkey)
                userKey = str(userKey)
                if userKey is not None:
                    if db.Key(userKey) not in treeindex.users:
                        treeindex.users.append(db.Key(userKey))

                treeindex.title = treefile["title"] if "title" in treefile.keys() else None
                treeindex.date = treefile["date"] if "date" in treefile.keys() else None
                treeindex.root = str(treefile["root"]) if "root" in treefile.keys() else None
                treeindex.author = treefile["author"] if "author" in treefile.keys() else None
                treeindex.scientificName = treefile["scientificName"] if "scientificName" in treefile.keys() else None
                treeindex.scientificNameId = treefile["scientificNameId"] if "scientificNameId" in treefile.keys() else None
                treeindex.scientificNameAuthority = treefile["scientificNameAuthority"] if "scientificNameAuthority" in treefile.keys() else None
                db.put(treeindex)
                
                db.put(coll["puts"])
                
                for tsk in coll["tasks"]:  
                    #{'params': {'id': 62, 'key': 'phylobox-2-0--1147718809'}, 'name': '129850343-phylobox201147718809-62'}
                    taskqueue.add(
                        queue_name='tree-processing-queue',
                        url='/task/nodeparse', 
                        params=tsk['params'],
                        name=tsk['name'])
                    
                
                
            
            """
            taskqueue.add(
                queue_name='tree-processing-queue',
                url='/api/save', 
                params=params,
                name="02-%s-%s" % (k.replace('-',''),int(time.time())))
            """
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
            if max(treeSizes) > 8000:
                logging.error('very large tree')
                self.response.out.write(str(simplejson.dumps(
                    {"error": "your tree is very large", "suggestions": 
                        ["some option"]
                    })))
            else:
                self.response.out.write(simplejson.dumps(treeCollection[0]["treefile"]).replace('\\/','/'))
        """
        else:
            c = "phylobox-"+version+"-collection-"+str(uuid.uuid4())
            memcache.set("collection-data-%s" % c, collectionKeys, cachetime)
            treeGroup = {"collection":c,"trees":treeCollection}
            self.response.out.write(str(simplejson.dumps(treeCollection).replace('\\/','/')))
        """
        
    if self.request.params.get('callback', None) is not None:
        self.response.out.write(")")

    #logging.error('done')
"""
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
"""
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
    
    userKey = self.request.params.get('userKey', None) 
    
    if userKey is None:
        if users.get_current_user() is not None:
            userKey = db.Key.from_path('UserProfile', str(users.get_current_user()).lower())
            userProfile = UserProfile.get_or_insert(str(users.get_current_user()).lower())
    else:
        userKey = db.Key(userKey)
        userProfile = db.get(userKey)
        
    if isMemcache:
        data = memcache.get("tree-data-%s" % k)
        treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(data),iszip=True))
    else:
        data = db.get(db.Key.from_path('Tree', k)).data
        treefile = simplejson.loads(UnzipFiles(data,iszip=True))
        
    version = os.environ['CURRENT_VERSION_ID'].split('.')
    version = str(version[0])
    
    try:
        k = treefile["key"]
    except:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile["key"] = k
        
    
    key = db.Key.from_path('Tree', k)
    tree = db.get(key)
    existing = True
    if tree is None or userKey not in tree.users:
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        #k = "phylobox-2-0-553752e6-2d54-49f3-880d-e0a2fdef5e43"
        treefile["key"] = k
        key = db.Key.from_path('Tree', k)
        tree = Tree(key = key)
        if userKey is not None:
            tree.users = [userKey]
        existing = False
        
    if userKey is None or userKey in tree.users:
        if tree.environment and 'subtree' in tree.environment.keys():
            orig = simplejson.loads(UnzipFiles(StringIO.StringIO(tree.data),iszip=True))
            reps = []
            tree = []
            for node in treefile["tree"]:
                reps.append(node['id'])
                tree.append(node)
            for node in orig["tree"]:
                if node['id'] in reps:
                    pass
                else:
                    tree.append(node)
            orig["tree"] = tree
            tree.data = orig
            tree.put()
            
        else:
            tree.data = ZipFiles(simplejson.dumps(treefile).replace('\\/','/'))
            tree.environment = simplejson.dumps(treefile["environment"]).replace('\\/','/')
            
            #treefile = simplejson.loads(treefile)
            tree.title = treefile["title"] if "title" in treefile.keys() else None
            tree.version = str(treefile["v"]) if "v" in treefile.keys() else None
            tree.author = treefile["author"] if "author" in treefile.keys() else None
            tree.description = treefile["description"] if "description" in treefile.keys() else None
            tree.put()
        
        params = {'key': k}
        if userKey is not None:
            params['userKey'] =  str(userKey)
        
        if temporary is not None:
            params['temporary'] = True
        """
        taskqueue.add(
            url='/task/treeparse', 
            params=params,
            name="01-%s-%s" % (k.replace('-',''),int(time.time()/10)))
        """
        
        out = {'key': k}
        self.response.out.write(simplejson.dumps(out))
    
class Annotations(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    node = self.request.params.get('node', None)
    c = self.request.params.get('category', None)
    n = self.request.params.get('name', None)
    v = self.request.params.get('value', None)
    
    userKey = self.request.params.get('userKey', None) 
    
    if userKey is None and users.get_current_user() is not None:
        userKey = db.Key.from_path('UserProfile', str(users.get_current_user()).lower())
        userProfile = UserProfile.get_or_insert(str(users.get_current_user()).lower())
    else:
        userKey = db.Key(userKey)
        userProfile = db.get(userKey)
    
    indexkey = db.Key.from_path('Tree', k, 'Node', str(node), 'NodeIndex', str(node))
    nodeindex = db.get(indexkey)
    annotation = Annotation(parent=nodeindex.key())
    
    annotation.node = nodeindex
    annotation.category = c
    annotation.user = userKey
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
    
    treeData = None
    #logging.error(data)
    if data is None:
        data = db.get(db.Key.from_path('Tree', k))
        if data:
            data = data.data
            memcache.set("tree-data-%s" % k, data, 2000)
            treeData = UnzipFiles(StringIO.StringIO(data),iszip=True)
    else:
        treeData = UnzipFiles(StringIO.StringIO(data),iszip=True)
    #logging.error(treeData)
    return treeData 
    
  def annotationSearch(self):
    k = self.request.params.get('k',None)
    c = self.request.params.get('category',None)
    n = self.request.params.get('name',None)
    v = self.request.params.get('value',None)
    if c==n==v==None:
        searchValue = self.request.params.get('triplet',None).lower().strip()
    else:
        searchValue = "%s:%s:%s" % (c.lower().strip(),n.lower().strip(),v.lower().strip())
    logging.error(searchValue)
    id = memcache.get("subtree-root-%s-%s" % (k,searchValue))
    if id is None:
        query = Annotation.all().filter("triplet =",'%s' % searchValue).filter("tree = ", db.Key.from_path('Tree', k))
        result = query.fetch(1)[0]
        annoType = type(result)
        while type(result) == annoType:
            result = result.parent()
        id = result.id
        memcache.set("subtree-root-%s-%s" % (k,searchValue),id,)
    return self.querySubtree(rootId=id)

  def querySubtree(self,rootId=None):
    k = self.request.params.get('k',None)
    if rootId is None:
        rootId = self.request.params.get('rootid',None)
    output = memcache.get("subtree-data-%s-%s" % (k,rootId))
    if output is None:
        out = []
        tree = db.get(db.Key.from_path('Tree', k))
        env = simplejson.loads(tree.environment)
        env['subtree'] = True
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
        try:
            tmp = ZipFiles(str(simplejson.dumps(output).replace('\\/','/')))
            memcache.set("subtree-data-%s-%s" % (k,rootId),tmp,3000)
        except:
            pass
    else:
        output = simplejson.loads(UnzipFiles(StringIO.StringIO(output),iszip=True))
    return output
    
  def post(self,method):
    self.get(method)
  def get(self,method):
    methods = {'byKey': self.queryTreeByKey,
               'subTree': self.querySubtree,
               'byAnnotation': self.annotationSearch}
    
    #temporary workaround until JS handles the method independently
    #method = 'annotationSearch'
        
    #logging.error(method)
    cb = self.request.params.get('callback')
    if cb is not None:
        self.response.out.write("%s (" % (cb) )
    
    self.response.out.write( methods[method]() )
    
    if cb is not None:
        self.response.out.write(")")


application = webapp.WSGIApplication([('/api/new', AddNewTree),
                                      #('/api/group', TreeGroup),
                                      ('/api/user', UserInfo),
                                      ('/api/save', TreeSave),
                                      ('/api/adduser', AddUser),
                                      ('/api/annotations', Annotations),
                                      ('/api/lookup/(.*)', LookUp)],      
                                     debug=False)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
