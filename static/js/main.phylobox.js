/*--------------------------------------------------------------------------.
|  Software: PhyloBox       		                                  		|
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
/*###########################################################################
###################################################################### SYSTEM
###########################################################################*/
// determine os info
var System = {
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
System.init();
// constants
var PhyloBox = {};
PhyloBox.API = "/lookup";
PhyloBox.DOC_EXISTS = false;
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
#################################################################### DOCUMENT
###########################################################################*/
var Document = Class.extend({
	// private vars
	_io:null, _keys:[], _trees:[],
	// constructor
	init:function() {
		// ensure singleton
		if(PhyloBox.DOC_EXISTS) { this._error("class is singleton, returning false..."); return false; } else PhyloBox.DOC_EXISTS = true;
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
		// log
		console.log(data);
		// do something
		switch(type) {
			case "load" :
				
				break;
		}
	}
});
/*###########################################################################
################################################################### DOC READY  
###########################################################################*/
$(function() {
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– EXTEND UTILS
	// on jquery
	$.extend({
		// get query params
		urlQ:function(name) {
			var results = new RegExp('[\\?&]'+name+'=([^&#]*)').exec(window.location.href);
			if (!results) { return 0; }
			return results[1] || 0;
		},
		// size panels to fit window height
		fit:function() {
			$(".panel").each(function(i) {
				var h = $(window).height() - 75;
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
		// get true mouse position
		mouse:function(e) {
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
		}
	});
	// on jquery objects
	$.fn.extend({  });
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– DOC SETUP
	// define console to avoid errors when console isn't available
	if(!window.console) window.console = { log:function(){} };
	// set window and resizes
	$(window).resize(function() { $.fit(); }); $.fit();
	// resize panels
	$(".handle > div > img").bind("mousedown",function(e) {
		// prevent image drag behavior
		if(e.preventDefault) e.preventDefault();
		// save references
		var _this = this;
		var pan = this.parentNode.parentNode.parentNode;
		var handle = this.parentNode.parentNode;
		var pan_w_orig = $(pan).width();
		var mouse_orig = $.mouse();
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
					var mouse = $.mouse();
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
				});
			} else {
				// get margin and sibling
				var main_m_orig = parseInt($(main).css("margin-right"));
				var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.lastElementChild;
				var sib_w_orig = $(sib).width();
				// bind mouse move
				$(document).bind("mousemove",function(e) {
					// get mouse position
					var mouse = $.mouse();
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
				});
			}
		} else { // panel-left
			// get sibling
			var sib = this.parentNode.parentNode.parentNode.previousElementSibling;
			var sib_w_orig = $(sib).width();
			// bind mouse move
			$(document).bind("mousemove",function(e) {
				// get mouse position
				var mouse = $.mouse();
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
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– MINE DATA
	var doc = new Document();
	doc.load(__key__);
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– BUILD DOC
	
	
	// $.ajax({
	// 	type:"GET",
	// 	url:"http://phylobox.appspot.com/api/lookup",
	// 	data:"k=tmp-phylobox-1-0-93764e1e-00ba-4c3d-9911-10b2b07ddb64",
	// 	//dataType:"json",
	// 	complete:function(request) { },
	// 	success:function(json) { console.log(json); },
	// 	error:function(e) { console.log(e.responseText); }
	// });*/
	// // make the scene
	// var scene = new Scene3D(12,"tree-canvas","body",false,true);
	// // make a tree
	// var tree = new Tree(phylojson);
	// //var tree = new Tree(amphibian.tree,amphibian.root);
	// //var tree = new Tree(unknown.tree,unknown.root);
	// tree.scene(scene);
	// 
	// // temp
	// if(typeof tree.environment().viewmode == "string") tree.environment().viewmode = 0;
	// 
	// tree.plot(tree.environment().viewmode);
	// //tree.plot(Tree.SMOOTH_DENDROGRAM);
	// //tree.plot(Tree.CLADOGRAM);
	//     
	//     $(window).resize(function(){
	//         //scene.height($(this).height());
	//         //scene.width($(this).width());
	//         //console.log(scene.height());
	//         //scene = Scene3D(12,"tree-canvas","body",false,true);
	//         //tree.scene(scene);
	//         //tree.plot(tree.environment().viewmode);
	//     });
	
	
	

    //$('#tree-canvas').attr('width',$('body').width()*(0.56));

    // lookup method can also take a callback variable, get or post
    // Full URL: http://phylobox.appspot.com/lookup
    // var url = "/lookup";
    // var parameters = {'k': key};
    // 
    // method = key.substring(0,3);
    // $.post(url,parameters,function(pj) { 
    //     phylojson = JSON.parse(pj);
    //     rootId = phylojson['environment']['root'];
    //     // Setup any dependent UI elements
    // 
    //     for(var x in phylojson.tree) {
    //         var node = phylojson.tree[x];
    //         var id = node['id'];
    //         var newli = $(document.createElement('li'));
    //         $(newli).attr('id',id);
    //         $(newli).css('color', "#"+node['color']);
    //         var inner="<span class='inline-sub'>"+id+"</span>";
    //         if (node['name']){
    //             inner = inner+"| <a>"+node['name']+"</a>";
    //         }
    //         if (node['taxonomy']){
    //             for (var i in node['taxonomy']){
    //                 var t = node['taxonomy'][i];
    //                 inner = inner+"| <a>"+t+"</a>";
    //             }
    //         }
    //         if(node['children']){
    //             inner = "<span class='inline-sub'>HTU</span>|"+inner;
    //             inner = "<div class='node' id='inner-"+id+"'>"+inner+"</div>";
    //             $(newli).html(inner);
    //             $("#treenodes").append(newli);
    //         } else {
    //             inner = "<div class='node' id='"+id+"'>"+inner+"</div>";
    //             $(newli).html(inner);
    //             //$(newli).click(function (){ NodeListClick(id);} );
    //             $("#treenodes").prepend(newli);
    //         }
    // 
    //          if (node['uri']){
    //             for (var key in node['uri']){
    //                 uriTypes[key] = false;
    //             }
    //          }
    //     }
    // 
    //     //$('#BackgroundColor').val("#"+phylojson['environment']['color']);
    //     if (phylojson.environment.color) $('#PhyloBoxBody').css({'background':"#"+phylojson.environment.color,'background-color':"#"+phylojson.environment.color});
    // 
    //     if(phylojson['title']) $('#ProjectTitle').val(phylojson['title']);
    // 
    //     //setup node list search capabilities
    //     $('#nodeq').liveUpdate('#treenodes').focus();
    // 
    //     //setup branch width selecter
    //     $('#branch_width').html(phylojson['environment']['width']);
    //     $('.branch_width_slider').slider('value',[phylojson['environment']['width']]);
    // 
    //     //setup node radius selecter
    //     $('#node_radius').html(phylojson['environment']['radius']);
    //     $('.node_radius_slider').slider('value',[phylojson['environment']['radius']]);
    // 
    //     InitDraw();
    //     
    //     for (uri in uriTypes){
    //         $('#primaryURI').append("<option value='"+uri+"'>"+uri+"</option>");
    //     }
    // });
	
	
	
	
	
	
	
	
});
//####################################################################### END