/*--------------------------------------------------------------------------.
|  Software: PhyloBox                                                       |
|   Version: 2.0                                                            |
|   Contact: andrewxhill@gmail.com || sanderpick@gmail.com                  |
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
var PhyloBox = function(phylobox_container_div_id, phylobox_environment_options, phylobox_event_handlers) {
	// save ref
	var pB = this;
	// map jQuery
    $ = jQuery;
	// widget or full app
    this.WIDGET = phylobox_container_div_id ? true : false;
	// use native container if none given here
	this.C = this.WIDGET ? $("#"+phylobox_container_div_id) : $("body");
	// options
    this.Options = $.extend({
        background: null,
        viewMode: null,
        threeD: null,
        htuLabels: null,
        nodeLabels: null,
        branchColor: null,
        branchWidth: null,
        nodeRadius: null,
        title: true
    },phylobox_environment_options);
	this.widget_h = phylobox_event_handlers;
	// constants
	this.API_TREE = this.WIDGET ? "http://2-0.latest.phylobox.appspot.com/lookup" : "/lookup";
	this.API_GROUP = this.WIDGET ? "http://2-0.latest.phylobox.appspot.com/group" : "/group";
	this.API_NEW = this.WIDGET ? "http://2-0.latest.phylobox.appspot.com/new" : "/new";
	this.API_SAVE_TREE = this.WIDGET ? "http://2-0.latest.phylobox.appspot.com/save" : "/save";
	this.RX_URL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
/*###########################################################################
###################################################################### SYSTEM
###########################################################################*/
	this.System = {
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
	this.Interface = {
		// private vars
		_activeTree:null, _activeTool:null, _activeMenu:null,
		// constructor
		init:function() {
			// miscellaneous setup
			if(!window.console) window.console = { log:function() {} };
			$(window).load(function() {
				$(".menu",pB.C).each(function(i) {
					$(this).css("left",$(this.parentNode).offset().left);
				});
			});
			// add resize events
			this._addResizeEvents();
			// add menu events
			this._addMenuEvents();
			// add tool event dispatching
			this._addToolEvents();
			// add property events
			this._addPropertyEvents();
		},
		// private methods
		_fit:function() {
			// size panels to fit window height
			$(".panel",pB.C).each(function(i) {
				var h = $(window).height() - 76;
				$(this).height(h);
			});
			$("section",pB.C).each(function(i) {
				var h = this.parentNode.id!="trees" ? $(window).height() - 111 : $(window).height() - 101;
				$(this).height(h);
			});
			$(".handle > div",pB.C).each(function(i) {
				var h = $(window).height() - 101;
				$(this).height(h);
			});
			$(".handle > div > img",pB.C).each(function(i) {
				var t = ($(window).height() - 125) / 2;
				$(this).css("top",t);
			});
		},
		_killMenu:function(e) {
			if(e.target.nodeName != "INPUT") {
				var __this = e.data.ref;
				$(document).unbind("click",__this._killMenu);
				$(__this._activeMenu).removeClass("menu-butt-active");
				$(__this._activeMenu.nextElementSibling).hide();
				__this._activeMenu = null;
			}
		},
		_addResizeEvents:function() {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// save ref
			var __this = this;
			// set window and resizes
			$(window).resize(function() {
				// trigger handlers for all views
				$(document).trigger("pb-treeresize");
				// fit heights
				__this._fit(); 
			}); __this._fit();
			// resize panels
			$(".handle > div > img",pB.C).bind("mousedown",function(e) {
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
						var movehandle = function(e) {
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
							$(this).trigger("pb-treeresize");
						};
						$(document).bind("mousemove",movehandle);
					} else {
						// get margin and sibling
						var main_m_orig = parseInt($(main).css("margin-right"));
						var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.lastElementChild;
						var sib_w_orig = $(sib).width();
						// bind mouse move
						var movehandle = function(e) {
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
							$(this).trigger("pb-treeresize");
						};
						$(document).bind("mousemove",movehandle);
					}
				} else { // panel-left
					// get sibling
					var sib = this.parentNode.parentNode.parentNode.previousElementSibling;
					var sib_w_orig = $(sib).width();
					// bind mouse move
					var movehandle = function(e) {
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
					};
					$(document).bind("mousemove",movehandle);
				}
				// bind mouse up
				$(document).bind("mouseup",function() {
					// remove all
					$(this).unbind("mousemove",movehandle).unbind("mouseup",arguments.callee);
					// add back tools events
					//__this._addToolEvents();
				});
			});
		},
		_addMenuEvents:function() {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// save ref
			var __this = this;
			// menu events
			$(".menu-butt",pB.C).live("click",function() {
				// set active
				__this._activeMenu = this;
				// add style and show menu
				$(this).addClass("menu-butt-active");
				$(this.nextElementSibling).show();
				// hide when click out	
				$(document).bind("click",{ ref:__this },__this._killMenu);
			});
			$(".menu-butt",pB.C).live("mouseenter",function() {
				// check if active
				if(__this._activeMenu) {
					// remove first document listener
					$(document).unbind("click",__this._killMenu);
					// remove style and hide menu
					$(__this._activeMenu).removeClass("menu-butt-active");
					$(__this._activeMenu.nextElementSibling).hide();
					// set active
					__this._activeMenu = this;
					// add style and show menu
					$(this).addClass("menu-butt-active");
					$(this.nextElementSibling).show();
					// hide when click out	
					$(document).bind("click",{ ref:__this },__this._killMenu);
				}
			});
			// menu file events
			$("#file-menu-new-file",pB.C).live("mouseenter",function() {
				$(this.nextElementSibling).addClass("menu-submit-hover");
			});
			$("#file-menu-new-file",pB.C).live("mouseleave",function() {
				$(this.nextElementSibling).removeClass("menu-submit-hover");
			});
			$("#file-menu-new-file",pB.C).live("mousedown",function() {
				$(this.nextElementSibling).addClass("menu-submit-active");
			});
			$("#file-menu-new-file",pB.C).live("mouseup",function() {
				$(this.nextElementSibling).removeClass("menu-submit-active");
			});
			$("#file-menu-new-file",pB.C).live("change",function() {
				// hide menu
				$(document).unbind("click",__this._killMenu);
				$(__this._activeMenu).removeClass("menu-butt-active");
				$(__this._activeMenu.nextElementSibling).hide();
				__this._activeMenu = null;
				// show loading gif
			
				// save ref to parent
				var parent = this.parentNode;
				// create an iframe
				var iframe = $("<iframe id='uploader' name='uploader' style='display:none;' />");
				// add to doc
			    iframe.appendTo(pB.C);
				// iframe event handling
				var uploaded = function(e) {
					// remove load event
					$("#uploader",pB.C).unbind("load",uploaded);
					// get data
	                //eval("("+$("#uploader",pB.C).contents().find("body").html()+")");
					var data = JSON.parse($("#uploader",pB.C).contents().find("pre").html());
					// make a tree
					pB.Document.load(data);
					// clean up -- safari needs the delay
					setTimeout(function() {
						$("#uploader",pB.C).remove();
						$("#file-form",pB.C).remove();
					},1000);
				}
				// add load event to iframe
				$("#uploader",pB.C).bind("load",uploaded);
				// create the upload form
				var form = "<form id='file-form' action='"+pB.API_NEW+"' enctype='multipart/form-data' encoding='multipart/form-data' method='post' style='display:none;'></form>";
				// add to doc
			    $(form).appendTo(pB.C);
				// change form's target to the iframe (this is what simulates ajax)
			    $("#file-form",pB.C).attr("target","uploader");
				// add the file input to the form
				$(this).appendTo("#file-form",pB.C);
				// submit form
			    $("#file-form",pB.C).submit();
				// re-attach input field
				$(this).prependTo(parent);
				// ensure single submit
				return false;
			});
			// save active tree
			$("#file-menu-save-tree",pB.C).live("click",function() {
				// save active tree
				pB.Document.tree(__this._activeTree).save();
			});
			// sharing info
			$("#share-menu-share-tree",pB.C).live("click",function() {
				// $.fancybox({
				// 	content:$("#perma-link").html(),
				// });
				// return false;
			});
		},
		_addToolEvents:function() {
			// save ref
			var __this = this;
			// tools
			$(".tool",pB.C).live("click",function() {
				// check unavailable
				if($(this).hasClass("tool-off")) return false;
				// check already active
				if($(this).hasClass("tool-active")) return false;
				// clear styles
				$(".tool",pB.C).each(function(i) { $(this).removeClass("tool-active"); });
				// add style
				$(this).addClass("tool-active");
				// set to active
				__this._activeTool = this.id;
			});
			$(".tool",pB.C).live("mousedown",function(e) {
				// prevent image drag behavior
				if(e.preventDefault) e.preventDefault();
			});
			// get all
			var canvases = $(".tree-holder canvas",pB.C);
			// canvas tools
			canvases.live("click",function(e) {
				// set active if not
				if(this.id == pB.Document.tree(__this._activeTree).view().id()) return false;
				else {
					__this._activeTree = $(this).data("view").tree().age();
					// trigger mouseenter for cursor
					$(this).trigger("mouseenter");
					// set taxa list
					pB.Interface.setTaxa();
					// set properties
					pB.Interface.setProperties();
				}
			});
			canvases.live("mousedown",function(e) {
				// check if active
				if(this.id != pB.Document.tree(__this._activeTree).view().id()) return false;
				// save reference
				var canvas = $(this);
				// trigger event
				canvas.trigger("pb-"+__this._activeTool,["mousedown",__this._viewMouse(e,canvas)]);
				// add move event
				canvas.bind("mousemove",function(e) {
					// trigger event
					canvas.trigger("pb-"+__this._activeTool,["mousemove",__this._viewMouse(e,canvas)]);
				});
				// add up event
				$(document).bind("mouseup",function(e) {
					// unbind events
					canvas.unbind("mousemove");
					$(this).unbind("mouseup");
					// trigger event
					canvas.trigger("pb-"+__this._activeTool,["mouseup",__this._viewMouse(e,canvas)]);
				});
			});
			canvases.live("mouseenter",function(e) {
				// check if active
				if(this.id != pB.Document.tree(__this._activeTree).view().id()) { 
					$(this).css("cursor","default");
					return false;
				}
				// set cursor
				switch(__this._activeTool) {
					case "select" :
						$(this).css("cursor","none");
						break;
					case "translate" :
						$(this).css("cursor","url(static/gfx/tools/mouse-translate.png) 8 8, auto");
						break;
					case "rotate" :
						$(this).css("cursor","url(static/gfx/tools/mouse-rotate.png) 8 8, auto");
						break;
					case "zin" :
						$(this).css("cursor","url(static/gfx/tools/mouse-zin.png) 6 6, auto");
						break;
					case "zout" :
						$(this).css("cursor","url(static/gfx/tools/mouse-zout.png) 6 6, auto");
						break;		
				}
			});
			canvases.live("mouseleave",function(e) {
				// check if active
				if(this.id != pB.Document.tree(__this._activeTree).view().id()) return false;
				// refresh view
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			canvases.live("mousemove",function(e) {
				// check if active
				if(this.id != pB.Document.tree(__this._activeTree).view().id()) return false;
				// save reference
				var canvas = $(this);
				// trigger event
				canvas.trigger("pb-"+__this._activeTool,["mousesearch",__this._viewMouse(e,canvas)]);
			});
			canvases.live("dblclick",function(e) {
				// check if active
				if(this.id != pB.Document.tree(__this._activeTree).view().id()) return false;
				// clear selected
				__this._clearNode(true);
			});
		},
		_addPropertyEvents:function() {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// save ref
			var __this = this;
			// editable cells
			$(".editable",pB.C).live("click",function() {
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
			$("#tree-prop-name",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).title($(this).val());
				pB.Document.tree(__this._activeTree).view().replot();
			});
			// change background color
			$("#tree-prop-bg",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().color = $(this).val();
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// change branch width
			$("#tree-prop-bw",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().width = $(this).val();
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// change node radius width
			$("#tree-prop-nr",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().radius = $(this).val();
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// change tree type
			$("#tree-prop-vm",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().viewmode = parseInt($(this).val());
				pB.Document.tree(__this._activeTree).view().replot();
			});
			// change branch length option
			$("#tree-prop-bl",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().branchlenghts = !pB.Document.tree(__this._activeTree).environment().branchlenghts;
				pB.Document.tree(__this._activeTree).view().replot();
			});
			// change 3d option
			$("#tree-prop-3d",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().threeD = !pB.Document.tree(__this._activeTree).environment().threeD;
				pB.Document.tree(__this._activeTree).view().replot();
			});
			// change boundaries option
			$("#tree-prop-bn",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).view().boundaries(!pB.Document.tree(__this._activeTree).view().boundaries());
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// leaf labels
			$("#tree-prop-ll",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().leaflabels = !pB.Document.tree(__this._activeTree).environment().leaflabels;
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// htu labels
			$("#tree-prop-hl",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().htulabels = !pB.Document.tree(__this._activeTree).environment().htulabels;
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// branch labels
			$("#tree-prop-bl",pB.C).live("change",function() {
				pB.Document.tree(__this._activeTree).environment().branchlabels = !pB.Document.tree(__this._activeTree).environment().branchlabels;
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// hover node in list
			$(".taxa-link",pB.C).live("mouseenter",function() {
				// get node
				var node = $(this).data("node");
				// set hover
				node.hover(true);
				// refresh view
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			$(".taxa-link",pB.C).live("mouseleave",function() {
				// get node
				var node = $(this).data("node");
				// set hover
				node.hover(false);
				// refresh view
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// click node in list
			$(".taxa-link",pB.C).live("click",function() {
				// get node
				var node = $(this).data("node");
				// parse node properties
				__this.setNode(node);
			});
			// change clade color
			$("#node-prop-cl",pB.C).live("change",function() {
				// get node
				var node = $("#node",pB.C).data("node");
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
				pB.Document.tree(__this._activeTree).view().update_links(true);
				pB.Document.tree(__this._activeTree).view().refresh();
			});
			// clade toggle
			$("#node-prop-vb",pB.C).live("change",function() {
				// get node
				var node = $("#node",pB.C).data("node");
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
				pB.Document.tree(__this._activeTree).view().update_links(true);
				pB.Document.tree(__this._activeTree).view().refresh();
			});
		},
		_mouse:function(e) {
			// get true mouse position
			var px = 0;
			var py = 0;
			if(!e) var e = window.event;
			if(e.pageX || e.pageY) {
				px = e.pageX;
				py = e.pageY;
			} else if(e.clientX || e.clientY) {
				px = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				py = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			// format
			return { x:px, y:py };
		},
		_viewMouse:function(e,c) {
			// mouse
			var m = this._mouse(e);
			// coords
			vx = m.x - c.offset().left;
			vy = m.y - c.offset().top;
			// format
			return { x:vx, y:vy };
		},
		_navTo:function(n) {
			// go to it
			$("#taxa > section",pB.C).scrollTo("#"+n.link().attr("id"),100,{ offset:-45 });
		},
		_clearNode:function(props) {
			// get selected
			var node = pB.Document.tree(this._activeTree).view().selected_node();
			// check exists
			if(!node) return false;
			// clear selected
			pB.Document.tree(this._activeTree).view().clearSelected();
			// clear style
			node.link().removeClass("taxa-link-selected");
			// clear child style
			$(".taxa-link",pB.C).each(function(i) {
				$(this).css("padding-left","0");
			});
			// clear node panel
			if(!props) return false;
			// refresh view
			var view = pB.Document.tree(this._activeTree).view();
			view.selecting(true);
			view.refresh();
			view.selecting(false);
			// title
			$(".panel-head",$("#node",pB.C)).text("Node");
			// body
			$("#node > section",pB.C).html("<h2 class='prop-title nodes-blank'>Select a node to see its properties.</h2>");
		},
		_error:function(e) { console.log("Interface: "+e); },
		// public methods
		setTaxa:function() {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// use active tree
			var node_list = pB.Document.tree(this._activeTree).node_list();
			// order nodes by id
			var nodes = [];
			for(var i=0;i<node_list.length;i++) nodes[i] = node_list[i];
			nodes.sort(function(a,b) { return a.id() - b.id(); });
			// get taxa list
			var taxa = $("#taxa > section > ul",pB.C);
			// empty taxa
			taxa.empty();
			// walk nodes
			for(var n in nodes) {
				var node = nodes[n];
				// get name
				var name = "";
				if(node.name()) name += node.name();
				else if(node.taxonomy())
					for(var i in node.taxonomy()) {
						if(name!="") name += " | ";
						name += node.taxonomy()[i];
					}
				if(node.n_children() > 0) name = "(HTU) "+name;
				name = "&mdash;&nbsp;&nbsp;"+node.id()+":&nbsp;"+name;
				// color square
				var info = "<div class='taxa-right'>";
				info += 	"<div class='ex' style='"+(node.visibility() ? "display:none" : "")+"'>x</div>";
				info += 	"<div class='dot' style='background:#"+node.color()+";'></div>";
				info += "</div>";
				// add to doc
				taxa.append("<li><a href='javascript:;' id='nl-"+node.id()+"' class='taxa-link'>"+name+info+"</a></li>");
				// add node as data to link
				var l = $("#nl-"+node.id(),pB.C);
				l.data("node",node);
				// save link to node
				node.link(l);
			}
		},
		setNode:function(node,found) {
			// notify and exit if widget mode
			if(pB.WIDGET) {
				// notify registered listeners
				pB.C.trigger("pb-nodeclick",[{ node:node }]);
				// exit
				return false;
			}
			// clear first
			this._clearNode();
			// set selected
			pB.Document.tree(this._activeTree).view().setSelected(node);
			// set style
			node.link().addClass("taxa-link-selected");
			// go to it
			if(found) this._navTo(node);
			// walk kids
			(function(n) {
				for(var c in n.children()) {
					n.children()[c].link().css("padding-left","20px");
					arguments.callee(n.children()[c]);
				}
			})(node);
			// refresh view
			pB.Document.tree(this._activeTree).view().refresh();
			// save data
			$("#node",pB.C).data("node",node);
			// set node title
			var title = node.link().text();
			$(".panel-head",$("#node",pB.C)).text("Node - "+title.substring(3,title.length-1));
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
			uri +=				"<span class='uri-link'>n / a</span>";
			uri +=			"</td>";
			uri +=		"</tr>";
			uri +=		"<tr>";
			uri += 			"<td align='right'>videos</td>";
			uri += 			"<td>";
			uri +=				"<span class='uri-link'>n / a</span>";
			uri +=			"</td>";
			uri +=		"</tr>";
			uri +=		"<tr>";
			uri += 			"<td align='right'>wiki</td>";
			uri += 			"<td>";
			uri +=				"<span class='uri-link'>n / a</span>";
			uri +=			"</td>";
			uri +=		"</tr>";
			uri +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
			uri += 	"</tbody>";
			uri += "</table>";
			// add to doc
			if(is_clade) $("#node > section",pB.C).html(clade+uri); else $("#node > section",pB.C).html(uri);
		},
		setTree:function() {
			// permalink
			//$("#perma-link-address").val();
			// grid the trees
			$(".tree-holder",pB.C).each(function(i) {
				$(this).css("height",(100 / pB.Document.trees().length)+"%");
			});
			// auto-fit
			$(window).trigger("resize");
		},
		setProperties:function() {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// use active tree
			var tree = pB.Document.tree(this._activeTree);
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
			viewing +=		"<tr>";
			viewing += 			"<td align='right'>boundaries</td>";
			viewing += 			"<td>";
			viewing +=				"<input type='checkbox' id='tree-prop-bn' />";
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
			$("#doc > section",pB.C).html(name+visual+viewing+labels);
		},
		setTools:function() {
			// don't if a tree exists already
			if(pB.Document.trees().length > 1) return false;
			// default tool is select
			$("#select",pB.C).addClass("tool-active");
			this._activeTool = "select";
		},
		hoverNode:function(n) {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// set style
			n.link().addClass("taxa-link-hover");
			// go to it
			this._navTo(n);
		},
		unhoverNode:function(n) {
			// exit if widget mode
			if(pB.WIDGET) return false;
			// check n
			if(!n) return false;
			// set style
			n.link().removeClass("taxa-link-hover");
			// go back to selected
			if(pB.Document.tree(this._activeTree).view().selected_node())
				this._navTo(pB.Document.tree(this._activeTree).view().selected_node());
		},
		// get & set vars
		activeTree:function(v) { if(v!==undefined) this._activeTree = v; else return this._activeTree; },
	};
/*###########################################################################
#################################################################### DOCUMENT
###########################################################################*/
	this.Document = {
		// private vars
		_io:null, _trees:[],
		// constructor
		init:function() {
			// initialize io
			this._io = new pB.IO(this,pB.API_GROUP,"json","#doc-loader");
		},
		// private methods
		_error:function(e) { console.log("Document: "+e); },
		// public methods
		load:function(data,group) {
			// check group
			if(group)
				// get the tree keys from the api
				this._io.request("load","g="+data);
			else {
				// create a tree type
				var t = new pB.Tree();
				// save it
				this._trees.push(t);
				// set age
				t.age(this._trees.length-1);
				// set to active
				pB.Interface.activeTree(t.age());
				// go
				t.begin(data);
			}
		},
		receive:function(type,data) {
			// do something
			switch(type) {
				case "load" :
					// loop over trees
					for(var k in data) {
						// create a tree type
						var t = new pB.Tree();
						// save it
						this._trees.push(t);
						// set age
						t.age(this._trees.length-1);
						// set to active
						pB.Interface.activeTree(t.age());
						// go
						t.begin(data[k]);
					}
					break;
			}
		},
		// get & set vars
		tree:function(v) { return this._trees[v]; },
		trees:function() { return this._trees; },
	};
/*###########################################################################
########################################################################## IO
###########################################################################*/
	this.IO = Class.extend({
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
		_loading:function(vis) { (vis) ? $(this._loader,pB.C).fadeIn("fast") : $(this._loader,pB.C).fadeOut("slow",function() { $(this).hide(); }); },
		_error:function(e) { console.log("IO: "+e); },
		// public methods
		request:function(a,q,s) {
			this._loading(true);
			var __this = this,
				type = pB.WIDGET ? undefined : "POST";
				server = s || this._server,
				query = pB.WIDGET ? q+"&callback=?" : q;
			$.ajax({
	  			type:type, url:server, data:query, dataType:__this._dataType,
				complete:function(request) { },
				success:function(json) {
					__this._loading(false);
					if(!json) { __this._error("nothing received..."); return false; }
					else if(json==404) { __this._error("nothing received..."); return false; }
					__this._caller.receive(a,json);
				},
				error:function(e) {
                    console.log(json);
					__this._loading(false);
					__this._error(e['responseText']);
				}
	 		});
		}
	});
/*###########################################################################
######################################################################## NODE
###########################################################################*/
	this.Node = Class.extend({
		// private vars
		_id:null, _parent:null, _children:[], _siblings:[], _n_parents:0, _layer:0, _is_leaf:false, _is_root:false,
		_color:null, _uri:null, _name:null, _taxonomy:null, _visibility:true, _length:null, _point3D:null, _link:null, _selected:false, _hover:false,
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
		link:function(v) { if(v!==undefined) this._link = v; else return this._link; },
		selected:function(v) { if(v!==undefined) this._selected = v; else return this._selected; },
		hover:function(v) { if(v!==undefined) this._hover = v; else return this._hover; },
	});
/*###########################################################################
######################################################################## TREE 
###########################################################################*/
	this.Tree = Class.extend({
		// private vars
		_key:null, _view:null, _io:null, _age:null,
		_data:[], _data_clone:[], _tree_data:[], _node_list:[], _nodes:[],
		_n_leaves:0, _n_layers:0, _title:null, _environment:null,
		// constructor
		init:function() {  },
		// private methods
		_make:function(data) {
			// store data
			this._data = data;
			// nest this tree around the root
			var ir = this._data.environment.root ? this._data.environment.root : this._data.root ? this._data.root : this._data.tree[0].id;
			this.nest(ir);
		},
		_nest:function(rid) {
			// root node?
			if(!rid) { this._error("no root node provided for nest..."); return false; }
			// get the root json object
			var root = this._find(this._tree_data,"id",rid);
			// exit if invalid
			if(!root) { this._error("invalid tree root id"); return false; }
			// ensure proper tree direction
			if(root.parent_id) {
				// if root is leaf, root's parent becomes root
				if(!root.children) root = this._find(this._tree_data,"id",root.parent_id);
				// parent -> child
				root.children.push({ "id":root.parent_id });
				// child -> parent
				var parent = this._find(this._tree_data,"id",root.parent_id);
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
			this._nodes = new pB.Node(rid);
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
				var cd = this._find(this._tree_data,"id",d.children[c].id);
				//if(cd.parent_id && cd.parent_id!=d.id) {
				if(cd.parent_id!=d.id) {
					// parent -> child
					cd.children.push({ "id":cd.parent_id });
					// child -> parent
					var cpd = this._find(this._tree_data,"id",cd.parent_id);
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
				var cn = new pB.Node(d.children[c].id);
				n.add_child(cn);
				cn.parent(n);
				cn.n_parents(n.n_parents()+1);
				this._branch(cn,this._find(this._tree_data,"id",cn.id()));
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
		begin:function(data) {
			// save key
			this._key = typeof data == "string" ? data : data.k;
			// make and attach a tree holder
			var holder = $("<div class='tree-holder' />");
			if(pB.C.tagName == "BODY" || pB.C[0].tagName == "BODY") holder.appendTo("#trees > section");
			else holder.appendTo(pB.C);
			// create view
            if ( typeof data == "string" && pB.RX_URL.test(data) ) {
                this._key = (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            } 
            this._view = new pB.Engine.View(this._key,holder,{t:20,r:20,b:20,l:20},true,20,true);
            // initialize io
			this._io = new pB.IO(this,pB.API_TREE,"json","#tree-loader-"+this._view.id());
			// load data if present otherwise go on
			typeof data == "string" ? 
				pB.RX_URL.test(data) ? 
					this._io.request("load","phyloUrl="+data,pB.API_NEW) : 
					this._io.request("load","k="+this._key) : 
				this.receive("load",data);
		},
		receive:function(type,data) {
			// do something
			switch(type) {
				case "load" :
					// make tree
					this._make(data);
					// bind handler for tree ready
					$("#"+this._view.id(),pB.C).bind("viewready",function(e) {
						// unbind
						$(e.target).unbind("viewready",arguments.callee);
						// set taxa list
						pB.Interface.setTaxa();
						// set trees
						pB.Interface.setTree();
						// set properties
						pB.Interface.setProperties();
						// set tools
						pB.Interface.setTools();
					});
					// plot
					this._view.plot(this);
					// go
					this._view.begin();
                    // change the url hash to the new destination
                    if(!pB.WIDGET)
						pB.RX_URL(window.location.hash.substr(1)) ?
                        	window.location.hash = window.location.hash.substr(1) :
                        	window.location.hash = this._key;
					break;
				case "save" :
					alert("Your tree has been saved. Sick!");
					break;
			}
		},
		nest:function(rid) {
			// clone the original data
			this._data_clone = $.extend(true,{},this._data);
			// define usable objects
			this._tree_data = this._data.tree;
			this._title = this._data.title;
			this._environment = this._data.environment;
			this._environment.root = rid;
			// (re)nest
			this._nest(rid);
            
            if(pB.WIDGET){
                this._data.environment.color = pB.Options.background == null ? this._data.environment.color : pB.Options.background;
                this._data.environment.radius = pB.Options.nodeRadius == null ? this._data.environment.radius : pB.Options.nodeRadius;
                this._data.environment.width = pB.Options.branchWidth == null ? this._data.environment.width : pB.Options.branchWidth;
                this._data.environment.htulabels = pB.Options.htuLabels == null ? this._data.environment.htulabels : pB.Options.htuLabels;
                this._data.environment.branchlabels = pB.Options.branchLabels == null ? this._data.environment.branchlabels : pB.Options.branchLabels;
                this._data.environment.threeD = pB.Options.threeD == null ? this._data.environment.threeD : pB.Options.threeD;
                this._title = pB.Options.title == true ? this._title : pB.Options.title;
                switch(pB.Options.viewMode){
                    case "dendrogram":
                        this._data.environment.viewmode = 0;
                        break;
                    case "cladogram":
                        this._data.environment.viewmode = 1;
                        break;
                    case "circular dendrogram":
                        this._data.environment.viewmode = 2;
                        break;
                    case "circular cladogram":
                        this._data.environment.viewmode = 3;
                        break;
                }
                    
                
                //console.log(this._title);
            }
		},
		save:function() {
			// update phyloJSON nodes with Node properties
			for(var n in this._node_list) {
				var pj_node = this._find(this._tree_data,"id",this._node_list[n].id());
				pj_node.color = this._node_list[n].color();
		        pj_node.visibility = this._node_list[n].visibility();
			}
			// stringify the data
			var save = JSON.stringify(this._data);
			// save an image
	   	    var png = JSON.stringify(this._view.canvas()[0].toDataURL("image/png"));
			// save
			this._io.request("save",{ key:this._key, tree:save, title:this._title, png:png }, pB.API_SAVE_TREE);
		},
		// get vars
		nodes:function() { return this._nodes; },
		node_list:function() { return this._node_list; },
		n_leaves:function() { return this._n_leaves; },
		n_layers:function() { return this._n_layers; },
		title:function(v) { if(v!==undefined) this._title = v; else return this._title; },
		environment:function() { return this._environment; },
		view:function(v) { if(v!==undefined) this._view = v; else return this._view; },
		io:function() { return this._io; },
		age:function(v) { if(v!==undefined) this._age = v; else return this._age; },
	});
/*###########################################################################
###################################################################### ENGINE
###########################################################################*/
	this.Engine = {};
/*###########################################################################
############################################################# ENGINE POINT 3D
###########################################################################*/
	this.Engine.Point3D = Class.extend({
		// private vars
		_fl:2000, _vpx:0, _vpy:0, _cx:0, _cy:0, _cz:0, _x:0, _y:0, _z:0, _r:0, _t:0,
		// constructor
		init:function(pX,pY,pZ,pR,pT) {
			this._x = pX;
			this._y = pY;
			this._z = pZ;
			this._r = pR ? pR : 0;
			this._t = pT ? pT : 0;
		},
		setVanishingPoint:function(vpx,vpy) {
			this._vpx = vpx;
			this._vpy = vpy;
		},
		setCenter:function(cx,cy,cz) {
			this._cx = cx;
			this._cy = cy;
			this._cz = cz;
		},
		rotateX:function(angleX) {
			// translate
			var cosX = Math.cos(angleX);
			var sinX = Math.sin(angleX);
			var y1 = this._y * cosX - this._z * sinX;
			var z1 = this._z * cosX + this._y * sinX;
			// update
			this._y = y1;
			this._z = z1;
		},
		rotateY:function(angleY) {
			// translate
			var cosY = Math.cos(angleY);
			var sinY = Math.sin(angleY);
			var x1 = this._x * cosY - this._z * sinY;
			var z1 = this._z * cosY + this._x * sinY;
			// update
			this._x = x1;
			this._z = z1;
		},
		rotateZ:function(angleZ) {
			// translate
			var cosZ = Math.cos(angleZ);
			var sinZ = Math.sin(angleZ);
			var x1 = this._x * cosZ - this._y * sinZ;
			var y1 = this._y * cosZ + this._x * sinZ;
			// update
			this._x = x1;
			this._y = y1;
		},
		// get & set screen position
		screenX:function() { return this._vpx + (this._cx + this._x) * (this._fl / (this._fl + this._z + this._cz)); },
		screenY:function() { return this._vpy + (this._cy + this._y) * (this._fl / (this._fl + this._z + this._cz)); },
		// get & set vars
		fl:function(v) { if(v!==undefined) this._fl = v; else return this._fl; },
		x:function(v) { if(v!==undefined) this._x = v; else return this._x; },
		y:function(v) { if(v!==undefined) this._y = v; else return this._y; },
		z:function(v) { if(v!==undefined) this._z = v; else return this._z; },
		r:function(v) { if(v!==undefined) this._r = v; else return this._r; },
		t:function(v) { if(v!==undefined) this._t = v; else return this._t; }
	});
/*###########################################################################
###################################################################ENGINE DOT
###########################################################################*/
	this.Engine.Dot = Class.extend({
		// private vars
		_node:null, _point:null, _view:null,
		// constructor
		init:function(node,view) {
			this._node = node;
			this._point = this._node.point3D();
			this._view = view;
		},
		// public methods
		draw:function(ctx) {
			// check visibility
	        if(this._node.visibility()) {
				// scale radius on depth
				var scale = (this._point.z()+3000) / 6000;
		        // set styles
                
                ctx.fillStyle = pB.HEX(this._node.color());
                
				ctx.globalAlpha = scale;
		        // draw the line
		        ctx.beginPath();
				if(scale > 0) ctx.arc(this._point.screenX(),this._point.screenY(),this._view.tree().environment().radius*scale,0,2*Math.PI,false);
		        ctx.fill();
				// leaf label
				if(this._view.tree().environment().leaflabels && this._node.is_leaf()) {
					switch(this._view.tree().environment().viewmode) {
						case 0 : case 1 :
							ctx.textAlign = "left";
							var lx = Math.round(this._point.screenX()+5);
							var ly = Math.round(this._point.screenY());
							break;
						case 2 : case 3 :
							ctx.textAlign = this._point.t() > Math.PI/2 && this._point.t() < 3*Math.PI/2 ? "right" : "left";
							var lx = Math.round(this._point.screenX()+5*Math.cos(this._point.t()));
							var ly = Math.round(this._point.screenY()+5*Math.sin(this._point.t()));
							break;
					}
					ctx.textBaseline = "middle";
					var label = this._node.name() || this._node.id();
					ctx.fillText(label,lx,ly);
				}
				// htu label
				if(this._view.tree().environment().htulabels && this._node.n_children() > 0) {
					switch(this._view.tree().environment().viewmode) {
						case 0 : case 1 :
							ctx.textBaseline = "alphabetic";
							ctx.textAlign = "right";
							var lx = Math.round(this._point.screenX());
							var ly = Math.round(this._point.screenY()-3);
							break;
						case 2 : case 3 :
							ctx.textBaseline = "middle";
							ctx.textAlign = this._point.t() > Math.PI/2 && this._point.t() < 3*Math.PI/2 ? "left" : "right";
							var lx = Math.round(this._point.screenX()-3*Math.cos(this._point.t()));
							var ly = Math.round(this._point.screenY()-3*Math.sin(this._point.t()));
							break;
					}
					var label = this._node.name() || this._node.id();
					ctx.fillText(label,lx,ly);
				}
				// branch label -- coming soon
				if(this._view.tree().environment().branchlabels) {  }
			}
			// selected
			if(this._node.selected()) {
				ctx.strokeStyle = "#00ff00";
				ctx.fillStyle = "#00ff00";
				ctx.globalAlpha = 1;
				ctx.lineWidth = 1;
				ctx.dottedArc(this._point.screenX(),this._point.screenY(),this._view.h_radius(),0,2*Math.PI,false);
				ctx.globalAlpha = 0.2;
				ctx.beginPath();
				ctx.arc(this._point.screenX(),this._point.screenY(),this._view.h_radius(),0,2*Math.PI,false);
				ctx.fill();
			}
			// hover
			if(this._node.hover()) {
				ctx.strokeStyle = "#ff0000";
				ctx.fillStyle = "#ff0000";
				ctx.globalAlpha = 1;
				ctx.lineWidth = 1;
				ctx.dottedArc(this._point.screenX(),this._point.screenY(),this._view.h_radius(),0,2*Math.PI,false);
				ctx.globalAlpha = 0.3;
				ctx.beginPath();
				ctx.arc(this._point.screenX(),this._point.screenY(),this._view.h_radius(),0,2*Math.PI,false);
				ctx.fill();
			}
			// check link
			if(!this._view.update_links()) return false;
			// set link color
			$("div.dot",this._node.link()).css("background", pB.HEX(this._node.color()));
			// set link visibility
			if(!this._node.visibility()) $("div.ex",this._node.link()).show();
			else $("div.ex",this._node.link()).hide();
		},
		// get & set vars
		point:function() { return this._point; },
		node:function() { return this._node; },
	});
/*###########################################################################
################################################################# ENGINE LINE
###########################################################################*/
	this.Engine.Line = Class.extend({
		// private vars
		_node:null, _pointA:null, _pointB:null, _pointC:null, _controlP1:null, _controlP2:null, _view:null,
		// constructor
		init:function(nodeA,nodeB,siblingP,view) {
			this._node = nodeA;
			this._pointA = nodeA.point3D();
			this._pointB = nodeB.point3D();
			this._pointC = siblingP;
			this._view = view;
			// calculate control points		
			switch(this._view.tree().environment().viewmode) {
				case 0 : case 1 :
					if(this._pointC) {
						// form the edge vectors
						var ab = {};
						ab.x = this._pointA.x() - this._pointB.x();
						ab.y = this._pointA.y() - this._pointB.y();
						ab.z = this._pointA.z() - this._pointB.z();
						var bc = {};
						bc.x = this._pointB.x() - this._pointC.x();
						bc.y = this._pointB.y() - this._pointC.y();
						bc.z = this._pointB.z() - this._pointC.z();
						// form the normal vector (cross product)
						var norm = {};
						norm.x = (ab.y * bc.z) - (ab.z * bc.y);
						norm.y = -((ab.x * bc.z) - (ab.z * bc.x));
						norm.z = (ab.x * bc.y) - (ab.y * bc.x);
						// find magnitude of normal vector
						var nm = Math.sqrt(norm.x * norm.x + norm.y * norm.y + norm.z * norm.z);
						// get the unit normal vector
						var un = {};
						un.x = norm.x / nm;
						un.y = norm.y / nm;
						un.z = norm.z / nm;
						// define offset for cp1
						var off = this._view.gap() * 0.05;
						//////////// cp 1
						// make 2 points to define a line
						var p1 = {};
						p1.x = this._pointA.x() + off;
						p1.y = this._pointA.y();
						p1.z = this._pointC.z();
						var p2 = {};
						p2.x = p1.x;
						p2.y = p1.y;
						p2.z = this._pointA.z();
						// make vector to plane and vector to other point on line 
						var v1 = {};
						v1.x = this._pointB.x() - p1.x;
						v1.y = this._pointB.y() - p1.y;
						v1.z = this._pointB.z() - p1.z;
						var v2 = {};
						v2.x = p2.x - p1.x;
						v2.y = p2.y - p1.y;
						v2.z = p2.z - p1.z;
						// find "slope"
						var u1 = (un.x * v1.x + un.y * v1.y + un.z * v1.z) / (un.x * v2.x + un.y * v2.y + un.z * v2.z) || 0;
	                    // make the control point
						var cp1 = {};
						cp1.x = p1.x + u1*v2.x;
						cp1.y = p1.y + u1*v2.y;
						cp1.z = p1.z + u1*v2.z;
						this._controlP1 = new pB.Engine.Point3D(cp1.x,cp1.y,cp1.z);
						//////////// cp 2
						// make 2 points to define a line
						var p3 = {};
						p3.x = p1.x;
						p3.y = this._pointB.y();
						p3.z = this._pointC.z();
						var p4 = {};
						p4.x = p1.x;
						p4.y = p3.y;
						p4.z = this._pointA.z();
						// make vector to plane and vector to other point on line 
						var v3 = {};
						v3.x = this._pointB.x() - p3.x;
						v3.y = this._pointB.y() - p3.y;
						v3.z = this._pointB.z() - p3.z;
						var v4 = {};
						v4.x = p4.x - p3.x;
						v4.y = p4.y - p3.y;
						v4.z = p4.z - p3.z;
						// find "slope"
						var u2 = (un.x * v3.x + un.y * v3.y + un.z * v3.z) / (un.x * v4.x + un.y * v4.y + un.z * v4.z) || 0;
	                    // make the control point
						var cp2 = {};
						cp2.x = p3.x + u2*v4.x;
						cp2.y = p3.y + u2*v4.y;
						cp2.z = p3.z + u2*v4.z;
						this._controlP2 = new pB.Engine.Point3D(cp2.x,cp2.y,cp2.z);
					} else {
						this._controlP1 = new pB.Engine.Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z());
						this._controlP2 = new pB.Engine.Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z());
					}
					break;
				case 2 : case 3 :
					if(this._pointC) {
						// form the edge vectors
						var ab = {};
						ab.r = this._pointA.r() - this._pointB.r();
						ab.t = this._pointA.t() - this._pointB.t();
						ab.z = this._pointA.z() - this._pointB.z();
						var bc = {};
						bc.r = this._pointB.r() - this._pointC.r();
						bc.t = this._pointB.t() - this._pointC.t();
						bc.z = this._pointB.z() - this._pointC.z();
						// form the normal vector (cross product)
						var norm = {};
						norm.r = (ab.t * bc.z) - (ab.z * bc.t);
						norm.t = -((ab.r * bc.z) - (ab.z * bc.r));
						norm.z = (ab.r * bc.t) - (ab.t * bc.r);
						// find magnitude of normal vector
						var nm = Math.sqrt(norm.r * norm.r + norm.t * norm.t + norm.z * norm.z);
						// get the unit normal vector
						var un = {};
						un.r = norm.r / nm;
						un.t = norm.t / nm;
						un.z = norm.z / nm;
						// define offset for cp1
						var off = this._view.gap() * 0.05;
						//////////// cp 1
						// make 2 points to define a line
						var p1 = {};
						p1.r = this._pointA.r() + off;
						p1.t = this._pointA.t();
						p1.z = this._pointC.z();
						var p2 = {};
						p2.r = p1.r;
						p2.t = p1.t;
						p2.z = this._pointA.z();
						// make vector to plane and vector to other point on line 
						var v1 = {};
						v1.r = this._pointB.r() - p1.r;
						v1.t = this._pointB.t() - p1.t;
						v1.z = this._pointB.z() - p1.z;
						var v2 = {};
						v2.r = p2.r - p1.r;
						v2.t = p2.t - p1.t;
						v2.z = p2.z - p1.z;
						// find "slope"
						var u1 = (un.r * v1.r + un.t * v1.t + un.z * v1.z) / (un.r * v2.r + un.t * v2.t + un.z * v2.z) || 0;
						// make the control point
						var cp1 = {};
						cp1.r = p1.r + u1*v2.r;
						cp1.t = p1.t + u1*v2.t;
						cp1.z = p1.z + u1*v2.z;
						cp1.x = cp1.r * Math.cos(cp1.t) - this._view.cx();
						cp1.y = cp1.r * Math.sin(cp1.t) - this._view.cy();
						this._controlP1 = new pB.Engine.Point3D(cp1.x,cp1.y,cp1.z,cp1.r,cp1.t);
						//////////// cp 2
						// make 2 points to define a line
						var p3 = {};
						p3.r = p1.r;
						p3.t = this._pointB.t();
						p3.z = this._pointC.z();
						var p4 = {};
						p4.r = p1.r;
						p4.t = p3.t;
						p4.z = this._pointA.z();
						// make vector to plane and vector to other point on line 
						var v3 = {};
						v3.r = this._pointB.r() - p3.r;
						v3.t = this._pointB.t() - p3.t;
						v3.z = this._pointB.z() - p3.z;
						var v4 = {};
						v4.r = p4.r - p3.r;
						v4.t = p4.t - p3.t;
						v4.z = p4.z - p3.z;
						// find "slope"
						var u2 = (un.r * v3.r + un.t * v3.t + un.z * v3.z) / (un.r * v4.r + un.t * v4.t + un.z * v4.z) || 0;
						// make the control point
						var cp2 = {};
						cp2.r = p3.r + u2*v4.r;
						cp2.t = p3.t + u2*v4.t;
						cp2.z = p3.z + u2*v4.z;
						cp2.x = cp2.r * Math.cos(cp2.t) - this._view.cx();
						cp2.y = cp2.r * Math.sin(cp2.t) - this._view.cy();
						this._controlP2 = new pB.Engine.Point3D(cp2.x,cp2.y,cp2.z,cp2.r,cp2.t);
						break;
					} else {
						this._controlP1 = new pB.Engine.Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z(),this._pointA.r(),this._pointA.t());
						this._controlP2 = new pB.Engine.Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z(),this._pointA.r(),this._pointA.t());
					}
					break;
			}
		},
		// public methods
		draw:function(ctx) {
			// check visibility
	        if(!this._node.visibility()) return false;
	     	// set styles
	        ctx.strokeStyle = pB.HEX(this._node.color());	
	        ctx.globalAlpha = this._getLightFactor();
	        ctx.lineWidth  = this._view.tree().environment().width;
			// draw the line
	        ctx.beginPath();
	        ctx.moveTo(this._pointA.screenX(),this._pointA.screenY());
			switch(this._view.tree().environment().viewmode) {
				case 0 : case 2 : // dendrograms
					ctx.lineTo(this._controlP1.screenX(),this._controlP1.screenY());
					ctx.lineTo(this._controlP2.screenX(),this._controlP2.screenY());
					ctx.lineTo(this._pointB.screenX(),this._pointB.screenY());
					break;
				case 1 : case 3 :  // cladograms
					ctx.lineTo(this._pointB.screenX(),this._pointB.screenY());
					break;
			}
			ctx.stroke();
		},
		// private methods
		_getLightFactor:function() {
			// generate light factor
			return Math.abs(1 / this.depth())*100;
		},
		// get & set vars
		points:function() { return [ this._pointA, this._pointB ] },
		pointA:function() { return this._pointA; },
		pointB:function() { return this._pointB; },
		controlP1:function() { return this._controlP1; },
		controlP2:function() { return this._controlP2; },
		depth:function() { return Math.max(Math.min(this._pointA.z(),this._pointB.z()),0.0001); },
	});
/*###########################################################################
################################################################# ENGINE VIEW
###########################################################################*/
	this.Engine.View = Class.extend({
		// private vars
		_inited:false, _id:null, _canvas:null, _tree:null, _delay:50, _holder:null, _padding:null, _single:false, _width:0, _height:0, _int_id:null, _ctx:null,
		_vpx:0, _vpy:0, _cx:0, _cy:0, _cz:0, _dx:0, _dy:0, _dz:0, _ax:0, _ay:0, _az:0, _max_z:0, _gap:0, _h_radius:10,
		_fm:{ x:0,y:0 }, _m:{ x:0,y:0 }, _f:{ x:0,y:0,n:null }, _selecting:false, _locked:false, _hovered_node:null, _selected_node:null,
		_l:[], _d:[], _cp:[],
		_update_links:false, _boundaries:false,
		// constructor
		init:function(id,holder,padding,single,fr,full,pW,pH) {
			// save reference
			var __this = this;
			// setup canvas
			this._delay = 1000 / fr;
			this._holder = holder;
			this._padding = padding;
			this._single = single;
			this._width = (!full) ? pW : this._holder.width() - this._padding.l - this._padding.r;
			this._height = (!full) ? pH : this._holder.height() - this._padding.t - this._padding.b;
			this._id = "view-"+id;
			// create canvas
			this._canvas = $("<canvas style='display:none;' width='"+this._c_width()+"' height='"+this._c_height()+"' id='"+this._id+"'></canvas>");
			// save ref -- sloppy ?
			this._canvas.data("view",this);
			// add to document
			this._canvas.appendTo(this._holder);
			// text select tool fix for chrome on mousemove
			this._canvas[0].onselectstart = function() { return false; };
	        // add tool events
			this._canvas.bind("pb-select",this._select);
			this._canvas.bind("pb-translate",this._translate);
			this._canvas.bind("pb-rotate",this._rotate);
			this._canvas.bind("pb-zin",this._zin);
			this._canvas.bind("pb-zout",this._zout);
			// get context
			this._ctx = $("#"+this._id,pB.C)[0].getContext('2d');
			// window resize on full
			if(full) $(document).bind("pb-treeresize",function(e) {
				__this._width = __this._holder.width() - __this._padding.l - __this._padding.r;
				__this._height = __this._holder.height() - __this._padding.t - __this._padding.b;
				$("#"+__this._id,pB.C).attr({ width:__this._c_width(), height:__this._c_height() });
				if(__this._inited) __this.replot();
			});
			// hide
			$("#"+this._id,pB.C).hide();
			// initialized
			this._inited = true;
		},
		// private methods
		_start:function() {
			// check single
			if(this._single) return false;
			// define scope for timer
			var __this = this;
			// begin frame rendering
			this._int_id = setInterval(__enterFrameHandler,this._delay);
			// define timer handler
			function __enterFrameHandler() { __this._update(); __this._render(); };
		},
		_stop:function() {
			// check single
			if(this._single) return false;
			// stop time
			clearTimeout(this._int_id);
		},
		_connect:function(node) {
	        for(var c in node.children()) {
				var sp = node.children()[c].siblings().length > 0 ? node.children()[c].siblings()[0].point3D() : false;
				var l = new pB.Engine.Line(node,node.children()[c],sp,this);
				var cp1 = l.controlP1();
				var cp2 = l.controlP2();
	            this._l.push(l);
				this._cp.push(cp1);
				this._cp.push(cp2);
	            this._connect(node.children()[c]);
	        }
		},
		_update:function() {
			// set points vanishing point
			for(var d in this._d) this._d[d].point().setVanishingPoint(this._vpx,this._vpy);
			// set control points vanishing point
			for(var cp in this._cp) this._cp[cp].setVanishingPoint(this._vpx,this._vpy);
			// set points center point
			for(var d in this._d) this._d[d].point().setCenter(this._cx,this._cy,this._cz);
			// set control points center point
			for(var cp in this._cp) this._cp[cp].setCenter(this._cx,this._cy,this._cz);
			// update points
			for(var d in this._d) {
			 	this._d[d].point().x(this._d[d].point().x()+this._dx);
			 	this._d[d].point().y(this._d[d].point().y()+this._dy);
			 	this._d[d].point().z(this._d[d].point().z()+this._dz);
			 	this._d[d].point().rotateX(this._ax);
			 	this._d[d].point().rotateY(this._ay);
			 	this._d[d].point().rotateZ(this._az);
			}
			for(var cp in this._cp) {
				this._cp[cp].x(this._cp[cp].x()+this._dx);
			 	this._cp[cp].y(this._cp[cp].y()+this._dy);
			 	this._cp[cp].z(this._cp[cp].z()+this._dz);
			 	this._cp[cp].rotateX(this._ax);
			 	this._cp[cp].rotateY(this._ay);
			 	this._cp[cp].rotateZ(this._az);
			}
			// store offsets
			this._tree.environment().offset.ax += this._ax;
			this._tree.environment().offset.ay += this._ay;
			this._tree.environment().offset.az += this._az;
			this._tree.environment().offset.dx += this._dx;
			this._tree.environment().offset.dy += this._dy;
			this._tree.environment().offset.dz += this._dz;
		},
		_render:function() {
            this._ctx.fillStyle = !this._tree.environment().color ? "rgba(0,0,0,0.0)" : pB.HEX(this._tree.environment().color);
            //this._ctx.fillStyle = this._tree.environment().color;
			this._ctx.lineWidth = 1;
			this._ctx.font = "6px Plain";
			this._ctx.globalAlpha = 1;
			if(this._tree.environment().color === false)
				this._ctx.clearRect(0,0,this._c_width(),this._c_height());
			else 
				this._ctx.fillRect(0,0,this._c_width(),this._c_height());
			// draw objects
			for(var d in this._d) this._d[d].draw(this._ctx);
			for(var l in this._l) this._l[l].draw(this._ctx);
			// check locked
			if(this._locked) {
				// draw lock
				this._ctx.strokeStyle = "#ff0000";
				this._ctx.globalAlpha = 1;
				this._ctx.lineWidth = 1;
				this._ctx.dottedArc(this._f.x,this._f.y,this._h_radius,0,2*Math.PI,false);
				// draw mouse
				this._ctx.fillStyle = "#ff0000";
				this._ctx.globalAlpha = 0.3;
				this._ctx.beginPath();
				this._ctx.arc(this._f.x,this._f.y,this._h_radius,0,2*Math.PI,false);
				this._ctx.fill();
			}
			// check selecting
			else if(this._selecting) {
				// draw mouse
				this._ctx.fillStyle = "#ff0000";
				this._ctx.globalAlpha = 0.3;
				this._ctx.beginPath();
				this._ctx.arc(this._m.x,this._m.y,this._h_radius,0,2*Math.PI,false);
				this._ctx.fill();
			}
			// check boundaries
			if(this._boundaries) this._showBounds();
			// kill link updates
			if(this._update_links) this._update_links = false;
		},
		_showBounds:function() {
			// show padding, center, and vanishing point
			this._ctx.strokeStyle = "#00ffff";
			this._ctx.fillStyle = "#ff00ff";
			this._ctx.lineWidth = 0.5;
			this._ctx.globalAlpha = 1;
			this._ctx.beginPath();
			this._ctx.moveTo(this._cx,this._cy+30);
			this._ctx.lineTo(this._cx,this._cy);
			this._ctx.lineTo(this._cx+30,this._cy);
			this._ctx.moveTo(this._cx+this._width,this._cy+30);
			this._ctx.lineTo(this._cx+this._width,this._cy);
			this._ctx.lineTo(this._cx+this._width-30,this._cy);
			this._ctx.moveTo(this._cx+this._width,this._cy+this._height-30);
			this._ctx.lineTo(this._cx+this._width,this._cy+this._height);
			this._ctx.lineTo(this._cx+this._width-30,this._cy+this._height);
			this._ctx.moveTo(this._cx,this._cy+this._height-30);
			this._ctx.lineTo(this._cx,this._cy+this._height);
			this._ctx.lineTo(this._cx+30,this._cy+this._height);
			this._ctx.stroke();
			this._ctx.globalAlpha = 0.5;
			this._ctx.beginPath();
			this._ctx.moveTo(this._cx+1,this._cy+10);
			this._ctx.lineTo(this._cx+1,this._cy+1);
			this._ctx.lineTo(this._cx+10,this._cy+1);
			this._ctx.fill();
			this._ctx.fillStyle = "#ffff00";
			this._ctx.beginPath();
			this._ctx.arc(this._vpx,this._vpy,5,0,2*Math.PI,false);
			this._ctx.fill();
		},
		// public methods
		begin:function() {
			// begin
			if(!this._single) this._start();
			// dispatch ready event and show
			$("#"+this._id,pB.C).trigger("viewready").fadeIn("fast");
		},
		plot:function(tree) {
			// save tree on first pass
			if(tree && !this._tree) {
				this._tree = tree;
				// add the title
                if (this._tree.title()) {
                    this._title = $("<p class='tree-title' id='"+this._id+"-title'>"+this._tree.title()+"</p>");
                    this._title.appendTo(this._holder);
                }
			}
			// local offsets
			var local = { 
				dx:this._tree.environment().offset.dx,
				dy:this._tree.environment().offset.dy,
				dz:this._tree.environment().offset.dz,
				ax:this._tree.environment().offset.ax,
				ay:this._tree.environment().offset.ay,
				az:this._tree.environment().offset.az
			};
			// position vanishing point
			this._vpx = this._width / 2 + (this._padding.l + this._padding.r) / 2 + local.dx;
			this._vpy = this._height / 2 + (this._padding.t + this._padding.b) / 2 + local.dy;
			this._cx = this._padding.l;
			this._cy = this._padding.t;
			// refresh data
			this._l = [];
			this._d = [];
			this._cp = [];
			// parse on layer
			var nls = [];
			for(var i=0;i<this._tree.n_layers();i++) nls.push([]);
			for(var n in this._tree.node_list()) nls[this._tree.node_list()[n].layer()].push(this._tree.node_list()[n]);
			nls.reverse();
			// calculate coordinates
			switch(this._tree.environment().viewmode) {
				// dendogram, cladogram
				case 0 : case 1 :
					var gap_x = this._width / (this._tree.n_layers() - 1);
					var gap_y = this._height / (this._tree.n_leaves() - 1);
					this._max_z = (this._tree.n_layers() - 1) * gap_x;
					var j = 0;
					for(var l in nls) {
						for(var n in nls[l]) {
							var x = (nls[l][n].layer() * gap_x) - this._vpx;
							if(nls[l][n].is_leaf()) {
								var y = j * gap_y - this._vpy; j++;
							} else {
								var max_y = nls[l][n].children()[0].point3D().y();
								var min_y = nls[l][n].children()[nls[l][n].n_children()-1].point3D().y();
								var y = min_y + ((max_y - min_y) / 2);
							}
							var z = this._tree.environment().threeD ? nls[l][n].n_parents() * gap_x - (this._max_z / 2) : 1;
	                        nls[l][n].point3D(new pB.Engine.Point3D(x,y,z));
						}
					}
					this._gap = gap_x;
					break;
				// circular dendogram, circular cladogram
				case 2 : case 3 :
					var gap_r = Math.min(this._width,this._height) / (this._tree.n_layers() - 1) / 2;
					var gap_t = 2*Math.PI / this._tree.n_leaves();
					this._max_z = (this._tree.n_layers() - 1) * gap_r;
					var j = 0;
					for(var l in nls) {
						for(var n in nls[l]) {
							var r = nls[l][n].layer() * gap_r;
							if(nls[l][n].is_leaf()) {
								var t = j * gap_t; j++;
								var y = r * Math.sin(t) - this._cy;
							} else {
								var max_t = nls[l][n].children()[0].point3D().t();
								var min_t = nls[l][n].children()[nls[l][n].n_children()-1].point3D().t();
								var t = min_t + ((max_t - min_t) / 2);
								var y = r * Math.sin(t) - this._cy;
							}
							var x = r * Math.cos(t) - this._cx;
							var z = this._tree.environment().threeD ? nls[l][n].n_parents() * gap_r - (this._max_z / 2) : 1;
							nls[l][n].point3D(new pB.Engine.Point3D(x,y,z,r,t));
						}
					}
					this._gap = gap_r;
					break;	
			}
			// make dots
			for(var n in this._tree.node_list()) this._d.push(new pB.Engine.Dot(this._tree.node_list()[n],this));
			// make lines
			this._connect(this._tree.nodes());
			// set points vanishing point
			for(var d in this._d) this._d[d].point().setVanishingPoint(this._vpx,this._vpy);
			// set control points vanishing point
			for(var cp in this._cp) this._cp[cp].setVanishingPoint(this._vpx,this._vpy);
			// zoom
			this._cz = this._tree.environment().threeD ? this._max_z : 0;
			// set points center point
			for(var d in this._d) this._d[d].point().setCenter(this._cx,this._cy,this._cz);
			// set control points center point
			for(var cp in this._cp) this._cp[cp].setCenter(this._cx,this._cy,this._cz);
			// update points
			for(var d in this._d) {
			 	this._d[d].point().x(this._d[d].point().x()+local.dx);
			 	this._d[d].point().y(this._d[d].point().y()+local.dy);
			 	this._d[d].point().z(this._d[d].point().z()+local.dz);
			 	this._d[d].point().rotateX(local.ax);
			 	this._d[d].point().rotateY(local.ay);
			 	this._d[d].point().rotateZ(local.az);
			}
            if (pB.Options.branchColor != null){
                for(var d in this._d) {
                    this._d[d].node().color(pB.HEX(pB.Options.branchColor));
                }
            }
			for(var cp in this._cp) {
				this._cp[cp].x(this._cp[cp].x()+local.dx);
			 	this._cp[cp].y(this._cp[cp].y()+local.dy);
			 	this._cp[cp].z(this._cp[cp].z()+local.dz);
			 	this._cp[cp].rotateX(local.ax);
			 	this._cp[cp].rotateY(local.ay);
			 	this._cp[cp].rotateZ(local.az);
			}
			// first render
            this._ctx.fillStyle = !(this._tree.environment().color) ? "rgba(0,0,0,0.0)" : pB.HEX(this._tree.environment().color);
            this._ctx.lineWidth = 1;
			this._ctx.font = "6px Plain";
			this._ctx.globalAlpha = 1;
			this._ctx.fillRect(0,0,this._c_width(),this._c_height());
			// add to link style
			this._update_links = true;
			// draw objects
			for(var d in this._d) this._d[d].draw(this._ctx);
			for(var l in this._l) this._l[l].draw(this._ctx);
			// check boundaries
			if(this._boundaries) this._showBounds();
			// update and position title
			if (this._title) {
                this._title.text(this._tree.title()).css({ bottom:0,right:0 });
            }
		},
		replot:function() {
			// pause time
			this._stop();
			// calcs
			this.plot();
			// go
			this._start();
		},
		refresh:function() {
			// check single
			if(this._single) this._render();
		},
		setVp:function(vpx,vpy) {
			this._vpx = vpx;
			this._vpy = vpy;
		},
		setCp:function(cx,cy,cz) {
			this._cx = cx;
			this._cy = cy;
			this._cz = cz;
		},
		setSelected:function(n) {
			// set
			n.selected(true);
			this._selected_node = n;
		},
		clearSelected:function() {
			// clear
			if(this._selected_node) this._selected_node.selected(false);
		},
		// tools
		_select:function(e,t,m) {
			// get ref
			var __this = $(e.target).data("view");
			// determine action
			switch(t) {
				case "mousedown" :
					// set
					__this._m = m;
					__this._selecting = true;
					// search for nearby nodes
					var nodes = __this.tree().node_list(),
						r = __this._h_radius;
					for(var n in nodes) {
						var p = {}; 
						p.x = nodes[n].point3D().screenX(),
						p.y = nodes[n].point3D().screenY();
						if(m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y) {
							__this._f.x = p.x;
							__this._f.y = p.y;
							pB.Interface.setNode(nodes[n],true);
							__this._locked = true;
							break;
						}
					}
					// draw
					__this._render();
					// clear
					__this._selecting = false;
					__this._locked = false;
					break;
				case "mousesearch" :
					// set
					__this._m = m;
					__this._selecting = true;
					pB.Interface.unhoverNode(__this._hovered_node);
					// search for nearby nodes
					var nodes = __this.tree().node_list(),
						r = __this._h_radius;
					for(var n in nodes) {
						var p = {}; 
						p.x = nodes[n].point3D().screenX(),
						p.y = nodes[n].point3D().screenY();
						if(m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y) {
							__this._f.x = p.x;
							__this._f.y = p.y;
							__this._locked = true;
							__this._hovered_node = nodes[n];
							pB.Interface.hoverNode(__this._hovered_node);
							break;
						}
					}
					// draw
					__this._render();
					// clear
					__this._selecting = false;
					__this._locked = false;
					break;
			}
		},
		_translate:function(e,t,m) {
			// get ref
			var __this = $(e.target).data("view");
			// determine action
			switch(t) {
				case "mousedown" :
					// save mouse
					__this._fm = m;
					break;
				case "mousemove" :
					// set
					__this._dx = m.x - __this._fm.x;
					__this._dy = m.y - __this._fm.y;
					__this._vpx += __this._dx;
					__this._vpy += __this._dy;
					// draw
					__this._update(); __this._render();
					// clear
					__this._fm = m;
					__this._dx = __this._dy = 0;
					break;
			}
		},
		_rotate:function(e,t,m) {
			// get ref
			var __this = $(e.target).data("view");
			// determine action
			switch(t) {
				case "mousedown" :
					// save mouse
					__this._fm = m;
					break;
				case "mousemove" :
					switch(__this._tree.environment().threeD) {
						// 2D
						case false :
							// direction
							var sx = m.x - __this._fm.x,
								sy = m.y - __this._fm.y;
							// displacement
							var	asx = Math.abs(sx),
								asy = Math.abs(sy);
							// unit direction
							var drx = sx / asx || 1,
								dry = sy / asy || 1;
							// quadrant
							if(m.x < __this._vpx) dry *= -1;
							if(m.y > __this._vpy) drx *= -1;
							// choose
							var dr = asx > asy ? drx : dry;
							// set
							__this._az = dr * Math.sqrt(asx * asx + asy * asy) / 100;
							// draw
							__this._update(); __this._render();
							// clear
							__this._fm = m;
							__this._az = 0;
							break;
						// 3D
						case true :
							// set
							__this._ax = (m.y - __this._fm.y) / 100;
							__this._ay = (m.x - __this._fm.x) / 100;
							// draw
							__this._update(); __this._render();
							// clear
							__this._fm = m;
							__this._ax = __this._ay = 0;
							break;
					}
					break;
			}
		},
		_zin:function(e,t,m) { console.log(t+" by zoom in at "+m.x+", "+m.y); },
		_zout:function(e,t,m) { console.log(t+" by zoom out at "+m.x+", "+m.y); },
		// get & set vars
		_c_width:function() { return this._width+this._padding.l+this._padding.r; },
		_c_height:function() { return this._height+this._padding.t+this._padding.b; },
		id:function() { return this._id; },
		canvas:function() { return this._canvas; },
		tree:function() { return this._tree; },
		holder:function() { return this._holder; },
		padding:function() { return this._padding; },
		single:function() { return this._single; },
		width:function() { return this._width; },
		height:function() { return this._height; },
		ctx:function() { return this._ctx; },
		fr:function(v) {
			if(v!==undefined) {
				this._delay = 1000 / v;
				this._stop();
				this._start();
			} else return 1000 / this._delay;
		},
		cx:function(v) { if(v!==undefined) this._cx = v; else return this._cx; },
		cy:function(v) { if(v!==undefined) this._cy = v; else return this._cy; },
		dx:function(v) { if(v!==undefined) this._dx = v; else return this._dx; },
		dy:function(v) { if(v!==undefined) this._dy = v; else return this._dy; },
		dz:function(v) { if(v!==undefined) this._dz = v; else return this._dz; },
		ax:function(v) { if(v!==undefined) this._ax = v; else return this._ax; },
		ay:function(v) { if(v!==undefined) this._ay = v; else return this._ay; },
		az:function(v) { if(v!==undefined) this._az = v; else return this._az; },
		gap:function() { return this._gap; },
		h_radius:function(v) { if(v!==undefined) this._h_radius = v; else return this._h_radius; },
		selecting:function(v) { if(v!==undefined) this._selecting = v; else return this._selecting; },
		hovered_node:function(v) { if(v!==undefined) this._hovered_node = v; else return this._hovered_node; },
		selected_node:function(v) { if(v!==undefined) this._selected_node = v; else return this._selected_node; },
		update_links:function(v) { if(v!==undefined) this._update_links = v; else return this._update_links; },
		boundaries:function(v) { if(v!==undefined) this._boundaries = v; else return this._boundaries; },
	});
	//************ Statc Properties ************//
	this.Engine.View.DENDROGRAM = 0; // dendrogram
	this.Engine.View.CLADOGRAM = 1; // circular dendrogram
	this.Engine.View.CIRC_DENDROGRAM = 2; // cladogram
	this.Engine.View.CIRC_CLADOGRAM = 3; // circular cladogram
/*###########################################################################
####################################################################### UTILS
###########################################################################*/
	this.HEX = function(c){ var hex = /^([0-9a-f]{1,2}){3}$/i; hex.test(c) ? c = "#"+c : c = c; return c };
    this.COMP_HEX = function(orig){
        c = orig;
        function HexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
        function HexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
        function HexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
        function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h} 
        hex = "";
        c = cutHex(c);
        HexToR(c) < 128 ?
            hex = hex+"FF" :
            hex = hex+"00" ;
        HexToG(c) < 128 ?
            hex = hex+"FF" :
            hex = hex+"00" ;
        HexToB(c) < 128 ?
            hex = hex+"FF" :
            hex = hex+"00" ;
        if (hex.length < orig.length) { hex = "#"+hex };
        return hex
    };
	// extend natives
    CanvasRenderingContext2D.prototype.dottedArc = function(x,y,radius,startAngle,endAngle,anticlockwise) {
		var g = Math.PI / radius / 2, sa = startAngle, ea = startAngle + g;
		while(ea < endAngle) {
			this.beginPath();
			this.arc(x,y,radius,sa,ea,anticlockwise);
			this.stroke(); 
			sa = ea + g;
			ea = sa + g;
		}
	};
/*###########################################################################
############################################################## PUBLIC METHODS  
###########################################################################*/
	// adds a tree which will get focus
	this.drawTree = function(type,value) {
		//––––––––––––––––––––––––––––––––––––––––––––––––––––––––– APP SETUP
		pB.System.init();
		pB.Interface.init();
		pB.Document.init();
		//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– GET DATA
		switch(type) {
			case "group" :
				pB.Document.load(value,true);
				break;
			case "key" : case "url" :
				pB.Document.load(value);
				break
			default : alert("This is a blank document. Please upload your phylogeny via the File menu.");
		}
	}
	// registers an event with a PhyloBox instance
	this.addListener = function(t,h) { pB.C.bind(t,h); }
	// removes an event with a PhyloBox instance
	this.removeListener = function(t,h) { pB.C.unbind(t,h); }
//####################################################################### END
}
