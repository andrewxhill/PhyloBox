from xml.dom import minidom
from math import sqrt
import random 
import os

class PhyloTree():
    tree = None
    unclosed_parents = []
    ignored_elements = {}
    unused_code = 9876543210
    
    def __init__(self):
        self.tree = {}
        self.frame = {}
        
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
        
    def addvalues(self,values):
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
    
