import cgi
from google.appengine.api import oauth
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch

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
from DataStore import *
from GenericMethods import *
from phyloxml import *
from NewickParser import *
 
 
class PngOutput(webapp.RequestHandler):
  def allrequests(self):
    k = self.request.params.get('k', None)
    if k is None:
        out = "<p>"
        out += "POST or GET Params: <br>\r\n"
        out += "k: the UUID for the phylogeny project (example: phylobox-1-0-2c9a4f37-1019-4a17-a6b8-79969c3f1bbb)  <br>\r\n"
        
        out += "</p><p>"
        out += "Response Params: <br>\r\n"
        out += "PNG image object<br>\r\n"
        out += "</p>"
        self.response.out.write(out)  
    else:
        #try memcache
        data = memcache.get("png-data-"+k)
        #return it if it is there
        if data is not None:
            data.lstrip('"')
            data.rstrip('"')
            data.replace("\"",'')
            data.replace('"','')
            data = data.split(',')[1]
            self.response.headers['Content-Type'] = 'image/png'
            self.response.out.write(base64.b64decode(data))
        else:
            query = treeStore.gql("WHERE objId = :objId", objId=k)
            res = query.fetch(1)
            output = []
            ct = 1
            comma = ""
            png = ""
            for r in res:
                data = r.objPng
                if data is not None:
                    png = data
                    png.lstrip('"')
                    png.rstrip('"')
                    png.replace("\"",'')
                    png.replace('"','')
                    png = png.split(',')[1]
            
            #add it to memcache
            try:
                memcache.set("png-data-"+k,data,300)
            except:
                pass
            
            #return it to the user
            self.response.headers['Content-Type'] = 'image/png'
            self.response.out.write(base64.b64decode(png))

    #self.response.out.write('<image src="'+png+'" />')
  def post(self):
    self.allrequests()
  def get(self):
    self.allrequests()
 
class AuthorLineage(webapp.RequestHandler):
  def allrequests(self):
    k = str(self.request.params.get('k', None)).strip()
    query = treeStore.gql("WHERE forkedObj = :objId", objId=k)
    res = query.fetch(100)
    output = []
    ct = 1
    comma = ""
    for r in res:
        out = {}
        out["rowCount"] = ct
        out["userName"] = r.userName
        out["downloadCt"] = str(r.downloadCt)
        out["lastUpdate"] = str(r.last_update_date).split(' ')[0]
        out["treeId"] = str(r.objId)
        out["viewLink"] = "/tree/edit?k="+str(r.objId)
        output.append(out)
        comma = ",\n"
        ct+=1
    
    #self.response.out.write(simplejson.dumps(simplejson.loads(str(output))))
    self.response.out.write(simplejson.dumps(output))
        
        
        
            
  def post(self):
    self.allrequests()
  def get(self):
    self.allrequests()
        
    
      
      
class LookUp(webapp.RequestHandler):
  def allrequests(self):
    memtime = 300
    k = str(self.request.params.get('k', None)).strip()
    if k is None:
        self.response.out.write(200)
        
    elif k == 'perm9c63a1c1-9d89-4562-97cf-b1a479e56460':
        treefile = open('examplejson','r').read()
        callback = self.request.params.get('callback', None)
        return treefile
        
    else:
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
            if cmp(k[:3],"tmp")==0:
                self.response.out.write(404)
            else:
                query = treeStore.gql("WHERE objId = :objId",
                                    objId=k)
                    
                #result = db.GqlQuery(query)
                results = query.fetch(1)
                
                try:
                    result = UnzipFiles(StringIO.StringIO(results[0].objBlob),iszip=True)
                    
                    #get any downloads that have happened since the last request
                    dlcount = memcache.get("tree-download-ct-"+k)
                    if dlcount is None:
                        dlcount = 0
                    #add them to the stored value
                    dlcount += results[0].downloadCt + 1 #the 1 represents this access
                    results[0].last_access_date = datetime.datetime.now()
                    results[0].downloadCt = dlcount
                    results[0].put()
                    
                    #create a count iterator in memcache
                    memcache.set("tree-download-ct-"+k, 0, 1500000)
                    
                    #add tree to memcache
                    memcache.set("tree-data-"+k, results[0].objBlob, memtime)
                    
                    return result
                except:
                    out = '<p>POST:<br>k: your_phylobox_key</p>'
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
    self.response.out.write(404)  
      
  def post(self):
    user,url,url_linktext = GetCurrentUser(self)
    
    treefile = self.request.params.get('phyloFile', None)
        
    if treefile is not None:
        version = os.environ['CURRENT_VERSION_ID'].split('.')
        version = str(version[0])
        k = "phylobox-"+version+"-"+str(uuid.uuid4())
        treefile = UnzipFiles(treefile)
        background = "23232F"
        color = "FFFFCC"
        if user:
            author = str(user)
        else:
            author = "anon"
        description = "PhyloJSON Tree Generated at PhyloBox"
        view_mode = 'Dendrogram'.lower()
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
        treefile['v'] = 1
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
            time = 2678400
            try:
                time = int(self.request.params.get('store', None))*86400 #number of days * sec/day
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
                    
            memcache.set("tree-data-"+k, treefilezip, time)
        else:
            memcache.set("tree-data-"+k, treefilezip, 2678400)
        
        
    self.response.headers['Content-Type'] = "text/javascript; charset=utf-8"
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

