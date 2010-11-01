from xml.dom import minidom
from math import sqrt
import random 
import os

   
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
    
