from xml.dom import minidom
from math import sqrt
import random , StringIO, os
from treeobj import *
import xml.etree.cElementTree as ET

NS_PXML = '{http://www.phyloxml.org}'

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
        
        
class PhyloXMLtoTree():
    xmlobject = None
    topobject = None
    unid = 1
    objtree = None
    title = None
    rooted = None
    
    def __init__(self,treexml,color="FFFFFF"):
        
        #self.xmlobject = minidom.parseString(xmlstring).getElementsByTagName('phylogeny')[0].childNodes
        
        self.objtree = PhyloTree()
        self.root = None
        self.name = "Untitled Tree"
        self.title = "Untitled Tree" #replicated because JS client expects title, while we should be storing name
        self.description = ""
        self.topobject = treexml
        if cmp(self.topobject.get("rooted"),"true")==0:
            self.rooted = True
        for phylo in self.topobject:
            if cmp(phylo.tag,NS_PXML + 'name')==0:
                self.name = str(phylo.text)
                self.title = str(phylo.text)
            elif cmp(phylo.tag,NS_PXML + 'description')==0:
                self.description = str(phylo.text)
                
        self.xmlobject = self.topobject.findall(NS_PXML+'clade')
        self.color = color
        self.uri = {}
        
    def walk_tree(self,nodelist,parent_id,color=None):
        for node in nodelist:
            self.unid += 1
            #update parent with child id
            
            data = {}
            id = int(self.unid)
            data['id'] = id
            data['parent_id'] = parent_id
            data['color'] = color
            data['ncolor'] = color
            name_txt = None
            self.objtree.addvalues(data)
            
            taxonomy = {}
            events = {}
            
            for tmp in node:
                tag = str(tmp.tag)
                    #iterate over a nodes children to find any supported attributes

                if cmp(tag,NS_PXML + 'clade')==0:
                    pass
                elif cmp(tag,NS_PXML + 'node_id')==0:
                    data['code'] = str(tmp.text)
                    code = data['code']

                elif cmp(tag,NS_PXML + 'name_txt')==0:
                    data['name'] = str(tmp.text)
                    name_txt = data['name']

                elif cmp(tag,NS_PXML + 'uri')==0:
                    if 'uri' not in data:
                        data['uri'] = {}
                    try:
                        if cmp(tmp.get("type"),"icon")==0:
                            data['uri']['icon'] = tmp.text
                        elif cmp(tmp.get("type"),"audio")==0:
                            data['uri']['audio'] = tmp.text
                        elif cmp(tmp.get("type"),"link")==0:
                            data['uri']['link'] = tmp.text
                        elif cmp(tmp.get("type"),"video")==0:
                            data['uri']['video'] = tmp.text
                        elif cmp(tmp.get("type"),"kml")==0:
                            data['uri']['kml'] = str(tmp.text).replace("%26","&")
                        elif cmp(tmp.get("type"),"col-lsid")==0:
                            data['uri']['col-lsid'] = tmp.text
                        elif cmp(tmp.get("type"),"link")==0:
                            data['uri']['link'] = tmp.text
                    except:
                        pass

                elif cmp(tag,NS_PXML + 'taxonomy')==0:
                    for name in tmp:
                        taxonomy[str(name.tag).replace(NS_PXML,'')] = str(name.text)
                    data['taxonomy']=taxonomy
                                    
                
                elif cmp(tag,NS_PXML + 'events')==0:
                    for event in tmp:
                        events[str(event.tag).replace(NS_PXML,'')] = str(event.text)
                    data['events']=events

                elif cmp(tag,NS_PXML + 'date')==0:
                    for date in tmp:
                        if cmp(str(date.tag).lower(),'value')==0:
                            data['date'] = date.text
                        elif cmp(str(date.tag).lower(),'minimum')==0:
                            data['date_min'] = date.text
                        elif cmp(str(date.tag).lower(),'maximum')==0:
                            data['date_max'] = date.text
                            

                elif cmp(tag,NS_PXML + 'confidence')==0:
                    if 'conf' not in data:
                        data['conf'] = []
                    cur = {}
                    cur['conf'] = str(tmp.text)
                    try:
                        cur['conf_type'] = str(tmp.get("type")).replace(NS_PXML,'')
                    except:
                        cur['conf_type'] = None
                    data['conf'].append(cur)
                    
                elif cmp(tag,NS_PXML + 'branchcolor')==0:
                    data['color'] = tmp.text
                    data['ncolor'] = tmp.text
                    
                elif cmp(tag,NS_PXML + 'branch_length')==0:
                    try:
                        data['length'] = float(tmp.text)
                    except:
                        data['length'] = tmp.text
                        
                elif cmp(tag,NS_PXML + 'width')==0:
                    data['branch_width'] = tmp.text
                                
                                
                elif cmp(tag,NS_PXML + 'distribution')==0:
                    points = []
                    polygons = []
                    for geom in tmp:
                        name = str(geom.tag).lower()
                        #print name
                        if cmp(name,NS_PXML+'point')==0: #assemble point data
                            point = {}
                            ct = 0
                            for pt in geom:
                                if cmp(str(pt.tag),NS_PXML+'lat')==0:
                                    ct+=1
                                    point['lat'] = float(pt.text)
                                if cmp(str(pt.tag),NS_PXML+'lon')==0:
                                    ct+=1
                                    point['lon'] = float(pt.text)
                                if cmp(str(pt.tag),NS_PXML+'alt')==0:
                                    point['alt'] = float(pt.text)
                            if ct==2:
                                points.append(point)
                        if cmp(name,NS_PXML+'polygon')==0: #assemble polygon data
                            polygon = ''
                            pts = []
                            for ele in geom:
                                ct = 0
                                if cmp(str(ele.tag).lower(),NS_PXML+'point')==0: #assemble point data
                                    
                                    point = {}
                                    for pt in ele:
                                        if cmp(str(pt.tag),NS_PXML+'lat')==0:
                                            ct+=1
                                            point['lat'] = float(pt.text)
                                        if cmp(str(pt.tag),NS_PXML+'lon')==0:
                                            ct+=1
                                            point['lon'] = float(pt.text)
                                        if cmp(str(pt.tag),NS_PXML+'alt')==0:
                                            point['alt'] = float(pt.text)
                                if ct==2:
                                    pts.append(point)
                                
                            if 2<len(pts): #make sure that it is really a polygon
                                
                                if pts[0] != pts[-1]: #ensure that the polygon closes itself
                                    pts.append(pts[0])
                                for pt in pts:
                                    polygon += "%s,%s,0 " % (pt['lon'],pt['lat'])
                            if polygon != '':
                                polygons.append(polygon)
                                    
                    if 0<len(polygons):
                        data['polygons'] = polygons
                    
                    if 0<len(points):
                        
                        data['points'] = points

                
                
            #add child id to parent object
            #cur_id = data['id']
            self.objtree.addchild(parent_id,id)
            
            id = int(data['id'])
            if data['parent_id'] is not None:
                parent_id = int(data['parent_id'])
            else:
                self.root = id
                parent_id = None
            self.objtree.addvalues(data)
            
            if node.find(NS_PXML + 'clade'):
                self.walk_tree(node.findall(NS_PXML + 'clade'),id,color=data['color'])
                for child in node.findall(NS_PXML + 'clade'):
                    node.remove(child)
    
    def load(self):
        self.walk_tree(self.xmlobject,None,color=self.color)

            
