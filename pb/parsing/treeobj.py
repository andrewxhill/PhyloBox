from xml.dom import minidom
from math import sqrt
import random 
import os
import logging
import simplejson
from google.appengine.ext import db
from google.appengine.api.labs import taskqueue
import time
from pb.DB import *

class PhyloTree():
    tree = None
    unclosed_parents = []
    ignored_elements = {}
    unused_code = 9876543210
    
    def __init__(self,k):
        self.tree = {}
        self.frame = {}
        self.k = k
    
    
    def storenode(self, node):
        nodekey = db.Key.from_path('Tree', self.k, 'Node', str(node["id"]))
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
                children.append(db.Key.from_path('Tree', self.k, 'Node', str(child["id"])))
        newnode.children = children
        newnode.data = simplejson.dumps(node)  
        
        db.put(newnode)
    
        newTask = {'params': {'key': self.k,'id':node["id"]}}
        """
        if userKey is not None:
            newTask['userKey'] = userKey
        """
        newTask['name'] = "%s-%s-%s" % (int(time.time()/10),self.k.replace('-',''),node["id"])
        """
        if temporary is not None:
            newTask['params']['temporary'] = True
        """
        taskqueue.add(
            queue_name='tree-processing-queue',
            url='/task/nodeparse', 
            params=newTask['params'],
            name=newTask['name'])
            
            
    def elementbyid(self,id):
        if id in self.tree:
            return self.tree[id]
        else:
            gt = GenericTreeElement()
            gt.id=id
            return gt
            
    def setelement(self,element):
        id = int(element.id)
        self.tree[id] = element
        
    def addvalues(self,values, dbstore=False):
        #values = dictionary of attributes to add to the tree
        set_code = False
        try:
            id = int(values['id'])
            set_code = True
        except:
            id = self.unused_code
            self.unused_code+=1
        
        element = self.elementbyid(id)
        for a, b in values.iteritems():
            try:
                element.__dict__[a] = b
            except:
                self.ignored_elements[a] = 1
        
        if dbstore:
            #self.storenode(element.json())
            pass
        
        self.setelement(element)
        
    def addchild(self,id,child_int_id):
        if id is not None:
            element = self.elementbyid(int(id))
            tmp = {}
            tmp['id'] = child_int_id
            if element.children is None:
                element.children = []
            element.children.append(tmp)
            self.setelement(element)
        
    def addchild_coords(self,id,coords):
        element = self.elementbyid(int(id))
        element.children_coords.append(coords)
        self.setelement(element)
        
        
class GenericTreeElement():
    
    def __init__(self):
        self.type = None #valid types are 0 or 'node' and 1 or 'leaf'
        self.name = None
        
        self.code = None #must always be None or unique
        self.id = None #must always be None or unique
        
        self.uri = None
        self.taxonomy = None
        
        self.parent_id = None
        
        self.children = None #list of child node_id
        
        self.points = None #each point is a dictionary of {lat: Numeric, lon: Numeric, alt: Numeric}
        self.centroid = None #this is the values used to generate the kml branch {lat: Numeric, lon: Numeric, alt: Numeric} 
        
        self.polygons = None
        
        self.date = None
        self.date_min = None
        self.date_max = None
        
        self.length = None
        self.events = None
        self.color = None
        self.ncolor = None
        self.conf = None
        self.visibility = True
        
    
    def json(self):
        return self.__dict__        
    