############################

        
class ConvertToPhyloJSON(webapp.RequestHandler):
  def get(self):
    out = "<p>"
    out += "POST Params: <br>\r\n"
    out += "type: default=PhyloXML. File type to convert, only PhyloXML supported now<br>\r\n"
    out += "callback: see <a href='http://developer.yahoo.com/common/json.html'>here</a>, default None <br>\r\n"
    out += "phyloFile: your phylogeny file (normal or zipped), we only have PhyloXML support on the API for now  <br>\r\n"
    
    out += "</p><p>"
    out += "Response Params: <br>\r\n"
    out += "PhyloJSON object (wrapped in callback if called) <br>\r\n"
    out += "*we will open up perminent storage through the API very soon<br>\r\n"
    out += "</p>"
    self.response.out.write(out)  
      
  def post(self):
    callback = self.request.params.get('callback', None)
    treefile = self.request.params.get('phyloFile', None)
    if treefile is not None:
        treefile = UnzipFiles(treefile)
        background = "1d1d1d"
        color = "75a0cb"
        if user:
            author = str(user)
        else:
            author = "anon"
        title = "Your tree"
        description = "PhyloJSON Tree Generated at PhyloBox"
        view_mode = 'Dendrogram'.lower()
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
        title = "Created with Phylobox"
        
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
        treefile['v'] = 1
        treefile['date'] = str(datetime.datetime.now())
        treefile['author'] = author
        treefile['title'] = title
        treefile['description'] = description
        treefile['root'] = root
        treefile['environment'] = {}
        treefile['environment']['root'] = tree.root
        treefile['environment']['viewmode'] = 0
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
        
    self.response.out.write(treefile)  
        
class TestSpec(webapp.RequestHandler):
  def get(self):
    callback = self.request.params.get('callback', None)
    treefile = open('Baeolophus_np.xml','r').read()
    treefile = UnzipFiles(treefile)
    #set defaults
    background = "1d1d1d"
    color = "75a0cb"
    author = "anon"
    title = "Your tree"
    description = "PhyloJSON Tree Generated at PhyloBox"
    view_mode = 'Dendrogram'.lower()
    focus = None
    zoom = 0
    width = 1
    htulabels = False
    branchlabels = False
    leaflabels = False
    
    tree = PhyloXMLtoTree(treefile,color=color)
    tree.load()
    out = ''
    output = []
    for a,b in tree.objtree.tree.items():
        if a != 0:
            output.append(b.json())
    
    treefile = {}
    treefile['v'] = 1
    treefile['date'] = str(datetime.datetime.now())
    treefile['author'] = author
    treefile['title'] = title
    treefile['description'] = description
    treefile['root'] = tree.root
    treefile['environment'] = {}
    treefile['environment']['root'] = tree.root
    treefile['environment']['view_mode'] = view_mode
    treefile['environment']['color'] = background
    treefile['environment']['focus'] = focus
    treefile['environment']['zoom'] = zoom
    treefile['environment']['width'] = width
    treefile['environment']['htulabels'] = htulabels
    treefile['environment']['branchlabels'] = branchlabels
    treefile['environment']['leaflabels'] = leaflabels
    treefile['tree'] = output
    
    treefile = simplejson.dumps(treefile, indent=4)
    self.response.headers['Content-Type'] = "text/javascript; charset=utf-8"
    self.response.out.write(treefile.replace('\\/','/')) 
        
