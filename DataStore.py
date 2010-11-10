from google.appengine.ext import db

#stores Zipped JSON tree objects
#Created on 'Save' of the tree, until then, the tree is stored in a temp table
class treeStore(db.Model): #keyname treekeyh
  objId = db.StringProperty() #The unique key for the object, perm9c63a1c1-9d89-4562-97cf-b1a479e56460
  objBlob = db.BlobProperty() #A zipped string of the PhyloJSON object
  objPng = db.BlobProperty(default=None)
  userName = db.UserProperty() #the userName is provided by Google and is the Google signin name
  userNameShort = db.StringProperty() #a nickname provided by Google
  forkedObj = db.StringProperty(default=None) #objId of the tree from which this was forked
  originalAuthor = db.UserProperty() #The userName of the author who FIRST created the tree
  treeTitle = db.StringProperty(default="PhyloBox Tree") #the title of the tree
  last_access_date = db.DateTimeProperty(auto_now_add=True)
  last_update_date = db.DateTimeProperty(auto_now_add=True)
  creation_date = db.DateTimeProperty(auto_now_add=True)
  downloadCt = db.IntegerProperty(default=1) #Track how popular the tree is
  hasWidget = db.BooleanProperty(default=False) #Track how popular the tree is
  canFork = db.BooleanProperty(default=True) #Track how popular the tree is
  inTrash = db.BooleanProperty(default=False) #Track how popular the tree is
  version = db.StringProperty(default="1-0") #The version of our app that made this tree

class treeGroup(db.Model): #keyname groupkey
  groupId = db.StringProperty() #name of group
  groupTitle = db.StringProperty() #name of group
  groupDescription = db.StringProperty() #name of group
  groupIDs = db.StringListProperty() #name of group
  
class treeOwners(db.Model):
  objId = db.StringProperty() #The unique key for the object, perm9c63a1c1-9d89-4562-97cf-b1a479e56460
  userName = db.UserProperty() #the userName is provided by Google and is the Google signin name
  notes = db.StringProperty(default=None) #the userName is provided by Google and is the Google signin name
    
  
  
