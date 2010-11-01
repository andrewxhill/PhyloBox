/*--------------------------------------------------------------------------.
|  Software: PhyloBox MAIN                                                  |
|   Version: 1.0                                                            |
|   Contact: andrewxhill@gmail.com || sander@digijoi.com                    |
| ------------------------------------------------------------------------- |
|     Admin: Andrew Hill (project admininistrator)                          |
|   Authors: Sander Pick, Andrew Hill                                    	|                     
| ------------------------------------------------------------------------- |
|   License: Distributed under the General Public License (GPL)             |
|            http://www.gnu.org/licenses/licenses.html#GPL                  |
| This program is distributed in the hope that it will be useful - WITHOUT  |
| ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or     |
| FITNESS FOR A PARTICULAR PURPOSE.                                         |
'--------------------------------------------------------------------------*/
var PhyloBox = {};
// constants
PhyloBox.API = "/lookup";
/*###########################################################################
###################################################################### SYSTEM
###########################################################################*/
PhyloBox.System = {
	init:function() {
		this.browser = this.searchString(this.dataBrowser()) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS()) || "an unknown OS";
	},
	searchString:function(data) {
		for(var i=0;i<data.length;i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if(dataString) if(dataString.indexOf(data[i].subString) != -1) return data[i].identity;
			else if(dataProp) return data[i].identity;
		}
	},
	searchVersion:function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if(index==-1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser:function() {
		return [
			{ string:navigator.userAgent, subString:"Chrome", identity:"Chrome" },
			{ string:navigator.userAgent, subString:"OmniWeb", versionSearch:"OmniWeb/", identity:"OmniWeb" },
			{ string:navigator.vendor, subString:"Apple", identity:"Safari", versionSearch:"Version" },
			{ string:navigator.userAgent, subString:"Opera", identity:"Opera" },
			{ string:navigator.vendor, subString:"iCab", identity:"iCab" },
			{ string:navigator.vendor, subString:"KDE", identity:"Konqueror" },
			{ string:navigator.userAgent, subString:"Firefox", identity:"Firefox" },
			{ string:navigator.vendor, subString:"Camino", identity:"Camino" },
			{ string:navigator.userAgent, subString:"Netscape", identity:"Netscape" },
			{ string:navigator.userAgent, subString:"MSIE", identity:"Explorer", versionSearch:"MSIE" },
			{ string:navigator.userAgent, subString:"Gecko", identity:"Mozilla", versionSearch:"rv" },
			{ string:navigator.userAgent, subString:"Mozilla", identity:"Netscape", versionSearch:"Mozilla" }
		];
	},
	dataOS:function() {
		return [
			{ string:navigator.platform, subString:"Win", identity:"Windows" },
			{ string:navigator.platform, subString:"Mac", identity:"Mac" },
			{ string:navigator.userAgent, subString:"iPhone", identity:"iPhone/iPod" },
			{ string:navigator.platform, subString:"Linux", identity:"Linux" }
		];
	}
};
/*###########################################################################
################################################################### INTERFACE
###########################################################################*/
PhyloBox.Interface = {
	// private vars
	_activeTree:null,
	// constructor
	init:function() {
		// save reference
		var __this = this;
		// define console to avoid errors when console isn't available
		if(!window.console) window.console = { log:function(){} };
		// set window and resizes
		$(window).resize(function() {
			// trigger handlers for all views
			$(document).trigger("viewresize");
			// fit heights
			__this._fit(); 
		}); __this._fit();
		// resize panels
		$(".handle > div > img").bind("mousedown",function(e) {
			// prevent image drag behavior
			if(e.preventDefault) e.preventDefault();
			// save reference
			var pan = this.parentNode.parentNode.parentNode;
			var handle = this.parentNode.parentNode;
			var pan_w_orig = $(pan).width();
			var mouse_orig = __this._mouse(e);
			// detect parent panel
			if($(pan).hasClass("panel-center")) {
				// get main for margins
				var main = this.parentNode.parentNode.parentNode.parentNode;
				if($(handle).hasClass("handle-left")) {
					// get margin and sibling
					var main_m_orig = parseInt($(main).css("margin-left"));
					var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.previousElementSibling.lastElementChild.previousElementSibling;
					var sib_w_orig = $(sib).width();
					// bind mouse move
					$(document).bind("mousemove",function(e) {
						// get mouse position
						var mouse = __this._mouse(e);
						// determine new values
						var pw = pan_w_orig - (mouse.x - mouse_orig.x);
						var mm = main_m_orig + (mouse.x - mouse_orig.x);
						var sw = sib_w_orig + (mouse.x - mouse_orig.x);
						// check max width
						if(pw < 700 || sw < 50) return false;
						// set widths
						$(pan).width(pw);
						$(main).css("margin-left",mm);
						$(sib).width(sw);
						// trigger handlers for all views
						$(this).trigger("viewresize");
					});
				} else {
					// get margin and sibling
					var main_m_orig = parseInt($(main).css("margin-right"));
					var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.lastElementChild;
					var sib_w_orig = $(sib).width();
					// bind mouse move
					$(document).bind("mousemove",function(e) {
						// get mouse position
						var mouse = __this._mouse(e);
						// determine new values
						var pw = pan_w_orig + (mouse.x - mouse_orig.x);
						var mm = main_m_orig - (mouse.x - mouse_orig.x);
						var sw = sib_w_orig - (mouse.x - mouse_orig.x);
						// check max width
						if(pw < 700 || sw < 50) return false;
						// set widths
						$(pan).width(pw);
						$(main).css("margin-right",mm);
						$(sib).width(sw);
						// trigger handlers for all views
						$(this).trigger("viewresize");
					});
				}
			} else { // panel-left
				// get sibling
				var sib = this.parentNode.parentNode.parentNode.previousElementSibling;
				var sib_w_orig = $(sib).width();
				// bind mouse move
				$(document).bind("mousemove",function(e) {
					// get mouse position
					var mouse = __this._mouse(e);
					// determine new values
					var pw = pan_w_orig - (mouse.x - mouse_orig.x);
					var sw = sib_w_orig + (mouse.x - mouse_orig.x);
					// check max width
					if(pw < 50 || sw < 50) return false;
					// set widths
					$(pan).width(pw);
					$(sib).width(sw);
				});
			}
			// bind mouse up
			$(document).bind("mouseup",function() {
				// remove all
				$(this).unbind("mousemove").unbind("mouseup");
			});
		});
		// editable cells
		$(".editable").live("click",function() {
			// save ref
			var __this = this;
			// return if already editing
			if($(this).hasClass("editing")) return false;
			$(this).addClass("editing");
			// show input
			$(this).hide();
			$(this.nextElementSibling).show().focus();
			// exit
			var done = function() {
				$(document).unbind("click",done);
				$(__this.nextElementSibling).unbind("keyup",done);
				$(__this).removeClass("editing");
				$(__this).text($(__this.nextElementSibling).val());
				$(__this.nextElementSibling).hide();
				$(__this).show();
			}
			$(document).bind("click",done);
			$(this.nextElementSibling).bind("keyup","return",done);
		});
		// change background color
		$("#tree-prop-bg").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().color = $(this).val();
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		// change branch width
		$("#tree-prop-bw").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().width = $(this).val();
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		// change node radius width
		$("#tree-prop-nr").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().radius = $(this).val();
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		// change tree type
		$("#tree-prop-vm").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().viewmode = parseInt($(this).val());
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// change branch length option
		$("#tree-prop-bl").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().branchlenghts = !PhyloBox.Document.tree(__this._activeTree).environment().branchlenghts;
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// change 3d option
		$("#tree-prop-3d").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().threeD = !PhyloBox.Document.tree(__this._activeTree).environment().threeD;
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// leaf labels
		$("#tree-prop-ll").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().leaflabels = !PhyloBox.Document.tree(__this._activeTree).environment().leaflabels;
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// htu labels
		$("#tree-prop-hl").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().htulabels = !PhyloBox.Document.tree(__this._activeTree).environment().htulabels;
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// branch labels
		$("#tree-prop-bl").live("change",function() {
			PhyloBox.Document.tree(__this._activeTree).environment().branchlabels = !PhyloBox.Document.tree(__this._activeTree).environment().branchlabels;
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
		// hover node in list
		$(".taxa-link").live("mouseenter",function() {
			// get node
			var node = $(this).data("node");
			// set hover
			node.hover(true);
			// refresh view
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		$(".taxa-link").live("mouseleave",function() {
			// get node
			var node = $(this).data("node");
			// set hover
			node.hover(false);
			// refresh view
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		// click node in list
		$(".taxa-link").live("click",function() {
			// get node
			var node = $(this).data("node");
			// reset selected
			for(var n in PhyloBox.Document.tree(__this._activeTree).node_list())
				PhyloBox.Document.tree(__this._activeTree).node_list()[n].selected(false);
			// set selected
			node.selected(true);
			// refresh view
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
			// reset taxa link style
			$(".taxa-link").each(function(i) {
				var nc = $(this).data("node").color();
				$(this).css("color","#"+nc);
			});
			// add style
			$(this).css("color","black");
			// set node title
			$(".panel-head",$("#node")).text("Node - "+$(this).text().substring(3));
			// parse node properties
			__this.setNode(node);
		});
		// change clade color
		$("#node-prop-cl").live("change",function() {
			// get node
			var node = $("#node").data("node");
			// set color
			node.color($(this).val());
			// walk kids
			(function(n) {
				for(var c in n.children()) {
					n.children()[c].color(node.color());
	            	arguments.callee(n.children()[c]);
	        	}
			})(node);
			// refresh view
			if(PhyloBox.Document.tree(__this._activeTree).view.single()) 
				PhyloBox.Document.tree(__this._activeTree).view.refresh();
		});
		// clade toggle
		$("#node-prop-vb").live("change",function() {
			// get node
			var node = $("#node").data("node");
			// toggle
			node.visibility(!node.visibility());
			// walk kids
			(function(n) {
				for(var c in n.children()) {
					n.children()[c].visibility(node.visibility());
	            	arguments.callee(n.children()[c]);
	        	}
			})(node);
			// refresh view
			PhyloBox.Document.tree(__this._activeTree).view.plot();
		});
	},
	// private methods
	_fit:function() {
		// size panels to fit window height
		$(".panel").each(function(i) {
			var h = $(window).height() - 75;
			$(this).height(h);
		});
		$("section").each(function(i) {
			var h = this.parentNode.id!="trees" ? $(window).height() - 110 : $(window).height() - 100;
			$(this).height(h);
		});
		$(".handle > div").each(function(i) {
			var h = $(window).height() - 100;
			$(this).height(h);
		});
		$(".handle > div > img").each(function(i) {
			var t = ($(window).height() - 124) / 2;
			$(this).css("top",t);
		});
	},
	_mouse:function(e) {
		// get true mouse position
		var posx = 0;
		var posy = 0;
		if(!e) var e = window.event;
		if(e.pageX || e.pageY) {
			posx = e.pageX;
			posy = e.pageY;
		} else if(e.clientX || e.clientY) {
			posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		return { x:posx, y:posy };
	},
	_error:function(e) { console.log("Interface: "+e); },
	// public methods
	setTaxa:function() {
		// use active tree
		var nodes = PhyloBox.Document.tree(this._activeTree).node_list();
		// create taxa list
		var taxa = $("#taxa > section > ul");
		// walk nodes
		for(var n in nodes) {
			var node = nodes[n];
			// get name
			var name = "";
			if(node.name()) name += node.name();
			if(node.taxonomy())
				for(var i in node.taxonomy()) {
					if(name!="") name += " | ";
					name += node.taxonomy()[i];
				}
			if(node.n_children() > 0) name = "(HTU) "+name;
			name = "&mdash;&nbsp;&nbsp;"+node.id()+":&nbsp;"+name;
			// add to doc
			taxa.append("<li><a href='javascript:;' id='nl-"+node.id()+"' class='plain taxa-link' style='color:#"+node.color()+";'>"+name+"</a></li>");
			// add node as data
			$("#nl-"+node.id()).data("node",node);
		}
	},
	setNode:function(node) {
		// save data
		$("#node").data("node",node);
		// check parent
		var vis = node.parent() && node.parent().visibility() ? "" : "disabled='disabled'";
		// check kids
		var is_clade = node.n_children() > 0;
		// init html
		var clade, uri;
		// write clade table
		clade = "<table>";
		clade += 	"<caption>Clade Properties</caption>";
		clade += 	"<tbody>";
		clade +=		"<tr>";
		clade += 			"<td align='right'>color</td>";
		clade += 			"<td>";
		clade +=				"<span class='editable editable-prop'>"+node.color()+"</span>";
		clade +=				"<input type='text' class='editable-field editable-field-long' id='node-prop-cl' value='"+node.color()+"' />";
		clade +=			"</td>";
		clade +=		"</tr>";
		clade +=		"<tr>";
		clade += 			"<td align='right'>toggle</td>";
		clade += 			"<td>";
		clade +=				node.visibility() ? "<input type='checkbox' id='node-prop-vb' checked='checked' "+vis+" />" : "<input type='checkbox' id='node-prop-vb' "+vis+" />";
		clade +=			"</td>";
		clade +=		"</tr>";
		clade +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		clade += 	"</tbody>";
		clade += "</table>";
		// write uri table
		uri = "<table>";
		uri += 	"<caption>URI Links</caption>";
		uri += 	"<tbody>";
		uri +=		"<tr>";
		uri += 			"<td align='right'>images</td>";
		uri += 			"<td>";
		uri +=				"n / a";
		uri +=			"</td>";
		uri +=		"</tr>";
		uri +=		"<tr>";
		uri += 			"<td align='right'>videos</td>";
		uri += 			"<td>";
		uri +=				"n / a";
		uri +=			"</td>";
		uri +=		"</tr>";
		uri +=		"<tr>";
		uri += 			"<td align='right'>wiki</td>";
		uri += 			"<td>";
		uri +=				"n / a";
		uri +=			"</td>";
		uri +=		"</tr>";
		uri +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		uri += 	"</tbody>";
		uri += "</table>";
		// add to doc
		if(is_clade) $("#node > section").html(clade+uri); else $("#node > section").html(uri);
	},
	setTree:function() {
		// use active tree
		var tree = PhyloBox.Document.tree(this._activeTree);
		// title
		$(".panel-head",$("#trees")).text("Tree - "+tree.title());
	},
	setProperties:function() {
		// use active tree
		var tree = PhyloBox.Document.tree(this._activeTree);
		// init html
		var name, visual, viewing, labels;
		// write name table
		name = "<table>";
		name += 	"<caption>Tree Name</caption>";
		name += 	"<tbody>";
		name +=			"<tr>";
		name += 			"<td>";
		name +=					"<span class='editable'>"+tree.title()+"</span>";
		name +=					"<input type='text' class='editable-field' style='width:170px' id='tree-prop-name' value='"+tree.title()+"' />";
		name +=				"</td>";
		name +=				"<td>&nbsp;</td>";
		name +=			"</tr>";
		name +=			"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		name += 	"</tbody>";
		name += "</table>";
		// write visual table
		visual = "<table>";
		visual += 	"<caption>Visual Properties</caption>";
		visual += 	"<tbody>";
		visual +=		"<tr>";
		visual += 			"<td align='right'>background color</td>";
		visual += 			"<td>";
		visual +=				"<span class='editable editable-prop'>"+tree.environment().color+"</span>";
		visual +=				"<input type='text' class='editable-field editable-field-long' id='tree-prop-bg' value='"+tree.environment().color+"' />";
		visual +=			"</td>";
		visual +=		"</tr>";
		visual +=		"<tr>";
		visual += 			"<td align='right'>branch width</td>";
		visual += 			"<td>";
		visual +=				"<span class='editable editable-prop'>"+tree.environment().width+"</span>";
		visual +=				"<input type='text' class='editable-field editable-field-short' id='tree-prop-bw' value='"+tree.environment().width+"' />";
		visual +=			"</td>";
		visual +=		"</tr>";
		visual +=		"<tr>";
		visual += 			"<td align='right'>node radius</td>";
		visual += 			"<td>";
		visual +=				"<span class='editable editable-prop'>"+tree.environment().radius+"</span>";
		visual +=				"<input type='text' class='editable-field editable-field-short' id='tree-prop-nr' value='"+tree.environment().radius+"' />";
		visual +=			"</td>";
		visual +=		"</tr>";
		visual +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		visual += 	"</tbody>";
		visual += "</table>";
		// write viewing table
		viewing = "<table>";
		viewing += 	"<caption>Viewing Properties</caption>";
		viewing += 	"<tbody>";
		viewing +=		"<tr>";
		viewing += 			"<td align='right'>view type</td>";
		viewing += 			"<td>";
		viewing += 				"<select id='tree-prop-vm'>";
		viewing += 					tree.environment().viewmode==0 ? "<option value='0' selected='selected'>dendrogram</option>" : "<option value='0'>dendrogram</option>";
		viewing +=					tree.environment().viewmode==1 ? "<option value='1' selected='selected'>cladogram</option>" : "<option value='1'>cladogram</option>";
		viewing +=					tree.environment().viewmode==2 ? "<option value='2' selected='selected'>circular dendrogram</option>" : "<option value='2'>circular dendrogram</option>";
		viewing +=					tree.environment().viewmode==3 ? "<option value='3' selected='selected'>circular cladogram</option>" : "<option value='3'>circular cladogram</option>";
		viewing += 				"</select>";
		viewing +=			"</td>";
		viewing +=		"</tr>";
		viewing +=		"<tr>";
		viewing += 			"<td align='right'>branch length</td>";
		viewing += 			"<td>";
		viewing +=				tree.environment().branchlenghts ? "<input type='checkbox' id='tree-prop-bl' disabled='disabled' />" : "<input type='checkbox' id='tree-prop-bl'  disabled='disabled' />";
		viewing +=			"</td>";
		viewing +=		"</tr>";
		viewing +=		"<tr>";
		viewing += 			"<td align='right'>3D</td>";
		viewing += 			"<td>";
		viewing +=				tree.environment().threeD ? "<input type='checkbox' id='tree-prop-3d' checked='checked' />" : "<input type='checkbox' id='tree-prop-3d' />";
		viewing +=			"</td>";
		viewing +=		"</tr>";
		viewing +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		viewing += 	"</tbody>";
		viewing += "</table>";
		// write labels table
		labels = "<table>";
		labels += 	"<caption>Node Labels</caption>";
		labels += 	"<tbody>";
		labels +=		"<tr>";
		labels += 			"<td align='right'>leaf labels</td>";
		labels += 			"<td>";
		labels +=				tree.environment().leaflabels ? "<input type='checkbox' id='tree-prop-ll' checked='checked' />" : "<input type='checkbox' id='tree-prop-ll' />";
		labels +=			"</td>";
		labels +=		"</tr>";
		labels +=		"<tr>";
		labels += 			"<td align='right'>HTU labels</td>";
		labels += 			"<td>";
		labels +=				tree.environment().htulabels ? "<input type='checkbox' id='tree-prop-hl' checked='checked' />" : "<input type='checkbox' id='tree-prop-hl' />";
		labels +=			"</td>";
		labels +=		"</tr>";
		labels +=		"<tr>";
		labels += 			"<td align='right'>branch labels</td>";
		labels += 			"<td>";
		labels +=				tree.environment().branchlabels ? "<input type='checkbox' id='tree-prop-bl' checked='checked' disabled='disabled' />" : "<input type='checkbox' id='tree-prop-bl' disabled='disabled' />";
		labels +=			"</td>";
		labels +=		"</tr>";
		labels +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
		labels += 	"</tbody>";
		labels += "</table>";
		// add to doc
		$("#doc > section").html(name+visual+viewing+labels);
	},
	// get & set vars
	activeTree:function(v) { if(v!==undefined) this._activeTree = v; else return this._activeTree; },
};
/*###########################################################################
#################################################################### DOCUMENT
###########################################################################*/
PhyloBox.Document = {
	// private vars
	_io:null, _keys:[], _trees:[],
	// constructor
	init:function() {
		// initialize io
		this._io = new IO(this,PhyloBox.API,"json","#doc-loader");
	},
	// private methods
	_error:function(e) { console.log("Document: "+e); },
	// public methods
	load:function(key) {
		this._keys.push(key);
		this._io.request("load","k="+key);
	},
	receive:function(type,data) {
		// temp !
		data.environment.threeD = data.environment['3D'];
		// do something
		switch(type) {
			case "load" :
				// convert data to tree type
				var t = new Tree(data);
				this._trees.push(t);
				// set to active
				PhyloBox.Interface.activeTree(this._trees.length-1);
				// set taxa list
				PhyloBox.Interface.setTaxa();
				// set trees
				PhyloBox.Interface.setTree();
				// set properties
				PhyloBox.Interface.setProperties();
				// create view
				t.view = new View(20,"#trees > section",{t:20,r:100,b:20,l:20},true,true);
				t.view.plot(t);
				// go
				t.view.begin();
				break;
		}
	},
	// get & set vars
	tree:function(v) { return this._trees[v]; },
};
/*###########################################################################
########################################################################## IO
###########################################################################*/
var IO = Class.extend({
	// private vars
	_caller:null, _server:null, _dataType:null, _loader:null,
	// contructor
	init:function(c,s,dt,l) {
		if(!c || !s || !dt || !l) { this._error("invalid arguments..."); return false; }
		this._caller = c;
		this._server = s;
		this._dataType = dt;
		this._loader = l;
	},
	// private methods
	_loading:function(vis) { (vis) ? $(this._loader).fadeIn("fast") : $(this._loader).fadeOut("slow",function() { $(this).hide(); }); },
	_error:function(e) { console.log("IO: "+e); },
	// public methods
	request:function(a,q) {
		this._loading(true);		
		var __this = this;
		$.ajax({
  			type:"POST", url:__this._server, data:q, dataType:__this._dataType,
			complete:function(request) { },
  			success:function(json) {
				__this._loading(false);
				if(!json) { __this._error("nothing received..."); return false; }
				__this._caller.receive(a,json);
			},
			error:function(e) {
				__this._loading(false);
				__this._error(e['responseText']);
			}
 		});
	}
});
/*###########################################################################
######################################################################## NODE
###########################################################################*/
var Node = Class.extend({
	// private vars
	_id:null, _parent:null, _children:[], _siblings:[], _n_parents:0, _layer:0, _is_leaf:false, _is_root:false,
	_color:null, _uri:null, _name:null, _taxonomy:null, _visibility:true, _length:null, _point3D:null, _selected:false, _hover:false,
	// constructor
	init:function(id) { this._id = id; this._children = []; this._siblings = []; },
	// private methods
	_error:function(e) { console.log("Node: "+e); },
	// public methods
	add_child:function(v) { this._children.push(v); },
	// get & set vars
	id:function() { return this._id; },
	parent:function(v) { if(v!==undefined) this._parent = v; else return this._parent; },
	children:function() { return this._children; },
	siblings:function(v) { if(v!==undefined) this._siblings = v; else return this._siblings; },
	n_children:function() { return this._children.length; },
	n_siblings:function() { return this._siblings.length; },
	n_parents:function(v) { if(v!==undefined) this._n_parents = v; else return this._n_parents; },
	layer:function(v) { if(v!==undefined) this._layer = v; else return this._layer; },
	is_leaf:function(v) { if(v!==undefined) this._is_leaf = v; else return this._is_leaf; },
	is_root:function(v) { if(v!==undefined) this._is_root = v; else return this._is_root; },
	color:function(v) { if(v!==undefined) this._color = v; else return this._color; },
	uri:function(v) { if(v!==undefined) this._uri = v; else return this._uri; },
	name:function(v) { if(v!==undefined) this._name = v; else return this._name; },
	taxonomy:function(v) { if(v!==undefined) this._taxonomy = v; else return this._taxonomy; },
	visibility:function(v) { if(v!==undefined) this._visibility = v; else return this._visibility; },
	length:function(v) { if(v!==undefined) this._length = v; else return this._length; },
	//–––––––––––––––––––––– for drawing ––––––––––––––––––––––//
	point3D:function(v) { if(v!==undefined) this._point3D = v; else return this._point3D; },
	selected:function(v) { if(v!==undefined) this._selected = v; else return this._selected; },
	hover:function(v) { if(v!==undefined) this._hover = v; else return this._hover; },
});
/*###########################################################################
######################################################################## TREE 
###########################################################################*/
var Tree = Class.extend({
	// private vars
	_data:[], _data_clone:[], _json:[], _node_list:[], _nodes:[],
	_n_leaves:0, _n_layers:0, _title:null, _environment:null,
	// public vars
	view:null,
	// constructor
	init:function(data) {
		// store data
		this._data = data;
		// nest this tree around the root
		var ir = this._data.environment.root ? this._data.environment.root : this._data.root ? this._data.root : this._data.tree[0].id;
		this.nest(ir);
	},
	// private methods
	_nest:function(rid) {
		// root node?
		if(!rid) { this._error("no root node provided for nest..."); return false; }
		// get the root json object
		var root = this._find(this._json,"id",rid);
		// exit if invalid
		if(!root) { this._error("invalid tree root id"); return false; }
		// ensure proper tree direction
		if(root.parent_id) {
			// if root is leaf, root's parent becomes root
			if(!root.children) root = this._find(this._json,"id",root.parent_id);
			// parent -> child
			root.children.push({ "id":root.parent_id });
			// child -> parent
			var parent = this._find(this._json,"id",root.parent_id);
			for(var c in parent.children) if(parent.children[c].id==root.id) parent.children.splice(parent.children.indexOf(parent.children[c]),1);
			//for(c in parent.children) if(parent.children[c].id==root.id) delete parent.children[c];
			if(parent.children.length==0) parent.children = null;
			// rename parents
			root.parent_id = null;
			parent.parent_id = root.id;
		}
		// make the tree
		this._n_leaves = 0;
		this._n_layers = 0;
		this._node_list = [];
		this._nodes = new Node(rid);
		this._nodes.is_root(true);
		this._branch(this._nodes,root);
		for(var n in this._node_list) {
			// assign layers
			if(this._node_list[n].is_leaf()) this._node_list[n].layer(this._n_layers-1);
			else this._node_list[n].layer(this._node_list[n].n_parents());
			// assign siblings
			for(var c in this._node_list[n].children()) {
				var s = this._node_list[n].children().slice(0);
				s.splice(s.indexOf(s[c]),1);
				this._node_list[n].children()[c].siblings(s);
			}
		}
	},
	_branch:function(n,d) {
		// ensure proper tree direction
		for(var c in d.children) {
			if(!d.children[c]) continue;
			var cd = this._find(this._json,"id",d.children[c].id);
			//if(cd.parent_id && cd.parent_id!=d.id) {
			if(cd.parent_id!=d.id) {
				// parent -> child
				cd.children.push({ "id":cd.parent_id });
				// child -> parent
				var cpd = this._find(this._json,"id",cd.parent_id);
				for(var cc in cpd.children) if(cpd.children[cc].id==cd.id) cpd.children.splice(cpd.children.indexOf(cpd.children[cc]),1);
				//for(cc in cpd.children) if(cpd.children[cc].id==cd.id) delete cpd.children[cc];
				if(cpd.children.length==0) cpd.children = null;
				// rename parents
				cd.parent_id = d.id;
				cpd.parent_id = cd.id;
			}
		}
		// set color
		n.color(d.color);
		// set uri links
        n.uri(d.uri);
        // set name
		if(d.name) n.name(d.name);
        else if(d.taxonomy && d.taxonomy.scientific_name) n.name(d.taxonomy.scientific_name);
		// set taxonomy
		n.taxonomy(d.taxonomy);
		// set visibility
		n.visibility(d.visibility);
		// set length
		n.length(d.length);
		// move down tree
		if(!d.children) {
			n.is_leaf(true);
			this._n_leaves++;
		} else for(var c in d.children) {
			if(!d.children[c]) continue;
			var cn = new Node(d.children[c].id);
			n.add_child(cn);
			cn.parent(n);
			cn.n_parents(n.n_parents()+1);
			this._branch(cn,this._find(this._json,"id",cn.id()));
		}
		// max number parents = tree's layer count
		if(this._n_layers <= n.n_parents()) this._n_layers = n.n_parents()+1;
		// collect node ref for list
		this._node_list.push(n);
	},
	_find:function(o,p,v) {
		// returns false if not unique !
		var r; var n = 0;
		for(var i in o) if(o[i][p]==v) { r = o[i]; n++; }
		return (n!=1) ? false : r;
	},
	_error:function(e) { console.log("Tree: "+e); },
	// public methods
	nest:function(rid) {
		// clone the original data
		this._data_clone = $.extend(true,{},this._data);
		// define usable objects
		this._json = this._data_clone.tree;
		this._title = this._data_clone.title;
		this._environment = this._data_clone.environment;
		this._environment.root = rid;
		// (re)nest
		this._nest(rid);
	},
	// get vars
	nodes:function() { return this._nodes; },
	node_list:function() { return this._node_list; },
	n_leaves:function() { return this._n_leaves; },
	n_layers:function() { return this._n_layers; },
	title:function(v) { if(v!==undefined) this._title = v; else return this._title; },
	environment:function() { return this._environment; },
});
/*###########################################################################
################################################################### DOC READY  
###########################################################################*/
$(function() {
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– EXTEND UTILS
	// on jquery
	$.extend({  });
	// on jquery objects
	$.fn.extend({  });
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– APP SETUP
	PhyloBox.System.init();
	PhyloBox.Interface.init();
	PhyloBox.Document.init();
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– MINE DATA
	PhyloBox.Document.load(__key__);
});
//####################################################################### END