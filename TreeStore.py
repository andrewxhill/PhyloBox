from google.appengine.ext import db

class Tree(db.Model):  #stores JSON encoded elements of the tree, not for searching
  #key = tree/unique_key
  data = db.BlobProperty()
  png = db.BlobProperty()

class TreeIndex(db.Model): #searchable indexes of the trees
  #key = treeindex/unique_key
  #parent key = trees object
  title = db.StringProperty()                   #tree title
  description = db.TextProperty()               #tree description
  scientificName = db.StringProperty()          #scientific name
  scientificNameId = db.StringProperty()        #scientific name id
  scientificNameAuthority = db.StringProperty() #scientific name authority
  author = db.StringProperty()                  #author of the tree
  users = db.StringListProperty()     #google username author of the tree
  root = db.StringProperty()                    #rootnode id of the given tree
  version = db.StringProperty()
  date = db.StringProperty()
  nodes = db.ListProperty(db.Key)              #list of all children in Nodes table
  
  
class Node(db.Model):
  #key = treeId, 
  #parent = Node.key() of parent
  visibility = db.BooleanProperty()     #tells the viewer what to draw
  data = db.TextProperty()              #JSON encoded node
  children = db.ListProperty(db.Key)  #reference to all children

class NodeIndex(db.Model):
  #key = Node.key()
  id = db.StringProperty()
  name = db.StringProperty()
  nodeColor = db.StringProperty()
  branchColor = db.StringProperty()
  branchLength = db.FloatProperty()
  branchConfidence = db.FloatProperty()
  confidenceType = db.StringProperty()
  date = db.DateProperty()
  dateMax = db.DateProperty()
  dateMin = db.DateProperty()
  latitude = db.FloatProperty()
  longitude = db.FloatProperty()
  uncertainty = db.FloatProperty()
  altitude = db.FloatProperty()
  polygon = db.TextProperty()
  taxonomyString = db.TextProperty()
  uris = db.StringListProperty()
  uriString = db.TextProperty()
  scientificName = db.StringProperty()          #scientific name
  scientificNameId = db.StringProperty()        #scientific name id
  scientificNameAuthority = db.StringProperty() #scientific name authority
  
class Annotations(db.Model):
  #parent = Node.key() of parent
  branch = db.BooleanProperty()     #if False, annotation is assumed to be at node
  description = db.TextProperty()
  type = db.StringProperty()        #a loose vocabulary for annotation types
  value = db.TextProperty()         #annotation value
  
  
  
  
