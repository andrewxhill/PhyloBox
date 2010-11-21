from google.appengine.ext import db

class Tree(db.Model):  #stores JSON encoded elements of the tree, not for searching
  #key = tree/unique_key
  data = db.BlobProperty()
  environment = db.TextProperty()
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
  addtime = db.DateTimeProperty(auto_now_add=True)
  
  
class Node(db.Model):
  #key = Tree.key(), something
  visibility = db.BooleanProperty()     #tells the viewer what to draw
  data = db.TextProperty()              #JSON encoded node
  children = db.ListProperty(db.Key)  #reference to all children

class NodeIndex(db.Model):
  #key = Node.key(), something
  tree = db.ReferenceProperty(TreeIndex)
  id = db.IntegerProperty()
  name = db.StringProperty()
  nodeColor = db.StringProperty()
  branchColor = db.StringProperty()
  branchLength = db.FloatProperty()
  branchConfidence = db.FloatProperty()
  confidenceType = db.StringProperty()
  addtime = db.DateTimeProperty(auto_now_add=True)
  
class Annotation(db.Model):
  #parent = Node.key(), something
  node = db.ReferenceProperty(NodeIndex)
  branch = db.BooleanProperty(default=False)     #if False, annotation is assumed to be at node
  description = db.TextProperty()
  catagory = db.CategoryProperty()  #geography, uri, time, taxonomy
  name = db.StringProperty()        #a link/doi
  value = db.TextProperty()         #annotation value
  user = db.UserProperty()
  addtime = db.DateTimeProperty(auto_now_add=True)
  
  
  
