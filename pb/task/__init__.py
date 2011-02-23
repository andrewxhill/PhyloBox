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
from pb.DB import *
#from DataStore import *
from pb.methods import *
from pb.parsing.phyloxml import *
from pb.parsing.newick import * 
         
class TreeParse(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    temporary = self.request.params.get('temporary', None) 
    userKey = self.request.params.get('userKey', None) 
    
    if self.request.params.get('memcache', None) is None:
        tree = db.get(db.Key.from_path('Tree', k))
        memcache.set("tree-data-%s" % k, tree.data, 3000)
        treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(tree.data),iszip=True))
    else:
        tree = memcache.get("tree-data-%s" % k)
        if tree is None:
            tree = db.get(db.Key.from_path('Tree', k)).data
        treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(tree),iszip=True))

    params = {'key': k}
    if userKey is not None:
        params['userKey'] = str(userKey)
        
    if temporary is not None:
        params['temporary'] = 1
    taskqueue.add(
        queue_name='tree-processing-queue',
        url='/task/treesplit', 
        params= params,
        name="03-%s-%s" % (k.replace('-',''),int(time.time())))
        
    indexkey = db.Key.from_path('Tree', k, 'TreeIndex', k)
    treeindex = db.get(indexkey)
    if treeindex is None:
        treeindex = TreeIndex(key=indexkey)
        
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
    
    if temporary is not None:
        treeindex.temporary = True
        
    #treeindex.put()
    db.put(treeindex)


