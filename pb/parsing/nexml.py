from xml.dom import minidom
from math import sqrt
import random , StringIO, os
from treeobj import *
import xml.etree.cElementTree as ET

NS_NXML = ''
        
class NeXMLtoTree():
    xmlobject = None
    topobject = None
    unid = 1
    objtree = None
    title = None
    rooted = None
    
    def __init__(self,treexml,color="FFFFFF",k='k'):
        print color
        #self.xmlobject = minidom.parseString(xmlstring).getElementsByTagName('phylogeny')[0].childNodes
        
        self.objtree = PhyloTree(k)
        
        NS_NXML = "{%s}" % str(treexml).split('{')[1].split('}')[0]
        
        self.root = None
        self.name = "Untitled Tree"
        self.title = "Untitled Tree" #replicated because JS client expects title, while we should be storing name
        self.description = None
        self.topobject = treexml
        self.idMap = {}
        """
        if cmp(self.topobject.get("rooted"),"true")==0:
            self.rooted = True
        for phylo in self.topobject:
            if cmp(phylo.tag,NS_PXML + 'name')==0:
                self.name = str(phylo.text)
                self.title = str(phylo.text)
            elif cmp(phylo.tag,NS_PXML + 'description')==0:
                self.description = str(phylo.text)
        """
        self.xmlnodes = self.topobject.findall(NS_NXML+'node')
        print len(self.xmlnodes)
        self.xmledges = self.topobject.findall(NS_NXML+'edge')
        self.color = color
        self.uri = {}
        
    def walk_nodes(self,nodelist,color):
        for node in nodelist:
            self.unid += 1
            #update parent with child id
            data = {}
            id = int(self.unid)
            data['id'] = id
            data['parent_id'] = None
            data['color'] = color
            data['ncolor'] = color
            name_txt = None
            self.objtree.addvalues(data)
            
            taxonomy = {}
            events = {}
            
            tmp = node.get(NS_NXML + 'id')
            if tmp:
                data['nexmlId']=tmp
                self.idMap[tmp] = id
            tmp = node.get(NS_NXML + 'label')
            if tmp:
                data['name']=tmp
            
            if node.get(NS_NXML + 'root') is not None:
                self.root = id
                self.rooted = True
                
            self.objtree.addvalues(data)
                
    def walk_edges(self,edgelist,color):
        for edge in edgelist:
                    
            source = edge.get(NS_NXML + 'source')
            target = edge.get(NS_NXML + 'target')
            
            #add child id to parent object
            id = self.idMap[target]
            parent_id = self.idMap[source]
            
            self.objtree.addchild(parent_id,id)
            self.objtree.tree[id].parent_id = parent_id
            
            
    def load(self):
        self.walk_nodes(self.xmlnodes,color=self.color)
        self.walk_edges(self.xmledges,color=self.color)

            