class CreatePhyloBox(webapp.RequestHandler):
  def get(self):
    out = "<p>"
    out += "REQUIRES OAUTH<br>\r\n"
    out += "POST Params: <br>\r\n"
    out += "callback: see JSON <br>\r\n"
    out += "phyloFile: your phylogeny, we only have PhyloXML support on the API for now  <br>\r\n"
    
    out += "</p><p>"
    out += "Response Params: <br>\r\n"
    out += "JSON Object {key:your_temp_key_value}  (wrapped in callback if called)<br>\r\n"
    out += "*we will open up perminent storage through the API very soon<br>\r\n"
    out += "</p>"
    self.response.out.write(out)  
      
  def post(self):
    try:
        # Get the db.User that represents the user on whose behalf the
        # consumer is making this request.
        user = oauth.get_current_user()
            
        callback = self.request.params.get('callback', None)
        key = self.request.params.get('k', None)
        treefile = self.request.params.get('phyloFile', None)
        treefile = UnzipFiles(treefile)
        if key is None:
            key = "phylobox-"+version+"-"+str(uuid.uuid4())
        self.response.out.write('not quite ready yet')  
        """
        query = treeStore.gql("WHERE objId = :objId ",
                            objId=key)
        results = query.fetch(1)
        
        if len(results)==0:
            treefile = str(urllib.unquote(treefile))
            background = "1d1d1d"
            color = "75a0cb"
            author = "anon"
            title = "Your tree"
            description = "PhyloJSON Tree Generated at PhyloBox"
            view_mode = 'Dendrogram'.lower()
            focus = None
            zoom = 0
            width = 1
            htulabels = False
            branchlabels = False
            leaflabels = False
            
            tree = PhyloXMLtoTree(treefile,color=color)
            tree.load()
            out = ''
            output = []
            for a,b in tree.objtree.tree.items():
                if a != 0:
                    output.append(b.json())
                    
            treefile = {}
            treefile['v'] = 1
            treefile['date'] = str(datetime.datetime.now())
            treefile['author'] = author
            treefile['title'] = title
            treefile['description'] = description
            treefile['root'] = tree.root
            treefile['environment'] = {}
            treefile['environment']['root'] = tree.root
            treefile['environment']['view_mode'] = view_mode
            treefile['environment']['color'] = background
            treefile['environment']['focus'] = focus
            treefile['environment']['zoom'] = zoom
            treefile['environment']['width'] = width
            treefile['environment']['htulabels'] = htulabels
            treefile['environment']['branchlabels'] = branchlabels
            treefile['environment']['leaflabels'] = leaflabels
            treefile['tree'] = output
            treefile = str(simplejson.dumps(treefile).replace('\\/','/'))
            tmpEntry = treeStore(objId = key,
                             objBlob = ZipFiles(treefile))
            tmpEntry.put()
            
        result = simplejson.dumps({"key":key})
        
        if callback is not None:
            result = str(callback)+"("+result+")"
        self.response.out.write(result)  
        """
    except oauth.OAuthRequestError, e:
        # The request was not a valid OAuth request.
        # ...
        self.response.out.write("error")  
        
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
            g = str(hash(str(ks).lower()))
            gr = treeGroup(key_name=g,
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
        key = db.Key.from_path('treeGroup',g.lower())
        ent = treeGroup.get(key)
        out = {"group":g.lower(),
               "title":ent.title,
               "description":ent.description,
               "ids":ent.ids}
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(simplejson.dumps({"group":out}).replace('\\/','/'))
   
        
    
        
class APIServices(webapp.RequestHandler):
  def get(self):
    out = "<p>"
    out += "This is the growing API: <br>\r\n"
    out += "Convert to PhyloJSON: <a href='/api/convert'>/api/convert</a> <br>\r\n"
    out += "Generate PhyloBox (not ready): <a href='/api/create'>/api/create</a> <br>\r\n"
    out += "Get stored PhyloBox tree: <a href='/api/lookup'>/api/lookup</a> <br>\r\n"
    out += "Get image/png of PhyloBox tree: <a href='/api/image.png'>/api/image.png</a> <br>\r\n"
    out += "</p>"
    self.response.out.write(out)  
      
         
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
                tmpEntry = treeStore(key_name=newk,
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
                    tmpEntry = treeStore(key_name=newk,
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
    
    
    self.response.headers['Content-Type'] = "text/javascript; charset=utf-8"
    out = {"key":k}
    self.response.out.write(simplejson.dumps(out).replace('\\/','/')) 
    