class TreeSplit(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    batchLimit = 250
    k = self.request.params.get('key', None)
    offset = int(self.request.params.get('offset', 0))
    temporary = self.request.params.get('temporary', None) 
    userKey = self.request.params.get('userKey', None) 
    
    tree = memcache.get("tree-data-%s" % k)
    if tree is None:
        tree = db.get(db.Key.from_path('Tree', k)).data
        
    treefile = simplejson.loads(UnzipFiles(StringIO.StringIO(tree),iszip=True))
        
    nodePuts = []
    nodeTasks = []
    nodeCt = 0
    for node in treefile["tree"]:
        if nodeCt < offset:
            nodeCt += 1
        else:
            if 'id' not in node.keys() or node['id'] is None:
                node['id'] = random.randint(10000000,20000000)
            
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
            
            nodePuts.append(newnode)
            #newnode.put()
            
            newTask = {'params': {'key': k,'id':node["id"]}}
            if userKey is not None:
                newTask['userKey'] = userKey
            newTask['name'] = "%s-%s-%s" % (int(time.time()/10),k.replace('-',''),node["id"])
            
            if temporary is not None:
                newTask['params']['temporary'] = True
            
            
            nodeTasks.append(newTask)
            nodeCt+=1
            if nodeCt%batchLimit==0:
                db.put(nodePuts)
                for task in nodeTasks:
                    taskqueue.add(
                        queue_name='tree-processing-queue',
                        url='/task/nodeparse', 
                        params=task['params'],
                        name=task['name'])
                
                params = {'offset': nodeCt,
                          'key': k}
                if userKey is not None:
                    params['userKey'] = userKey 
                
                if temporary is not None:
                    params['temporary'] = 1
                    
                taskqueue.add(
                    queue_name='tree-processing-queue',
                    url='/task/treesplit', 
                    params=params,
                    name="03-%s-%s" % (k.replace('-',''),int(time.time())))
                
                nodeCt = 0
                break
            
    if nodeCt > 0:
        db.put(nodePuts)
        for task in nodeTasks:
            taskqueue.add(
                queue_name='tree-processing-queue',
                url='/task/nodeparse', 
                params=task['params'],
                name=task['name'])
        
    
    return 200
    


class NodeParse(webapp.RequestHandler):
  def get(self):
    self.post()
  def post(self):
    k = self.request.params.get('key', None)
    temporary = self.request.params.get('temporary', None) 
    userKey = self.request.params.get('userKey', None) 
    userName = None
    if userKey is not None:
        userName = db.get(db.Key(userKey)).user
    
    
    jobPuts = []
    
    id = self.request.params.get('id', None)
    indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    """
    nodeindex = NodeIndex.get(indexkey)
    if nodeindex is None:
    """
    nodeindex = NodeIndex(key = indexkey, parent=db.Key.from_path('Tree', k, 'Node', str(id)))
    
    #indexkey = db.Key.from_path('Tree', k, 'Node', str(id), 'NodeIndex', str(id))
    node = simplejson.loads(nodeindex.parent().data)
    
    nodeindex.tree = db.Key.from_path('Tree', k)
    nodeindex.id = node["id"]
    nodeindex.name = node["name"] if "name" in node.keys() else None
    
    if temporary is not None:
        nodeindex.temporary = True
        
    #nodeindex.put()
    jobPuts.append(nodeindex)

    temporal_annotations = [
            "data","dateMin","dateMax",]
    geographic_annotations = [
            "latitude","longitude","uncertainty","altitude","polygon",]
    
    if "conf" in node.keys() and node["conf"] is not None:
        cd = node["conf"]
        if type(cd)==type([]):
            for confdata in cd:
                annotation = Annotation(parent=nodeindex.key())
                annotation.tree = nodeindex.parent().parent().key()
                annotation.category = "confidence"
                annotation.user = userName
                conftype = "unknown"
                conf = "unknown"
                if "type" in confdata.keys() and confdata["type"] is not None:
                    conftype = u"%s" % confdata["type"]
                if "conf" in confdata.keys():
                    conf = u"%s" % confdata["conf"]
                annotation.name = conftype
                annotation.value = conf
                annotation.triplet = "%s:%s:%s" % ("confidence",conftype.lower().strip(),conf.lower().strip())
                if temporary is not None:
                    annotation.temporary = True
                jobPuts.append(annotation)
        else:
            annotation = Annotation(parent=nodeindex.key())
            annotation.tree = nodeindex.parent().parent().key()
            annotation.category = "confidence"
            annotation.user = userName
            conf = u"%s" % cd
            conftype = node["type"] if "type" in node.keys() and node["type"] is not None else "unknown"
            conftype = u"%s" % conftype
            annotation.name = conftype
            annotation.value = conf
            annotation.triplet = "%s:%s:%s" % ("confidence",conftype.lower().strip(),conf.lower().strip())
            if temporary is not None:
                annotation.temporary = True
            jobPuts.append(annotation)
    if "color" in node.keys() and node["color"] is not None:
        annotation = Annotation(parent=nodeindex.key())
        annotation.tree = nodeindex.parent().parent().key()
        annotation.category = "branchcolor"
        annotation.user = userName
        annotation.name = "unknown"
        annotation.value = u"%s" % node["color"]
        annotation.triplet = "%s:%s:%s" % ("branchcolor","unknown",node["color"].lower().strip())
        if temporary is not None:
            annotation.temporary = True
        jobPuts.append(annotation)
    if "length" in node.keys() and node["length"] is not None:
        annotation = Annotation(parent=nodeindex.key())
        annotation.tree = nodeindex.parent().parent().key()
        annotation.category = "branchlength"
        annotation.user = userName
        annotation.name = "unknown"
        lvalue = u"%s" % node["length"]
        annotation.value = lvalue
        annotation.triplet = "%s:%s:%s" % ("branchlength","unknown",lvalue.lower().strip())
        if temporary is not None:
            annotation.temporary = True
        jobPuts.append(annotation)
    if "ncolor" in node.keys() and node["ncolor"] is not None:
        annotation = Annotation(parent=nodeindex.key())
        annotation.tree = nodeindex.parent().parent().key()
        annotation.category = "nodecolor"
        annotation.user = userName
        annotation.name = "unknown"
        annotation.value = u"%s" % node["ncolor"]
        annotation.triplet = "%s:%s:%s" % ("nodecolor","unknown",node["ncolor"].lower().strip())
        if temporary is not None:
            annotation.temporary = True
        jobPuts.append(annotation)
    for a in temporal_annotations:
        if a in node.keys() and node[a] is not None:
            annotation = Annotation(parent=nodeindex.key())
            annotation.tree = nodeindex.parent().parent().key()
            annotation.category = "time"
            annotation.user = userName
            annotation.name = a
            annotation.value = u"%s" % node[a]
            annotation.triplet = "%s:%s:%s" % ("time",a.lower().strip(),node[a].lower().strip())
            if temporary is not None:
                annotation.temporary = True
            jobPuts.append(annotation)
    for a in geographic_annotations:
        if a in node.keys() and node[a] is not None:
            annotation = Annotation(parent=nodeindex.key())
            annotation.tree = nodeindex.parent().parent().key()
            annotation.category = "geography"
            annotation.user = userName
            annotation.name = a
            annotation.value = node[a]
            annotation.triplet = "%s:%s:%s" % ("geography",a.lower().strip(),node[a].lower().strip())
            if temporary is not None:
                annotation.temporary = True
            jobPuts.append(annotation)
    if 'taxonomy' in node.keys() and node['taxonomy'] is not None:
        for a,b in node["taxonomy"].items():
            annotation = Annotation(parent=nodeindex.key())
            annotation.tree = nodeindex.parent().parent().key()
            annotation.category = "taxonomy"
            annotation.user = userName
            annotation.name = a
            annotation.value = b
            annotation.triplet = "%s:%s:%s" % ("taxonomy",a.lower().strip(),b.lower().strip())
            if temporary is not None:
                annotation.temporary = True
            jobPuts.append(annotation)
    if 'uri' in node.keys() and node['uri'] is not None:
        for a,b in node["uri"].items():
            annotation = Annotation(parent=nodeindex.key())
            annotation.tree = nodeindex.parent().parent().key()
            annotation.category = "uri"
            annotation.user = userName
            annotation.name = a
            annotation.value = b
            annotation.triplet = "%s:%s:%s" % ("uri",a.lower().strip(),b.lower().strip())
            if temporary is not None:
                annotation.temporary = True
            jobPuts.append(annotation)
    db.put(jobPuts)
    return 200


application = webapp.WSGIApplication([('/task/treeparse', TreeParse),
                                      ('/task/treesplit', TreeSplit),
                                      ('/task/nodeparse', NodeParse)],      
                                     debug=False)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
