from google.appengine.ext import db

class Tree(db.Model):  #stores JSON encoded elements of the tree, not for searching
  #key = tree/unique_key
  data = db.BlobProperty()
  png = db.BlobProperty()

class TreeIndex(db.Model): #searchable indexes of the trees
  #key = Tree.key(), something
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
  #key = Tree.key(), something
  visibility = db.BooleanProperty()     #tells the viewer what to draw
  data = db.TextProperty()              #JSON encoded node
  children = db.ListProperty(db.Key)  #reference to all children

class NodeIndex(db.Model):
  #key = Node.key(), something
  tree = db.ReferenceProperty(Tree)
  id = db.IntegerProperty()
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
  #parent = Node.key(), something
  node = db.ReferenceProperty(Node)
  branch = db.BooleanProperty()     #if False, annotation is assumed to be at node
  description = db.TextProperty()
  catagory = db.CategoryProperty()         #uri/taxonomy/note
  type = db.StringProperty()        #a link/doi
  value = db.TextProperty()         #annotation value
  
  
  
  
