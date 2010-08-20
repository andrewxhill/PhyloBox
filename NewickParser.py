import cgi
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.api import memcache, urlfetch

import os, sys, string, Cookie, sha, time, random, cgi, urllib,urllib2
import datetime, StringIO, pickle, base64
import uuid, zipfile
import xml.etree.cElementTree as ET

import wsgiref.handlers
from google.appengine.ext.webapp import template
from django.utils import feedgenerator, simplejson
from django.template import Context, Template
import logging

def ParseNewick(treein):
    if treein[-1]==";":
        treein= treein[0:-1]
    #treeout = ET.Element("phyloxml")
    treeout = ET.Element("phyloxml")
    
    treeout.attrib['xmlns:xsi']="http://www.w3.org/2001/XMLSchema-instance" 
    treeout.attrib['xsi:schemaLocation']="http://www.phyloxml.org http://www.phyloxml.org/1.10/phyloxml.xsd" 
    treeout.attrib['xmlns']="http://www.phyloxml.org"
    #<phylogeny rooted="true">
    tree = []
    tree.append(ET.SubElement(treeout, "phylogeny"))
    tree[0].attrib['rooted'] = 'unknown'
    treein = treein.replace('(','?&(')
    treein = treein.split('(')
    out = ""
    for clade in treein:
        #parseclade(clade)
        if clade=="?&":
            tree.append(ET.SubElement(tree[-1], "clade"))
        else:
            clade = clade.split(',')
            close = 0
            for br in clade:
                if br != "":
                    br = br.replace(")",")@")
                    br = br.split(")")
                    for node in br:
                        node = node.split(":")
                        name = node[0]
                        bl = False
                        if 1<len(node):
                            bl = node[1]
                            bl = bl.replace('"','')
                            bl = bl.strip()
                        if name == "?&":
                            tree.append(ET.SubElement(tree[-1], "clade"))
                        elif name[0] == "@":
                            name = name.strip('@')
                            name = name.strip()
                            if bl is not False:
                                elem = ET.Element("branch_length")
                                elem.text = bl
                                tree[-1].append(elem)
                            if name != '':
                                elem = ET.Element("name")
                                elem.text = name
                                tree[-1].append(elem)
                            trash = tree.pop()
                        else: 
                            tree.append(ET.SubElement(tree[-1], "clade"))
                            if bl is not False:
                                elem = ET.Element("branch_length")
                                elem.text = bl
                                tree[-1].append(elem)
                            if name != '':
                                elem = ET.Element("name")
                                elem.text = name
                                tree[-1].append(elem)
                            trash = tree.pop()
    return ET.tostring(treeout)
        
