/*--------------------------------------------------------------------------.
|  Software: PhyloJSON Viewer		                                  		|
|   Version: 0.4                                                            |
|   Contact: sander@digijoi.com || andrewxhill@gmail.com					|                
| ------------------------------------------------------------------------- |
|     Admin: Andrew Hill (project admininistrator)                          |
|   Authors: Sander Pick, Andrew Hill                      			       	|                     
| ------------------------------------------------------------------------- |
|   License: Distributed under the General Public License (GPL)             |
|            http://www.gnu.org/licenses/licenses.html#GPL                  |
| This program is distributed in the hope that it will be useful - WITHOUT  |
| ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or     |
| FITNESS FOR A PARTICULAR PURPOSE.                                         |
'--------------------------------------------------------------------------*/
/*###########################################################################
############################################################# CLASS FRAMEWORK  
###########################################################################*/
// Inspired by base2 and Prototype - John Resig
(function() {
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	this.Class = function(){};
	Class.extend = function(prop) {
    	var _super = this.prototype;
    	initializing = true;
    	var prototype = new this();
    	initializing = false;
    	for(var name in prop) {
      		prototype[name] = typeof prop[name] == "function" &&
        	typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        	(function(name, fn){
          		return function() {
            		var tmp = this._super;
            		this._super = _super[name];
            		var ret = fn.apply(this, arguments);       
            		this._super = tmp;
            		return ret;
          		};
        	})(name, prop[name]) :
        	prop[name];
    	}
		function Class() {
      		if(!initializing && this.init) this.init.apply(this, arguments);
    	}
    	Class.prototype = prototype;
    	Class.constructor = Class;
    	Class.extend = arguments.callee;
    	return Class;
	};
})();
/*###########################################################################
################################################################## TREE TOOLS
###########################################################################*/
var TreeTools = Class.extend({ // Scene carries instances of this Class
	// private vars
    // lastX,lastY are click location, (firstX,firstY can be used later to reconstruct movement)
     _cid:null, _firstM:{x:null,y:null}, _lastM:{x:null,y:null}, _padding:4, // padding is clickable area radius
    // constructor 
	init:function(cid) {
    	this._cid = cid;
		// hold a reference to the current tool // *** SWP
		this._currentTool = this.handTool; // externalLink is the default
        $("#edit_tools #handTool img").css('border-bottom','2px solid grey');
        
		var __this = this;
		// set up a click listener on the canvas
    	$("#"+this._cid).mousedown(function(e) {
        	var position = $(this).position();
        	__this._firstM.x = e.pageX-position.left;
        	__this._firstM.y = e.pageY-position.top; 
    	});
    	// set up a click listener on the canvas
    	$("#"+this._cid).mouseup(function(e) {
        	var position = $(this).position();
            __this._lastM.x = e.pageX-position.left;
            __this._lastM.y = e.pageY-position.top; 
        });
        
        $('#edit_tools .tool').click(function() {
        $('.tool img').css('border','0px');
            $(this).children('img').css('border-bottom','2px solid grey');
            var tool = this.id;
            // calculate coordinates
            switch(tool) {
                case "handTool" : default :
                    __this._currentTool = __this.handTool;
                    break;
                case "toggleClade" :
                    __this._currentTool = __this.toggleClade;
                    break;
                case "editMetadata" : 
                    __this._currentTool = __this.editMetadata;
                    break;
                case "paintNodes" : 
                    __this._currentTool = __this.paintNodes;
                    break;
                case "externalLink" :
                    __this._currentTool = __this.externalLink;
                    break;
                case "changeRoot" :
                    __this._currentTool = __this.changeRoot;
                    break;
            }
        });
    },
    handTool:function(node) {
		console.log(node);
        // the real hand tool should be defined elsewhere,
        // but we can still include it here so errors aren't passed
        // if the handtool is selected
        return true;
    },
    toggleClade:function(node) {
		//console.log("The toggle tool is manipulating node #"+node.id()+" !");
        if(!node.isLeaf()){
            var vis;
            (!node.children()[0].visibility()) ? vis=true : vis=false;
            function walkTree(n,vis){
                for (var c in n.children()) {
                    child = n.children()[c];
                    child.visibility(vis);
                    walkTree(child,vis);
                }
            }
            walkTree(node,vis);
        }
    },
    editMetadata:function(node) {
		console.log("The hand tool is manipulating node #"+node.id()+" !");
    },
    paintNodes:function(node) {
        var color = $('#colornode').val();
        node.color(color);
        //also change the color of the node in our taxalist
        $("li#"+node.id()).css("color","#"+color);
        function paintCascade(node) {
            if (node.children()) {
                for (var i in node.children()) {
                    var child = node.children()[i];
                    child.color(color);
                    $("li#"+child.id()).css("color","#"+color);
                    paintCascade(child);
                }
            }
        }
        paintCascade(node);
    },
    externalLink:function(node) { // **** SWP modified this, i think this is the intended function, but double check... i was getting syntax errors
        // get the primaryuri value, not sure where this will be in the future
        var type = $('#primaryURI').val();
        if(node.uri()){
            if(node.uri()[type]) {
                // alert(Nodes[nodeId]['uri'][uri]);
                window.open(node.uri()[type],'_blank');
            }
        }
	},
    changeRoot:function(node,tree) { // **** SWP modified this, i think this is the intended function, but double check... i was getting syntax errors
        tree.nest(node.id());
        tree.plot(Tree.DENDROGRAM);
    },
	currentTool:function(v,t) { (this._currentTool)(v,t); }, // **** SWP calls the current tool function
	// get and set vars
	firstM:function() { return this._firstM; },
	lastM:function() { return this._lastM; },
	padding:function() { return this._padding; },
});
/*###########################################################################
################################################################## ENV TOOLS
###########################################################################*/
var EnvTools = Class.extend({ // Tree carries instances of this Class
	// private vars
    _env:null,
    // how to change the tree.title variable?
	// constructor
	init:function(env) {
        this._env = env;
		var __this = this;
        //set listener for background color
        $('#background_color').change(function() {
        	__this._env.color = $(this).val(); // **** SWP changes this and others like it (this._env is a regular object)
            $('#PhyloBoxBody').css({'background':"#"+$(this).val(),'background-color':"#"+$(this).val()});
            //console.log($(this).val());
        });
        // set listener for bwidth, see imported jquery ui libraries
        // needs a few of them in the head of any current phylobox viewer page
        // will create a envtools-min.js for the widget so that we don't get
        // errors for not loading those libraries
        //$(function() { // SWP <<--------------------------- I dont think you need to do this ... any instance of this class will be created after InitDraw, which should only run after doc ready.
        //<<<<<<<<<<<<<<<<<<<<<<<<<<<<======== comment for SWP development ========// ( slider is not defined on my system... )
		
        //viewtype toggle selector
        if(!__this._env.viewmode){__this._env.viewmode='dendrogram'};
		//======== for SWP development ========>>>>>>>>>>>>>>>>>>>>>>>>>//
        //});
        // track viewtype changes
        $('#view_type').change(function() {
            __this._env.viewtype = $(this).val();
        });

    }
});
/*###########################################################################
#################################################################### POINT 3D  
###########################################################################*/
var Point3D = Class.extend({
	// private vars
	_fl:2000, _vpx:0, _vpy:0, _cx:0, _cy:0, _cz:0, _x:0, _y:0, _z:0,
	// constructor
	init:function(pX,pY,pZ) {
		this._x = pX;
		this._y = pY;
		this._z = pZ;
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
	fl:function(v) { if(v) this._fl = v; else return this._fl; },
	x:function(v) { if(v) this._x = v; else return this._x; },
	y:function(v) { if(v) this._y = v; else return this._y; },
	z:function(v) { if(v) this._z = v; else return this._z; },
	r:function() { return Math.sqrt((this._x * this._x) + (this._y * this._y)); },
	t:function() { return Math.atan(this._y / this._x); }
});
/*###########################################################################
################################################################# Node Lable  
###########################################################################*/
var NodeLabel = Class.extend({
	// private vars -- dynamic
	// constructor
    //AWH added, meant to add labels to the tree. should be controlled by the nodelabels toggle
	init:function(pA,label,node) {
		this._pointA = pA; 
        this._label = label;
        this._node = node;
        this._isLeaf = node.isLeaf();
        this._color = "F0F0F0";
	},
	draw:function(ctx,mode) {
        if (this._node.visibility()){
            var lightFactor = this._getLightFactor();
            ctx.beginPath();
            ctx.fillStyle = "#"+_this._color;
            ctx.globalAlpha = lightFactor;
            ctx.fillText(this._label,this._pointA.screenX()+10,this._pointA.screenY()+10);
            ctx.fill();
            
        }
	},
	_getLightFactor:function() {
		// generate light factor
		return 1;//Math.abs(1 / this.depth())*100;
	},
	// get & set vars
	pointA:function() { return this._pointA; },
	//depth:function() { return Math.min(this._pointA.z(),this._pointB.z()); },
	color:function(v) { if(v) this._color = v; else return this._color; },
	label:function(v) { if(v) this._color = v; else return this._color; },
});
/*###########################################################################
################################################################# Branch Lable  
###########################################################################*/
var BranchLabel = Class.extend({
	// private vars -- dynamic
	// constructor
    //AWH added, meant to add branch labels to the tree. should be controlled by the branchlabels toggle
	init:function(pA,label,node) {
		this._pointA = pA; 
        this._label = label;
        this._node = node;
        this._isLeaf = node.isLeaf();
        this._color = "F0F0F0";
	},
	draw:function(ctx,mode) {
        if (this._node.visibility()){
            var lightFactor = this._getLightFactor();
            ctx.beginPath();
            ctx.fillStyle = "#"+_this._color;
            ctx.globalAlpha = lightFactor;
            ctx.fillText(this._label,this._pointA.screenX()+10,this._pointA.screenY()+10);
            ctx.fill();
            
        }
	},
	_getLightFactor:function() {
		// generate light factor
		return 1;//Math.abs(1 / this.depth())*100;
	},
	// get & set vars
	pointA:function() { return this._pointA; },
	//depth:function() { return Math.min(this._pointA.z(),this._pointB.z()); },
	color:function(v) { if(v) this._color = v; else return this._color; },
	label:function(v) { if(v) this._color = v; else return this._color; },
});
/*###########################################################################
####################################################################### DOT  
###########################################################################*/
var Dot = Class.extend({
	// private vars -- dynamic
	// constructor
	init:function(pA,node,env) {
		this._pointA = pA; 
        this._env = env;
        this._node = node; //this will auto update if we send the Dot( the whole node
		/*this._radiusA = pR;*/ // **** AWH added radius
	},
	draw:function(ctx,mode) {
        if (this._node.visibility()){
            //console.log(this._pointA);
            // get color
            var lightFactor = this._getLightFactor();
            // set styles
            //ctx.fillStyle = "rgba("+this._color[0]+","+this._color[1]+","+this._color[2]+","+lightFactor+")";
            
            ctx.fillStyle = "#"+this._node.color();
            ctx.globalAlpha = lightFactor;
            // draw the line
            ctx.beginPath();
            ctx.arc(this._pointA.screenX(),this._pointA.screenY(),this._env.radius,0,2*Math.PI,false);
            ctx.fill();
        }
	},
	_getLightFactor:function() {
		// generate light factor
		return 1;//Math.abs(1 / this.depth())*100;
	},
	// get & set vars
	pointA:function() { return this._pointA; },
	//depth:function() { return Math.min(this._pointA.z(),this._pointB.z()); },
	color:function(v) { if(v) this._color = v; else return this._color; },
});
/*###########################################################################
######################################################################## LINE  
###########################################################################*/
var Line = Class.extend({
	// private vars -- dynamic
	// constructor
	init:function(pA,pB,pC,gap,node,env) { //awh bring in the environment for the width/shape
		this._pointA = pA;
		this._pointB = pB;
		
		//color is defined by the child
        this._node = node;
        this._env = env;
		
		// **** SWP added calcs		
		if(pC) {
			this._pointC = pC;
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
			var off = gap * 0.05;
			//////////// cp 1
			// make 2 points to define a line
			var p1 = {};
			//p1.x = this._pointA.x() + Math.abs(this._pointA.x()) * 0.15;
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
			// find intersection (distance along line)
			var u1 = (un.x * v1.x + un.y * v1.y + un.z * v1.z) / (un.x * v2.x + un.y * v2.y + un.z * v2.z);
			// make the control point
			var cp1 = {};
			cp1.x = p1.x + u1*v2.x;
			cp1.y = p1.y + u1*v2.y;
			cp1.z = p1.z + u1*v2.z;
			this._controlP1 = new Point3D(cp1.x,cp1.y,cp1.z);
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
			// find intersection (distance along line)
			var u2 = (un.x * v3.x + un.y * v3.y + un.z * v3.z) / (un.x * v4.x + un.y * v4.y + un.z * v4.z);
			// make the control point
			var cp2 = {};
			cp2.x = p3.x + u2*v4.x;
			cp2.y = p3.y + u2*v4.y;
			cp2.z = p3.z + u2*v4.z;
			this._controlP2 = new Point3D(cp2.x,cp2.y,cp2.z);
		} else {
			this._controlP1 = new Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z());
			this._controlP2 = new Point3D(this._pointA.x(),this._pointA.y(),this._pointA.z());
		}
	},
	draw:function(ctx,type) {
        if(this._node.visibility()) {
            // get color
            var lightFactor = this._getLightFactor();
            // set styles
            //ctx.strokeStyle = "rgba("+this._color[0]+","+this._color[1]+","+this._color[2]+","+lightFactor+")";
            ctx.strokeStyle = "#"+this._node.color();
            ctx.globalAlpha = lightFactor;
            // draw the line
            // AWH added line width
            ctx.lineWidth  = this._env.width;
            
            ctx.beginPath();
            ctx.moveTo(this._pointA.screenX(),this._pointA.screenY());
            switch(type) {
				case 0 : default : //"dendrogram" :
					ctx.lineTo(this._controlP1.screenX(),this._controlP1.screenY());
					ctx.lineTo(this._controlP2.screenX(),this._controlP2.screenY());
					ctx.lineTo(this._pointB.screenX(),this._pointB.screenY());
					break;
				case 1 ://"smooth dendrogram" :
					ctx.bezierCurveTo(this._controlP1.screenX(),this._controlP1.screenY(),this._controlP2.screenX(),this._controlP2.screenY(),this._pointB.screenX(),this._pointB.screenY());
					break;
				case 2 ://"cladogram" :
					ctx.lineTo(this._pointB.screenX(),this._pointB.screenY());
					break;
				//default : console.log(type+" view mode is not yet supported :("); break;
			}
			ctx.stroke();
            
            //awh added a small circle of radius = 1/2 width so that where branches meet there is a nice cirve not jagged edges
            //ctx.closePath();
            ctx.beginPath();
            ctx.lineWidth  = 1;
            ctx.arc(this._pointA.screenX(),this._pointA.screenY(),this._env.width*0.45, 0, Math.PI*2, true);
            ctx.fill();
            ctx.stroke();
        }
	},
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
	color:function(v) { if(v) this._color = v; else return this._color; },
});
/*###########################################################################
#################################################################### SCENE 3D 
###########################################################################*/
var Scene3D = Class.extend({
	// private vars
	_vpx:0, _vpy:0, _cx:0, _cy:0, _cz:0, _dx:0, _dy:0, _dz:0, _ax:0.001, _ay:0.001, _az:0.001, _viewmode:0,
	// constructor
	init:function(fr,ctxid,holder,single,full,pW,pH) { // **** AWH added ctxid **** SWP removed padding, added TreeTools
		// setup canvas
		this._delay = 1000 / fr;
        //if(!$("#"+ctxid).width()){
        //    this._width = (!full) ? pW : $(window).width();
        //    this._height = (!full) ? pH : $(window).height();
        //} else {
        this._width = (!full) ? pW : $("#"+ctxid).width();
        this._height = (!full) ? pH : $("#"+ctxid).height();
        
		this._vpx = this._width / 2;
		this._vpy = this._height / 2;
		this._cx = 0;
		this._cy = 0;
		this._holder = holder;
        // **** AWH changed this from random to assigned
		this._id = ctxid;
		this._single = single;
        // **** AWH removed this, canvas exists
		// add to document
		//$(this._holder).append("<canvas width='"+this._width+"' height='"+this._height+"' id='"+this._id+"'></canvas>"); //======== uncomment for SWP development ========//
        // **** AWH changed this to reflect the new canvas id assignment
        // get context
		this._ctx = $("#"+this._id)[0].getContext('2d');
		// make a toolbox for this scene
		this._tools = new TreeTools(this._id);
		// window resize on full
		/* added all the below besides __this = this to enable keyboard functions */
        this._shiftdown = false;
        this._ctrldown = false;
		var __this = this;
        
		$(window).bind("keydown",function(e) {
            if (!e) var e = window.event;
            var code = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
            if(code==16) __this._shiftdown=true;
            else if(__this._shiftdown){
                if(code==40) __this._dy=__this._dy+20;
                else if(code==38) __this._dy=__this._dy-20;
                else if(code==37) __this._dx=__this._dx-20;
                else if(code==39) __this._dx=__this._dx+20;
				//switch view mode
				else if(code==86) __this._viewmode = __this._viewmode < 2 ? __this._viewmode + 1 : 0;
            } 
			else {
                //spin the tree if arrows are being hit
                if(code==40) __this._ax=__this._ax-0.005;
                else if(code==38) __this._ax=__this._ax+0.005;
                else if(code==37) __this._ay=__this._ay-0.005;
                else if(code==39) __this._ay=__this._ay+0.005;
                
                //zoom the tree if bzuttons are being hit
                else if(code==65) __this._cz=__this._cz-500.0;
                else if(code==90) __this._cz=__this._cz+500.0;
                
                //spin tree about z if 
                else if(code==188) __this._az=__this._az+0.005;
                else if(code==190) __this._az=__this._az-0.005;
            }
            return true;
        });
        $(window).bind("keyup",function(e) {
            if (!e) var e = window.event;
            var code = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
            if(code==16) __this._shiftdown=false;
            __this._dy=0; __this._dy=0; __this._dx=0; __this._dx=0; __this._dx=0;
        });
		// hide
		$("#"+this._id).hide();
		// begin
		this._renderables = [];
		if(!this._single) this._initializeRendering();
		// show
		$("#"+this._id).fadeIn("slow");
	},
	addToRenderList:function(objs) {
		for(obj in objs) {
			objs[obj].setVp(this._vpx,this._vpy);
			objs[obj].setCp(this._cx,this._cy,this._cz);
			objs[obj].ctx(this._ctx);
			this._renderables.push(objs[obj]);
		}
		if(this._single) { this._update(); this._render(); }
	},
	removeFromRenderList:function(obj) {
		this._renderables.splice(this._renderables.indexOf(obj),1);
	},
	setVp:function(vpx,vpy) {
		this._vpx = vpx;
		this._vpy = vpy;
		// set vanishing point on all targets
		for(r in this._renderables) this._renderables[r].setVp(this._vpx, this._vpy);
	},
	setCp:function(cx,cy,cz) {
		this._cx = cx;
		this._cy = cy;
		this._cz = cz;
		// set center point on all targets
		for(r in this._renderables) this._renderables[r].setCp(this._cx, this._cy, this._cz);
	},	
	_initializeRendering:function() {
		// define scope for timer
		var __this = this;
		// begin frame rendering
		this._intID = setInterval(__enterFrameHandler,this._delay);
		// define timer handler
		function __enterFrameHandler() { __this._update(); __this._render(); };
	},
	_update:function() {
        //this._renderables[r]._environment.angvel.x = this._ax;
        //this._renderables[r]._environment.angvel.y = this._ay;
        //this._renderables[r]._environment.angvel.z = this._az;
        //this._renderables[r]._environment.offset.dx = this._dx;
        //this._renderables[r]._environment.offset.dy = this._dy;
        //this._renderables[r]._environment.offset.dz = this._dz;
        
		for(r in this._renderables) {
			this._renderables[r].setVp(this._vpx, this._vpy);
			this._renderables[r].setCp(this._cx, this._cy, this._cz);
			this._renderables[r].update({dx:this._dx, dy:this._dy, dz:this._dz, ax:this._ax, ay:this._ay, az:this._az});
		}
	},
	_render:function() {// Check for mouse up over all scene nodes
        // background color can only be set by one of the trees in the renderables
        // for now I just grab the first tree and pull the env color
        // will work since we are only disp one tree at the mo.
        if(this._renderables.length>0) this._ctx.fillStyle = "#"+this._renderables[0]._environment.color;
        // also changed this to fillRect not clearRect to add color
		this._ctx.globalAlpha = 1;
		this._ctx.fillRect(0,0,this._width,this._height);
		
		this._ctx.lineWidth = 0.5;
		this._ctx.lineJoin = "round";
		for(r in this._renderables) this._renderables[r].render(this._viewmode);
		// check for click on nodes
		if(this._tools.lastM().x && this._tools.lastM().y) {
			var xu = this._tools.lastM().x + this._tools.padding();
			var xl = this._tools.lastM().x - this._tools.padding();
			var yu = this._tools.lastM().y + this._tools.padding();
			var yl = this._tools.lastM().y - this._tools.padding();
			for(r in this._renderables) {
				for(n in this._renderables[r].nodeList()) {
					if(this._renderables[r].nodeList()[n].point3D().screenX()<xu 
						&& this._renderables[r].nodeList()[n].point3D().screenX()>xl
						&& this._renderables[r].nodeList()[n].point3D().screenY()<yu 
						&& this._renderables[r].nodeList()[n].point3D().screenY()>yl
					) this._tools.currentTool(this._renderables[r].nodeList()[n],this._renderables[r]);
				}
			}
		}
		this._tools.lastM().x = null;
		this._tools.lastM().y = null;
	},
	// get & set vars
	fr:function(v) {
		if(v) {
			this._delay = 1000 / v;
			clearTimeout(this._intID);
			this._initializeRendering();
		} else return 1000 / this._delay;
	},
	vpx:function(v) { if(v) this._vpx = v; else return this._vpx; },
	vpy:function(v) { if(v) this._vpy = v; else return this._vpy; },
	cx:function(v) { if(v) this._cx = v; else return this._cx; },
	cy:function(v) { if(v) this._cy = v; else return this._cy; },
	cz:function(v) { if(v) this._cz = v; else return this._cz; },
	dx:function(v) { if(v) this._dx = v; else return this._dx; },
	dy:function(v) { if(v) this._dy = v; else return this._dy; },
	dz:function(v) { if(v) this._dz = v; else return this._dz; },
	ax:function(v) { if(v) this._ax = v; else return this._ax; },
	ay:function(v) { if(v) this._ay = v; else return this._ay; },
	az:function(v) { if(v) this._az = v; else return this._az; },
	width:function() { return this._width; },
	height:function() { return this._height; },
	viewmode:function(v) { if(v===undefined) return this._viewmode; else this._viewmode = v; },
	
});
/*###########################################################################
######################################################################## NODE
###########################################################################*/
var Node = Class.extend({
	// private vars
	_numParents:0, _layer:0, _isLeaf:false, _isRoot:false,
	// constructor
	init:function(id) { this._id = id; this._children = []; this._siblings = []; },
	addChild:function(v) { this._children.push(v); },
	// get & set vars
	id:function() { return this._id; },
	children:function() { return this._children; },
	siblings:function(v) { if(v) this._siblings = v; else return this._siblings; },
	numChildren:function() { return this._children.length; },
	numSiblings:function() { return this._siblings.length; },
	numParents:function(v) { if(v) this._numParents = v; else return this._numParents; },
	layer:function(v) { if(v) this._layer = v; else return this._layer; },
	isLeaf:function(v) { if(v) this._isLeaf = v; else return this._isLeaf; },
	isRoot:function(v) { if(v) this._isRoot = v; else return this._isRoot; },
	color:function(v) { if(v) this._color = v; else return this._color; },
	uri:function(v) { if(v) this._uri = v; else return this._uri; },
	visibility:function(v) { if(v===undefined) return this._visibility; else this._visibility = v; },
	length:function(v) { if(v===undefined) return this._length; else this._length = v; },
	//–––––––––––––––––––––– for drawing ––––––––––––––––––––––//
	// private vars -- none
	point3D:function(v) { if(v) this._point3D = v; else return this._point3D; }
});
/*###########################################################################
######################################################################## TREE 
###########################################################################*/
var Tree = Class.extend({
	// private vars -- dynamic
	// constructor
	init:function(json) {
		// store original data
		this._json = json;
		
        this.title = this._json.title;
        
		var __this = this;
        
        //Title input and change
        $('#ProjectTitle').change(function(){
            __this.title = $(this).val();
        });

		// nest this tree around the root
		var ir = (this._json.environment.root) ? this._json.environment.root : (this._json.root) ? this._json.root : this._json.tree[0].id;
		this.nest(ir);
	},
	_nest:function(rootId) {
		// define the root node
		//if(!rootId) rootId = this._flat[0].id;
		// get the root json object
		var root = $.lookUp(this._flat,"id",rootId);
		// exit if invalid
		if(!root) { console.log("invalid tree root id"); return false; }
		// ensure proper tree direction
		if(root.parent_id) {
			// if root is leaf, root's parent becomes root
			if(!root.children) root = $.lookUp(this._flat,"id",root.parent_id);
			// parent -> child
			root.children.push({ "id":root.parent_id });
			// child -> parent
			var parent = $.lookUp(this._flat,"id",root.parent_id);
			for(c in parent.children) if(parent.children[c].id==root.id) parent.children.splice(parent.children.indexOf(parent.children[c]),1);
			//for(c in parent.children) if(parent.children[c].id==root.id) delete parent.children[c];
			if(parent.children.length==0) parent.children = null;
			// rename parents
			root.parent_id = null;
			parent.parent_id = root.id;
		}
		// make the tree
		this._numLeaves = 0;
		this._numLayers = 0;
		this._nodeList = [];
		this._nodes = new Node(rootId);
		this._nodes.isRoot(true);
		this._branch(this._nodes,root);
		for(n in this._nodeList) {
			// assign layers
			if(this._nodeList[n].isLeaf()) this._nodeList[n].layer(this._numLayers-1);
			else this._nodeList[n].layer(this._nodeList[n].numParents());
			// assign siblings
			for(c in this._nodeList[n].children()) {
				var s = this._nodeList[n].children().slice(0);
				s.splice(s.indexOf(s[c]),1);
				this._nodeList[n].children()[c].siblings(s);
			}
		}
	},
	_branch:function(n,d) {
		// ensure proper tree direction
		for(c in d.children) {
			if(!d.children[c]) continue;
			var cd = $.lookUp(this._flat,"id",d.children[c].id);
			//if(cd.parent_id && cd.parent_id!=d.id) {
			if(cd.parent_id!=d.id) {
				// parent -> child
				cd.children.push({ "id":cd.parent_id });
				// child -> parent
				var cpd = $.lookUp(this._flat,"id",cd.parent_id);
				for(cc in cpd.children) if(cpd.children[cc].id==cd.id) cpd.children.splice(cpd.children.indexOf(cpd.children[cc]),1);
				//for(cc in cpd.children) if(cpd.children[cc].id==cd.id) delete cpd.children[cc];
				if(cpd.children.length==0) cpd.children = null;
				// rename parents
				cd.parent_id = d.id;
				cpd.parent_id = cd.id;
			}
		}
		
        //awh, not sure if logical place, but adds some extra variables to the node
        n.color(d.color);
        n.visibility(d.visibility);
        n.uri(d.uri);
		//n.length()
        
		// move down tree
		if(!d.children) {
			n.isLeaf(true);
			this._numLeaves++;
		} else for(c in d.children) {
			if(!d.children[c]) continue;
			var cn = new Node(d.children[c].id);
			n.addChild(cn);
			//cn.parent(n);
			cn.numParents(n.numParents()+1);
			this._branch(cn,$.lookUp(this._flat,"id",cn.id()));
		}
		// max number parents = tree's layer count
		if(this._numLayers<=n.numParents()) this._numLayers = n.numParents()+1;
		// collect node ref for list
		this._nodeList.push(n);
	},
	nest:function(v) { // Adds EnvTools which gets overwritten on each nest().
		// clear from scene
		if(this._scene) this._scene.removeFromRenderList(this);
		// clone the original data
		this._clone = $.extend(true,{},this._json);
		// define usable objects
		this._flat = this._clone.tree;
		this._environment = this._clone.environment;
		this._environment.root = v;
		// make env tools
		this._tools = new EnvTools(this._environment);
		// re-nest
		this._nest(v);
		console.log(this._nodeList.length);
	},
	// get & set vars
	nodes:function() { return this._nodes; },
	nodeList:function() { return this._nodeList; },
	numLayers:function(v) { if(v) this._numLayers = v; else return this._numLayers; },
	//–––––––––––––––––––––– for drawing ––––––––––––––––––––––//
	// private vars
	plot:function(type) {
		this._type = type;
		// refresh data
		this._l = [];
		this._d = [];
		this._cp = [];
		// parse on layer
		var nls = [];
		for(i=0;i<this._numLayers;i++) nls.push([]);
		for(n in this._nodeList) nls[this._nodeList[n].layer()].push(this._nodeList[n]);
		nls.reverse();
		// calculate coordinates
		switch(this._type) {
			case 0 : default :
				var gap_x = this._scene.width() / (this._numLayers - 1);
				var gap_y = this._scene.height() / (this._numLeaves - 1);
				this._max_z = (this._numLayers - 1) * gap_x;
				var j = 0;
				for(l in nls) {
					// sort leaf order
					//if(l==this._numLayers-1) { nls[l].sort(function(a,b) { return a.numParents() - b.numParents(); }); }
					for(n in nls[l]) {
						var x = (nls[l][n].layer() * gap_x) - this._scene.vpx();
						if(nls[l][n].isLeaf()) {
							var y = (j * gap_y) - this._scene.vpy(); j++;
						} else {
							//nls[l][n].children().sort(function(a,b) { return b.point3D().y() - a.point3D().y(); });
							var max_y = nls[l][n].children()[0].point3D().y();
							var min_y = nls[l][n].children()[nls[l][n].numChildren()-1].point3D().y();
							var y = min_y + ((max_y - min_y) / 2);
						}
						var z = (nls[l][n].numParents() * gap_x) - (this._max_z / 2);
                        nls[l][n].point3D(new Point3D(x,y,z));
					}
				}
				this._gap = gap_x;
				break;
			case 3 : case 4 : case 5 :
				var gap_r = Math.min(this._scene.width(),this._scene.height()) / (this._numLayers - 1) / 2;
				var gap_t = 2*Math.PI / (this._numLeaves - 1);
				this._max_z = (this._numLayers - 1) * gap_r;
				var j = 0;
				for(l in nls) {
					// sort leaf order
					//if(l==this._numLayers-1) { 
						//nls[l].sort(function(a,b) { return b.numParents() - a.numParents(); }); 
					//}
					for(n in nls[l]) {
						var r = nls[l][n].layer() * gap_r;
						if(nls[l][n].isLeaf()) {
							var t = (j * gap_t); j++;
							var y = (r * Math.sin(t));
						} else {
							//nls[l][n].children().sort(function(a,b) { return b.point3D().t() - a.point3D().t(); });
							var max_t = nls[l][n].children()[0].point3D().t();
							var min_t = nls[l][n].children()[nls[l][n].numChildren()-1].point3D().t();
							var t = min_t + ((max_t - min_t) / 2);
							var y = (r * Math.sin(t));
							console.log(180*min_t/Math.PI,180*max_t/Math.PI);
						}
						var x = (r * Math.cos(t));
						var z = (nls[l][n].numParents() * gap_r) - (this._max_z / 2);
						//console.log(r,t,x,y);
						nls[l][n].point3D(new Point3D(x,y,z));
					}
				}
				this._gap = gap_r;
				break;		
		}
		// make dots
		//for(n in this._nodeList) this._d.push(new Dot(this._nodeList[n].point3D(),this._environment));
		for(n in this._nodeList) this._d.push(new Dot(this._nodeList[n].point3D(),this._nodeList[n],this._environment));
		// make lines
		this._connect(this._nodes);
		// display
		this._viz();
	},
	_connect:function(node) {
        for(c in node.children()) {
			var sp = node.children()[c].siblings().length > 0 ? node.children()[c].siblings()[0].point3D() : false;
            //this._l.push(new Line(node.point3D(),node.children()[c].point3D(),this._environment));
			var l = new Line(node.point3D(),node.children()[c].point3D(),sp,this._gap,node.children()[c],this._environment);
			var cp1 = l.controlP1();
			var cp2 = l.controlP2();
            this._l.push(l);
			this._cp.push(cp1);
			this._cp.push(cp2);
            this._connect(node.children()[c]);
        }
	},
	_viz:function() {
		//this._local = {dx:0,dy:0,dz:0,ax:0,ay:0,az:0};
		this._local = {dx: this._environment.offset.dx,
                       dy: this._environment.offset.dy,
                       dz: this._environment.offset.dz,
                       ax: this._environment.offset.ax,
                       ay: this._environment.offset.ay,
                       az: this._environment.offset.az};
        //console.log(this._environment);
		//this._local = {dx:0,dy:0,dz:0,ax:-Math.PI / 2,ay:Math.PI / 4,az:0};
		this._color = [ 255,255,255 ];
		// set color
        
        //awh removed these so that color can be incorporated by the node directly
		//for(d in this._d) this._d[d].color(this._color);
		//for(l in this._l) this._l[l].color(this._color);
        
		// make local update if present
		if(!$.isEmpty(this._local)) this.update(this._local);
		// add to scene
		this._scene.viewmode(this._type);
		this._scene.addToRenderList([this]);
		// zoom
		this._scene.setCp(this._scene.cx(),this._scene.cy(),this._max_z*2);
	},
	update:function(v) {
		for(d in this._d) {
		 	this._d[d].pointA().x(this._d[d].pointA().x()+v.dx);
		 	this._d[d].pointA().y(this._d[d].pointA().y()+v.dy);
		 	this._d[d].pointA().z(this._d[d].pointA().z()+v.dz);
		 	this._d[d].pointA().rotateX(v.ax);
		 	this._d[d].pointA().rotateY(v.ay);
		 	this._d[d].pointA().rotateZ(v.az);
		}
		for(cp in this._cp) {
			this._cp[cp].x(this._cp[cp].x()+v.dx);
		 	this._cp[cp].y(this._cp[cp].y()+v.dy);
		 	this._cp[cp].z(this._cp[cp].z()+v.dz);
		 	this._cp[cp].rotateX(v.ax);
		 	this._cp[cp].rotateY(v.ay);
		 	this._cp[cp].rotateZ(v.az);
		}
	},
	render:function(viewmode) {
		this._type = viewmode;
		for(d in this._d) this._d[d].draw(this._ctx);
		for(l in this._l) this._l[l].draw(this._ctx,this._type);
	},
	setVp:function(vpx,vpy) {
		this._vpx = vpx;
		this._vpy = vpy;
		// set points vanishing point
		for(d in this._d) this._d[d].pointA().setVanishingPoint(this._vpx,this._vpy);
		// set control points vanishing point
		for(cp in this._cp) this._cp[cp].setVanishingPoint(this._vpx,this._vpy);
	},
	setCp:function(cx,cy,cz) {
		this._cx = cx;
		this._cy = cy;
		this._cz = cz;
		// set points center point
		for(d in this._d) this._d[d].pointA().setCenter(this._cx,this._cy,this._cz);
		// set control points center point
		for(cp in this._cp) this._cp[cp].setCenter(this._cx,this._cy,this._cz);
	},
	depth:function() {
		var d = new Array();
		for(l in this._l) d.push(this._l[l].depth());
		return $.arrayMin(d);
	},
	// get & set vars
	scene:function(v) { if(v) this._scene = v; else return this._scene; },
	ctx:function(v) { if(v) this._ctx = v; else return this._ctx; },
	//–––––––––––––––––––––– for tools ––––––––––––––––––––––//
});
//************ Statc Properties ************//
Tree.DENDROGRAM = 0;//"dendrogram";
Tree.SMOOTH_DENDROGRAM = 1;//"smooth dendrogram";
Tree.CLADOGRAM = 2;//"cladogram";
Tree.CIRC_DENDROGRAM = 3;//"circular dendrogram";
Tree.CIRC_CLADOGRAM = 4;//"circular cladogram";
Tree.CIRC_SMOOTH_DENDROGRAM = 5;//"circular smooth dendrogram";
/*###########################################################################
################################################################### DOC READY  
###########################################################################*/
function InitDraw(canvasId) {
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– EXTEND UTILS
	// on core classes
	// ...
	// on jquery
	$.extend({
		lookUp:function(o,p,v) {
			// returns false if not unique !
			var r; var n = 0;
			for(i in o) if(o[i][p]==v) { r = o[i]; n++; }
			return (n!=1) ? false : r;
		},
		makeId:function(l) {
		    var text = "";
		    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		    for(i=0; i<l; i++) text += possible.charAt(Math.floor(Math.random()*possible.length));
		    return text;
		},
		isEmpty:function(o) {
			var e = true;
			for(a in o) e = false;
			return e;
		},
		arrayMin:function(a) {
			var min = a[0];
			var len = a.length;
			for (i=1; i<len; i++) if(a[i]<min) min = a[i];
			return min;
		},
	});
	// on jquery objects
	$.fn.extend({ });
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– DOC SETUP
	// define console to avoid errors when it isn't available
	if(!window.console) window.console = { log:function() {} };
	//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– DOC METHODS
	// ...
	//–––––––––––––––––––––––––––––––––––––––––––––––––––––––––– INIT OBJECTS
	/* get some data if present
	$.ajax({
		type:"GET",
		url:"http://phylobox.appspot.com/api/lookup",
		data:"k=tmp-phylobox-1-0-93764e1e-00ba-4c3d-9911-10b2b07ddb64",
		//dataType:"json",
		complete:function(request) { },
		success:function(json) { console.log(json); },
		error:function(e) { console.log(e.responseText); }
	});*/
	// make the scene
	var scene = new Scene3D(12,canvasId,"body",false,true);
	// make a tree
	var tree = new Tree(PHYLOBOX.globals.trees[canvasId]);
    //var tree = new Tree(amphibian.tree,amphibian.root);
	//var tree = new Tree(unknown.tree,unknown.root);
	tree.scene(scene);
	tree.plot(1);
	//tree.plot(Tree.SMOOTH_DENDROGRAM);
	//tree.plot(Tree.CLADOGRAM);
}
//####################################################################### END
//$(function() { InitDraw(); }); //======== uncomment for SWP development ========//