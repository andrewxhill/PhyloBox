from google.appengine.ext import db
from google.appengine.api import users
import os

class UserProfile(db.Model):
  user = db.UserProperty  ()
  
    
    
class Collection(db.Model):
  trees = db.ListProperty(db.Key)
  temporary = db.BooleanProperty(default=False)
  
class Tree(db.Model):  #stores JSON encoded elements of the tree, not for searching
  #key = tree/unique_key
  data = db.BlobProperty()
  environment = db.TextProperty()
  png = db.BlobProperty()
  author = db.StringProperty()      
  title = db.StringProperty()      
  version = db.StringProperty(default=str(os.environ['CURRENT_VERSION_ID'].split('.')[0]))   
  description = db.TextProperty()               
  addtime = db.DateTimeProperty(auto_now_add=True)   
  users = db.ListProperty(db.Key)     #google username author of the tree
  
class TreeIndex(db.Model): #searchable indexes of the trees
  #key = Tree.key(), something
  title = db.StringProperty()                   #tree title
  author = db.StringProperty()   
  users = db.ListProperty(db.Key)     #google username author of the tree
  scientificName = db.StringProperty()          #scientific name
  scientificNameId = db.StringProperty()        #scientific name id
  scientificNameAuthority = db.StringProperty() #scientific name authority
  root = db.StringProperty()                    #rootnode id of the given tree
  addtime = db.DateTimeProperty(auto_now_add=True)
  temporary = db.BooleanProperty(default=False)
  
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
  addtime = db.DateTimeProperty(auto_now_add=True)
  temporary = db.BooleanProperty(default=False)
  
class Annotation(db.Model):
  #parent = Node.key(), something
  tree = db.ReferenceProperty(Tree)
  branch = db.BooleanProperty(default=False)     #if False, annotation is assumed to be at node
  description = db.TextProperty()
  category = db.CategoryProperty()  #geography, uri, time, taxonomy
  name = db.StringProperty()        #a link/doi
  value = db.StringProperty()         #annotation value
  full = db.StringProperty()         #if something longer than 500 bytes, it isn't searchable by its full value
  triplet = db.StringProperty() #full searchable field
  latest = db.BooleanProperty(default=True) 
  user = db.UserProperty()
  addtime = db.DateTimeProperty(auto_now_add=True)
  temporary = db.BooleanProperty(default=False)
  
  
"""I'm proposing this method for enabling connections
   between two or more nodes. What do you think? They are almost a
   super specialized Annotation, but they need something slightly 
   different"""
class NodeConnection(db.Model):
  #No Parent
  trees = db.ListProperty(db.Key) #list of trees that contain the nodes
  nodes = db.ListProperty(db.Key) #list of nodes that are connected by this connection
  connections = db.TextProperty() #json object representing each connection
  description = db.TextProperty()
  category = db.CategoryProperty()     #if False, annotation is assumed to be at node
  name = db.StringProperty()  #geography, uri, time, taxonomy
  value = db.StringProperty()  #anything that matches what should be expected for the category
  user = db.UserProperty()
  addtime = db.DateTimeProperty(auto_now_add=True)
  temporary = db.BooleanProperty(default=False)
  
  
  
