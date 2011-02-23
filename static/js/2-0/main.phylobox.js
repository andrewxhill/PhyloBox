/*--------------------------------------------------------------------------.
|  Software: PhyloBox                                                       |
|   Version: 2.1                                                            |
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
PhyloBox = (function ( $ ) {
	// constants
	var HOST = window.location.host,
		WIDGET = ( window.location.pathname ).split( '/' )[1] == "examples" ||
            ( HOST != "localhost:8080" && 
			HOST != "phylobox.appspot.com" && 
			HOST != "2-0.latest.phylobox.appspot.com" ),
        HOME = HOST in { "localhost:8080":'', "2-0.latest.phylobox.appspot.com/":'' } ? 
			"http://" + HOST + "/" : 
			"http://2-0.latest.phylobox.appspot.com/",
		USER;
    var API_TREE = HOME + "api/lookup/",
		API_GROUP = HOME + "api/group",
		API_NEW = HOME + "api/new",
		API_SAVE_TREE = HOME + "api/save",
		RX_URL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/,
		EXAMPLE_TREE = "http://www.phyloxml.org/examples/apaf.xml";
	// set storage
    var pbStorage = sessionStorage == null ?
        globalStorage[ location.hostname ] :
        sessionStorage;
    // private parts
/*###########################################################################
###################################################################### SYSTEM
###########################################################################*/
	var _System = function( context ) {
		// private vars
		var _context = context;
		// methods
		return {
			init: function() {
				this.browser = this.searchString( this.dataBrowser() ) || "An unknown browser";
				this.version = this.searchVersion( navigator.userAgent )
					|| this.searchVersion( navigator.appVersion )
					|| "an unknown version";
				this.OS = this.searchString( this.dataOS() ) || "an unknown OS";
			},
			searchString: function( data ) {
				for ( var i=0; i<data.length; i++ ) {
					var dataString = data[i].string,
						dataProp = data[i].prop;
					this.versionSearchString = data[i].versionSearch || data[i].identity;
					if ( dataString ) if ( dataString.indexOf(data[i].subString ) != -1 ) return data[i].identity;
					else if ( dataProp ) return data[i].identity;
				}
			},
			searchVersion: function( dataString ) {
				var index = dataString.indexOf( this.versionSearchString );
				if ( index==-1 ) return;
				return parseFloat( dataString.substring( index+this.versionSearchString.length + 1 ) );
			},
			dataBrowser: function() {
				return [
					{ string: navigator.userAgent, subString: "Chrome", identity: "Chrome" },
					{ string: navigator.userAgent, subString: "OmniWeb", versionSearch: "OmniWeb/", identity: "OmniWeb" },
					{ string: navigator.vendor, subString: "Apple", identity: "Safari", versionSearch: "Version" },
					{ string: navigator.userAgent, subString: "Opera", identity: "Opera" },
					{ string: navigator.vendor, subString: "iCab", identity: "iCab" },
					{ string: navigator.vendor, subString: "KDE", identity: "Konqueror" },
					{ string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
					{ string: navigator.vendor, subString: "Camino", identity: "Camino" },
					{ string: navigator.userAgent, subString: "Netscape", identity: "Netscape" },
					{ string: navigator.userAgent, subString: "MSIE", identity: "Explorer", versionSearch: "MSIE" },
					{ string: navigator.userAgent, subString: "Gecko", identity: "Mozilla", versionSearch: "rv" },
					{ string: navigator.userAgent, subString: "Mozilla", identity: "Netscape", versionSearch: "Mozilla" }
				];
			},
			dataOS: function() {
				return [
					{ string: navigator.platform, subString: "Win", identity: "Windows" },
					{ string: navigator.platform, subString: "Mac", identity: "Mac" },
					{ string: navigator.userAgent, subString: "iPhone", identity: "iPhone/iPod" },
					{ string: navigator.platform, subString: "Linux", identity: "Linux" }
				];
			}
		};
	};
/*###########################################################################
################################################################### INTERFACE
###########################################################################*/
	var _Interface = function( context ) {
		// private vars
		var _context = context, _inited = false;
		// size panel heights to windows
		function _fit() {
			// size panels to fit window height
			$( ".panel", _context ).each( function ( i ) {
				var h = $( window ).height() - 76;
				$( this ).height( h );
			});
			$( "section", _context ).each( function ( i ) {
				var h = this.parentNode.id != "trees" ? $( window ).height() - 111 : $( window ).height() - 101;
				$( this ).height( h );
			});
			$( ".handle > div", _context ).each( function ( i ) {
				var h = $( window ).height() - 101;
				$( this ).height( h );
			});
			$( ".handle > div > img", _context ).each( function ( i ) {
				var t = ( $( window ).height() - 125 ) / 2;
				$( this ).css( "top", t );
			});
			$( "#fancybox-overlay", _context ).each( function ( i ) {
				var h = $( window ).height();
				$( this ).height( h );
			});
			// show body if 1st time
			if ( ! _inited ) {
				_context.show();
				_inited = true;
			}
		}
		// init
		$( window ).resize( function () {
			// trigger handlers for all views
			$( document ).trigger( "pb-treeresize" );
			// fit heights
			_fit(); 
		}); _fit();
		// resize panels
		$( ".handle > div > img", _context ).bind( "mousedown", function ( e ) {
			// prevent image drag behavior
			if ( e.preventDefault ) e.preventDefault();
			// save reference
			var pan = this.parentNode.parentNode.parentNode;
			var handle = this.parentNode.parentNode;
			var pan_w_orig = $( pan ).width();
			var mouse_orig = mouse_(e);
			// detect parent panel
			if ( $( pan ).hasClass( "panel-center" ) ) {
				// get main for margins
				var main = this.parentNode.parentNode.parentNode.parentNode;
				if ( $( handle ).hasClass( "handle-left" ) ) {
					// get margin and sibling
					var main_m_orig = parseInt( $( main ).css( "margin-left" ) );
					var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.previousElementSibling.lastElementChild;
					var sib_w_orig = $( sib ).width();
					// bind mouse move
					var movehandle = function( e ) {
						// get mouse position
						var mouse = mouse_( e );
						// determine new values
						var pw = pan_w_orig - ( mouse.x - mouse_orig.x );
						var mm = main_m_orig + ( mouse.x - mouse_orig.x );
						var sw = sib_w_orig + ( mouse.x - mouse_orig.x );
						// check max width
						if ( pw < 700 || sw < 50 ) return false;
						// set widths
						$( pan ).width( pw );
						$( main ).css( "margin-left", mm );
						$( sib ).width( sw );
						// trigger handlers for all views
						$( this ).trigger( "pb-treeresize" );
					};
					$( document ).bind( "mousemove", movehandle );
				} else {
					// get margin and sibling
					var main_m_orig = parseInt( $( main ).css( "margin-right" ) );
					var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.lastElementChild;
					var sib_w_orig = $( sib ).width();
					// bind mouse move
					var movehandle = function( e ) {
						// get mouse position
						var mouse = mouse_( e );
						// determine new values
						var pw = pan_w_orig + ( mouse.x - mouse_orig.x );
						var mm = main_m_orig - ( mouse.x - mouse_orig.x );
						var sw = sib_w_orig - ( mouse.x - mouse_orig.x );
						// check max width
						if ( pw < 700 || sw < 50 ) return false;
						// set widths
						$( pan ).width( pw );
						$( main ).css( "margin-right", mm );
						$( sib ).width( sw );
						// trigger handlers for all views
						$( this ).trigger( "pb-treeresize" );
					};
					$( document ).bind( "mousemove", movehandle );
				}
			} else { // panel-left
				// get sibling
				var sib = this.parentNode.parentNode.parentNode.previousElementSibling;
				var sib_w_orig = $( sib ).width();
				// bind mouse move
				var movehandle = function( e ) {
					// get mouse position
					var mouse = mouse_( e );
					// determine new values
					var pw = pan_w_orig - ( mouse.x - mouse_orig.x );
					var sw = sib_w_orig + ( mouse.x - mouse_orig.x );
					// check max width
					if ( pw < 50 || sw < 50 ) return false;
					// set widths
					$( pan ).width( pw );
					$( sib ).width( sw );
				};
				$( document ).bind( "mousemove", movehandle );
			}
			// bind mouse up
			$( document ).bind( "mouseup", function () {
				// remove all
				$( this ).unbind( "mousemove", movehandle ).unbind( "mouseup", arguments.callee );
			});
		});
		// define console
		if ( ! window.console ) window.console = { log: function () {} };
		// methods
		return {

		};
	};
/*###########################################################################
##################################################################### SANDBOX
###########################################################################*/
	var _Sandbox = function( context, options ) {
		// private vars
		var _context = context, _options = options,
			_modules = [], _io, _trees = [], 
			_activeTree, _activeNode;
		// methods
		return {
			init: function() {
				// start io
				_io = new _IO( _context, this, API_GROUP, "json" );
				// we want this whole thingy
				return this;
			},
			register: function( m ) {
				_modules.push( m );
			},
			notify: function( type, data, flag ) {
				switch ( type ) {
					case "pb-treefocus":
						// save active tree
						_activeTree = data;
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree 
						}]);
						break;
					case "pb-treeblur":
					case "pb-treeplot":
					case "pb-treedraw":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree 
						}]);
						break;
					case "pb-treesave":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type );
						// tell anyone else who might be interested
						_context.trigger( type );
						break;
					case "pb-treepan":
					case "pb-treerotate":
					case "pb-treezoomin":
					case "pb-treezoomout":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree, 
								node: _activeNode, 
								offsets: data 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree, 
							node: _activeNode, 
							offsets: data 
						}]);
						break;
					case "pb-nodehover":
					case "pb-nodeexit":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree, 
								node: data, 
								found: flag 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree, 
							node: data 
						}]);
						break;
					case "pb-nodeclick":
						// save active node
						_activeNode = data;
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree, 
								node: _activeNode, 
								found: flag 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree, 
							node: _activeNode 
						}]);
						break;
					case "pb-clearnode":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { tree: _activeTree } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree 
						}]);
						break;
					case "pb-cladeflip":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree, 
								node: data 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree, 
							node: data 
						}]);
						break;
					case "pb-cladeflipped":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, { 
								tree: _activeTree, 
								node: data 
							});
						// tell anyone else who might be interested
						_context.trigger( type, [{ 
							tree: _activeTree, 
							node: data 
						}]);
						break;
					case "pb-reset":
						// tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type );
						// tell anyone else who might be interested
						_context.trigger( type );
						// remove refs for garbage collector
						_activeTree = _activeNode = null;
						_trees = [];
						break;
					case "pb-history-change":
					    // tell local modules
						for ( var m = 0; m < _modules.length; m++ )
							_modules[m].handle( type, data );
					    break;
					default: error_( "can't notify: invalid event type..." );
				}
			},
			load: function( data, group ) {
				// check group
				if( group ) {
					// get the tree keys from the api
					_io.request( "load", "g=" + data );
				} else {
					// create a tree type
					var t = new _Tree( this );
					// save it
					_trees.push( t );
					// set age
					t.age =  _trees.length - 1;
					// set to active
					_activeTree = t;
					// go
					t.begin( data );
                    
                    if ( ! WIDGET ) {
                        var histKey = typeof data == "string" ? data : data.k;
                        var histTitle = typeof data == "string" ? data : data.title;
                        var histUrl = 'http://' + HOST + '?k=' + histKey;
                        this.notify( "pb-history-change", [ histTitle, histUrl, '' ] );
                        //window.history.pushState('', _histTitle, _histUrl);
                    }
				}
			},
			receive: function( type, data ) {
				// do something
				switch ( type ) {
					case "load":
						// loop over trees
						for ( var k = 0; k < data.length; k++ ) {
							// create a tree type
							var t = new _Tree( this );
							// save it
							_trees.push( t );
							// set age
							t.age = _trees.length - 1;
							// set to active
							_activeTree = t;
							// go
							t.begin( data[k] );
						}
						break;
				}
			},
			saveTree: function( all ) {
				// check all
				if ( all )
					// save all trees
					for ( var t = 0; t < _trees.length; t++ )
						_trees[t].save();
				else
					// save only active
					_activeTree.save();
			},
			// gets
			get context() { return _context; },
			get options() { return _options; },
			get trees() { return _trees; },
			get activeTree() { return _activeTree; },
			get activeNode() { return _activeNode; },
            // sets
			set options( v ) { _options = v; },
		}.init();
	};
/*###########################################################################
########################################################################## IO
###########################################################################*/
	var _IO = function( x, c, s, dt, p ) {
		// private vars
		var _context, _caller, _server, _dataType, _params;
		// init
        if ( ! p ) 
			p = {  };
		if ( ! x || ! c || ! s || ! dt ) 
			return error_( "invalid arguments..." );
		_context = x, _caller = c, _server = s, _dataType = dt, _params = p;
		// methods
		return {
			// make a data request
			request: function( a, q, s ) {
				var type = WIDGET ? undefined : "POST";
					server = s || _server,
					query = WIDGET ? q + "&callback=?" : q;
                for ( var p = 0; p < _params.length; p++ )
                    query = query+'&'+p+'='+_params[p];
				$.ajax({
		  			type: type, 
					url: server, 
					data: query, 
					dataType: "json",
					complete: function( request ) {  },
					success: function( json ) {
						if ( ! json || json == 404 ) 
							return error_( "nothing received..." );
						_caller.receive( a, json );
					},
					error: function( e ) {
						return error_( e[ 'responseText' ] );
					}
		 		});
			}
		};
	};
/*###########################################################################
######################################################################## NODE
###########################################################################*/
	var _Node = function( ni ) {
		// private vars
		var _id, 
			_parent, _children = [], _siblings = [], 
			_n_parents = 0, _layer = 0, 
			_is_leaf = false, _is_root = false,
			_color, _uri, _name, _taxonomy, _visibility, _length, 
			_point3D, _selected = false, _hover = false,
			_title = "", _link;
		// init
		_id = ni;
		// methods
		return {
			// add children
			add_child: function( v ) {
				_children.push( v ); 
			},
			build_title: function() {
				if ( this.name ) _title += this.name;
				else if ( this.taxonomy )
					for ( var i = 0; i < this.taxonomy.length; i++ ) {
						if ( _title != "" ) _title += " | ";
						_title += this.taxonomy[i];
					}
				if ( this.n_children > 0 ) _title = "(HTU) " + _title;
				_title = "&mdash;&nbsp;&nbsp;" + this.id + ":&nbsp;" + _title;
			},
			// gets
			get id() { return _id; },
			get parent() { return _parent; },
			get children() { return _children; },
			get siblings() { return _siblings; },
			get n_parents() { return _n_parents; },
			get n_children() { return _children.length; },
			get n_siblings() { return _siblings.length; },
			get layer() { return _layer; },
			get is_leaf() { return _is_leaf; },
			get is_root() { return _is_root; },
			get color() { return _color; },
			get uri() { return _uri; },
			get name() { return _name; },
			get taxonomy() { return _taxonomy; },
			get visibility() { return _visibility; },
			get length() { return _length; },
			// sets
			set parent( v ) { _parent = v; },
			set siblings( v ) { _siblings = v; },
			set n_parents( v ) { _n_parents = v; },
			set layer( v ) { _layer = v; },
			set is_leaf( v ) { _is_leaf = v; },
			set is_root( v ) { _is_root = v; },
			set color( v ) { _color = v; },
			set uri( v ) { _uri = v; },
			set name( v ) { _name = v; },
			set taxonomy( v ) { _taxonomy = v; },
			set visibility( v ) { _visibility = v; },
			set length( v ) { _length = v; },
			// drawing gets
			get point3D() { return _point3D; },
			get selected() { return _selected; },
			get hover() { return _hover; },
			// misc gets
			get title() { return _title; },
			get link() { return _link; },
			// drawing sets
			set point3D( v ) { _point3D = v; },
			set selected( v ) { _selected = v; },
			set hover( v ) { _hover = v; },
			// misc sets
			set link( v ) { _link = v; }
		};
	};
/*###########################################################################
######################################################################## TREE 
###########################################################################*/
	var _Tree = function( sandbox ) {
		// private vars
		var _sandbox = sandbox,
			_key, _view, _io, _age, 
			_rid, _data = [], _data_clone = [], _tree_data = [], _node_list = [], _nodes = [],
			_n_leaves = 0, _n_layers = 0, _title, _environment,
			_renesting = false;
		// make tree object
		function _nest() {
			// root node?
			if ( ! _rid ) 
				return error_( "no root node provided for nest..." );
			// get the root json object
			var root = _find( _tree_data, "id", _rid );
			// exit if invalid
			if ( ! root )
			 	return error_( "invalid tree root id" );
			// ensure proper tree direction
			if ( root.parent_id ) {
				// if root is leaf, root's parent becomes root
				if ( ! root.children ) 
					root = _find( _tree_data, "id", root.parent_id );
				// parent -> child
				root.children.push( { "id": root.parent_id } );
				// child -> parent
				var parent = _find( _tree_data, "id", root.parent_id );
				for ( var c = 0; c < parent.children.length; c++ ) 
					if ( parent.children[c].id == root.id ) 
						parent.children.splice( parent.children.indexOf( parent.children[c] ), 1 );
				if ( parent.children.length == 0 ) 
					parent.children = null;
				// rename parents
				root.parent_id = null;
				parent.parent_id = root.id;
			}
			// make the tree
			_n_leaves = 0;
			_n_layers = 0;
			_node_list = [];
			_nodes = new _Node( _rid );
			_nodes.is_root = true;
			_branch( _nodes, root );
			// add extra properties
			for ( var n = 0; n < _node_list.length; n++ ) {
				// assign layers
				if ( _node_list[n].is_leaf ) 
					_node_list[n].layer = _n_layers - 1;
				else
					_node_list[n].layer = _node_list[n].n_parents;
				// assign siblings
				for ( var c = 0; c < _node_list[n].children.length; c++ ) {
					var s = _node_list[n].children.slice( 0 );
					s.splice( s.indexOf( s[c] ), 1 );
					_node_list[n].children[c].siblings = s;
				}
				// give it a title
				_node_list[n].build_title();
			}
		}
		// recursive branching
		function _branch( n, d ) {
			// walk node children
			if ( d.children ) {
				// check nesting mode
				if ( _renesting )
					// ensure proper tree direction
					for ( var c = 0; c < d.children.length; c++ ) {
						// get data child
						var cd = _find( _tree_data, "id", d.children[c].id );
						// check relationships
						if ( cd.parent_id != d.id ) {
							// parent -> child
							cd.children.push( { "id": cd.parent_id } );
							// child -> parent
							var cpd = _find( _tree_data, "id", cd.parent_id );
							for ( var cc = 0; cc < cpd.children.length; cc++ ) 
								if ( cpd.children[cc].id == cd.id ) 
									cpd.children.splice( cpd.children.indexOf( cpd.children[cc] ), 1 );
							if ( cpd.children.length == 0 ) cpd.children = null;
							// rename parents
							cd.parent_id = d.id;
							cpd.parent_id = cd.id;
						}
					}
				// make nodes for the children
				for ( var c = 0; c < d.children.length; c++ ) {
					// make a new node and set children / parent
					var cn = new _Node( d.children[c].id );
					n.add_child( cn );
					cn.parent = n;
					cn.n_parents = n.n_parents + 1;
					// branch the new node
					_branch( cn, _find( _tree_data, "id", cn.id ) );
				}
			// all done, we're at a leaf
			} else {
				n.is_leaf = true;
				_n_leaves ++;
			}
			// add props
			n.color = d.color;
	        n.uri = d.uri;
			if ( d.name ) 
				n.name = d.name;
	        else if ( d.taxonomy && d.taxonomy.scientific_name ) 
				n.name = d.taxonomy.scientific_name;
			n.taxonomy = d.taxonomy;
			n.visibility = d.visibility;
			n.length = d.length;
			// max number parents = tree's layer count
			if ( _n_layers <= n.n_parents ) _n_layers = n.n_parents + 1;
			// collect node ref for list
			_node_list.push( n );
		}
		// return object with unique requested property
		function _find( o, p, v ) {
			// returns false if not unique !
			var r, n = 0;
			for ( var i = 0; i < o.length; i++ ) 
				if ( o[i][p] == v ) { 
					r = o[i]; 
					n ++; 
				}
			return ( n != 1 ) ? false : r;
		}
		// init
		// ...
		// methods
		return {
			// load data if not present
			begin: function( data ) {
				// initialize io
				_io = new _IO( _sandbox.context, this, API_TREE + _sandbox.options.method, "json", _sandbox.options.params );
				// save key
	            if ( typeof data == "string" ) {
					_key = data;
					RX_URL.test( _key ) ? 
						_io.request( "load", "phyloUrl=" + _key, API_NEW ) : 
						_io.request( "load", "k=" + _key );
				} else if ( data.k ) {
					_key = data.k;
					this.receive( "load", data );
				} else 
					error_( "bad data..." );
			},
			// receives data from the server
			receive: function( type, data ) {
				// save ref
				var __this = this;
				// do something with it
				switch ( type ) {
					case "load":
						// check key value
						if ( RX_URL.test( _key ) )
							_key = data.k;
						// make and attach a tree holder
						var holder = $( "<div class='tree-holder' />" );
						if ( _sandbox.context.tagName == "BODY" || _sandbox.context[0].tagName == "BODY" ) 
							holder.appendTo( "#trees > section" );
						else 
							holder.appendTo( _sandbox.context );
						// add toolbox?
						if ( WIDGET && _sandbox.options.tools )
							$( toolbar__ ).prependTo( holder[0].parentNode );
						// margin and padding
						var pt = WIDGET && _sandbox.options.tools ? 40 : 20;
		        var tmpR = 20;
            var tmpL = 20;
            var tmpB = 20;
            var tmpT = pt;
            if ( WIDGET && _sandbox.options.margins ) {
              tmpR = _sandbox.options.margins.r ? tmpR + _sandbox.options.margins.r : tmpR;
              tmpL = _sandbox.options.margins.l ? tmpL + _sandbox.options.margins.l : tmpL;
              tmpB = _sandbox.options.margins.b ? tmpB + _sandbox.options.margins.b : tmpB;
              tmpT = _sandbox.options.margins.t ? tmpT + _sandbox.options.margins.t : tmpT;
            }
		        // create view
		        _view = new _Engine.View( _sandbox, _key, holder, { t: tmpT, r: tmpR, b: tmpB, l: tmpL }, true, 60, true );
						// make tree
						this.make( data );
						// bind handler for tree ready
						$( "#" + _view.id, _sandbox.context ).bind( "viewready", function( e ) {
							// unbind
							$( e.target ).unbind( "viewready", arguments.callee );
							// notify sandbox
							_sandbox.notify( "pb-treefocus", __this );
						});
						// change the url hash to the new destination
						if ( ! WIDGET )
							window.location.hash = _key;
						// plot
						_view.plot( this );
						// go
						_view.begin();
						break;
					case "save":
						// notify sandbox
            if ( ! WIDGET ) {
              var histUrl = 'http://' + HOST + '?k=' + data.key;
              //window.history.pushState('', data.key, _histUrl);
              _sandbox.notify( "pb-history-change", [ data.key, histUrl, '' ] );
            }
						_sandbox.notify( "pb-treesave", __this );
						break;
				}
			},
			// collect data
			make: function( data ) {
				// store data
				_data = data;
				// nest this tree around the original root
				this.nest();
			},
			// pre-nesting setup
			nest: function( rid ) {
				// save root id
				if ( rid ) {
					_rid = rid;
					_renesting = true;
				} else {
					_rid = _data.environment.root || 
						_data.root ? 
							_data.root : 
							_data.tree[0].id;
					_renesting = false;
				}
				// clone the original data
				_data_clone = $.extend( true, {}, _data );
				// combine options
                if ( _sandbox.options.background != null ) _data.environment.color = _sandbox.options.background;
                if ( _sandbox.options.nodeRadius != null ) _data.environment.radius = _sandbox.options.nodeRadius;
                if ( _sandbox.options.branchWidth != null ) _data.environment.width = _sandbox.options.branchWidth;
                if ( _sandbox.options.htuLabels != null ) _data.environment.htulabels = _sandbox.options.htuLabels;
                if ( _sandbox.options.leafLabels != null ) _data.environment.leaflabels = _sandbox.options.leafLabels;
                if ( _sandbox.options.branchLabels != null ) _data.environment.branchlabels = _sandbox.options.branchLabels;
                if ( _sandbox.options.threeD != null ) _data.environment.threeD = _sandbox.options.threeD;
                _title = _sandbox.options.title ? _sandbox.options.title : _data.title;
                switch ( _sandbox.options.viewMode ) {
                    case "dendrogram":
                        _data.environment.viewmode = 0;
                        break;
                    case "cladogram":
                        _data.environment.viewmode = 1;
                        break;
                    case "circular dendrogram":
                        _data.environment.viewmode = 2;
                        break;
                    case "circular cladogram":
                        _data.environment.viewmode = 3;
                        break;
                }
				// break up data
				_tree_data = _data.tree;
				_environment = _data.environment;
				_environment.root = _rid;
				// (re)nest
				_nest();
			},
			// flip clade about node
			flip: function( n ) {
				// reverse node phyloJSON children array
				_find( _tree_data, "id", n.id ).children.reverse();
				_nest();
			},
			// save tree
			save: function() {
				// update phyloJSON nodes with Node properties
				for ( var n = 0; n < _node_list.length; n++ ) {
					var pj_node = _find( _tree_data, "id", _node_list[n].id );
					pj_node.color = _node_list[n].color;
			        pj_node.visibility = _node_list[n].visibility;
				}
				// stringify the data
				var save = JSON.stringify( _data ),
				// save an image
		   	png = JSON.stringify( _view.canvas[0].toDataURL( "image/png" ) );
				// save
				_io.request( "save", { 
					key: _key, 
					tree: save, 
					title: _title, 
					png: png 
				}, API_SAVE_TREE );
			},
			// gets
			get key() { return _key; },
			get nodes() { return _nodes; },
			get node_list() { return _node_list; },
			get n_leaves() { return _n_leaves; },
			get n_layers() { return _n_layers; },
			get title() { return _title; },
			get environment() { return _environment; },
			get view() { return _view; },
			get io() { return _io; },
			get age() { return _age; },
			// sets
			set title( v ) { _title = v; },
			set view( v ) { _view = v; },
			set age( v ) { _age = v; },
		};
	};
/*###########################################################################
###################################################################### ENGINE
###########################################################################*/
	var _Engine = function() {
		// methods
		return {
/*###########################################################################
############################################################# ENGINE POINT 3D
###########################################################################*/
			Point3D: function( pX, pY, pZ, pR, pT ) {
				// private vars
				var _fl = 2000
					, _vpx = 0
					, _vpy = 0
					, _cx = 0
					, _cy = 0
					, _cz = 0 
					, _x = pX
					, _y = pY
					, _z = pZ
					, _r = pR ? pR : 0
					, _t = pT ? pT : 0
				;
				// methods
				return {
					setVanishingPoint: function( vpx, vpy ) {
						_vpx = vpx;
						_vpy = vpy;
					},
					setCenter: function( cx, cy, cz ) {
						_cx = cx;
						_cy = cy;
						_cz = cz;
					},
					rotateX: function( ax ) {
						// translate
						var cosX = Math.cos( ax ),
							sinX = Math.sin( ax ),
							y1 = _y * cosX - _z * sinX,
							z1 = _z * cosX + _y * sinX;
						// update
						_y = y1;
						_z = z1;
					},
					rotateY: function( ay ) {
						// translate
						var cosY = Math.cos( ay ),
							sinY = Math.sin( ay ),
							x1 = _x * cosY - _z * sinY,
							z1 = _z * cosY + _x * sinY;
						// update
						_x = x1;
						_z = z1;
					},
					rotateZ: function( az ) {
						// translate
						var cosZ = Math.cos( az ),
							sinZ = Math.sin( az ),
							x1 = _x * cosZ - _y * sinZ,
							y1 = _y * cosZ + _x * sinZ;
						// update
						_x = x1;
						_y = y1;
					},
					// get screen position
					get screenX() { return _vpx + ( _cx + _x ) * ( _fl / ( _fl + _z + _cz ) ); },
					get screenY() { return _vpy + ( _cy + _y ) * ( _fl / ( _fl + _z + _cz ) ); },
					// gets
					get fl() { return _fl; },
					get x() { return _x; },
					get y() { return _y; },
					get z() { return _z; },
					get r() { return _r; },
					get t() { return _t; },
					// sets
					set fl( v ) { _fl = v; },
					set x( v ) { _x = v; },
					set y( v ) { _y = v; },
					set z( v ) { _z = v; },
					set r( v ) { _r = v; },
					set t( v ) { _t = v; }
				};
			},
/*###########################################################################
################################################################## ENGINE DOT
###########################################################################*/
			Dot: function( node, view ) {
				// private vars
				var _node, _point, _view;
				// init
				_node = node;
				_point = _node.point3D;
				_view = view;
				// methods
				return {
					draw: function( ctx ) {
						// check visibility
				        if ( _node.visibility ) {
							// scale alpha and radius on depth ---- alpha will vary from 1.0 - 0.3 across max depth of tree
							var scale = 0.7 - ( (_point.z / ( _view.max_z / 2 ) ) * 0.3 );
					        // set styles
			                ctx.fillStyle = isHex_( _node.color );
							ctx.globalAlpha = scale;
					        // draw the line
					        ctx.beginPath();
							if ( scale > 0 )	
								ctx.arc( _point.screenX, _point.screenY, _view.tree.environment.radius * scale, 0, 2 * Math.PI, false );
					        ctx.fill();
							// leaf label
							if ( _view.tree.environment.leaflabels && _node.is_leaf ) {
								switch( _view.tree.environment.viewmode ) {
									case 0: case 1:
										ctx.textAlign = "left";
										var lx = Math.round( _point.screenX + 5 ),
											ly = Math.round( _point.screenY );
										break;
									case 2: case 3:
										ctx.textAlign = _point.t > Math.PI / 2 && _point.t < 3 * Math.PI / 2 ? "right" : "left";
										var lx = Math.round( _point.screenX + 5 * Math.cos( _point.t ) ),
											ly = Math.round( _point.screenY + 5 * Math.sin( _point.t ) );
										break;
								}
								ctx.textBaseline = "middle";
								var label = _node.name || _node.id;
								ctx.fillText( label, lx, ly );
							}
							// htu label
							if ( _view.tree.environment.htulabels && _node.n_children > 0 ) {
								switch ( _view.tree.environment.viewmode ) {
									case 0: case 1:
										ctx.textBaseline = "alphabetic";
										ctx.textAlign = "right";
										var lx = Math.round( _point.screenX ),
											ly = Math.round( _point.screenY - 3 );
										break;
									case 2: case 3:
										ctx.textBaseline = "middle";
										ctx.textAlign = _point.t > Math.PI / 2 && _point.t < 3 * Math.PI / 2 ? "left" : "right";
										var lx = Math.round( _point.screenX - 3 * Math.cos( _point.t ) ),
											ly = Math.round( _point.screenY - 3 * Math.sin( _point.t ) );
										break;
								}
								var label = _node.name || _node.id;
								ctx.fillText( label, lx, ly );
							}
						}
						// selected
						if ( _node.selected ) {
							ctx.strokeStyle = "#00ff00";
							ctx.fillStyle = "#00ff00";
							ctx.globalAlpha = 1;
							ctx.lineWidth = 1;
							ctx.dottedArc( _point.screenX, _point.screenY, _view.h_radius, 0, 2 * Math.PI, false );
							ctx.globalAlpha = 0.2;
							ctx.beginPath();
							ctx.arc( _point.screenX, _point.screenY, _view.h_radius, 0, 2 * Math.PI, false );
							ctx.fill();
						}
						// hover
						if ( _node.hover ) {
							ctx.strokeStyle = "#ff0000";
							ctx.fillStyle = "#ff0000";
							ctx.globalAlpha = 1;
							ctx.lineWidth = 1;
							ctx.dottedArc( _point.screenX, _point.screenY, _view.h_radius, 0, 2 * Math.PI, false );
							ctx.globalAlpha = 0.3;
							ctx.beginPath();
							ctx.arc( _point.screenX, _point.screenY, _view.h_radius, 0, 2 * Math.PI, false );
							ctx.fill();
						}
						// check link
						if ( ! _view.update_links ) return false;
						// set link color
						$( "div.dot", _node.link ).css( "background", isHex_( _node.color ) );
						// set link visibility
						if( ! _node.visibility ) $( "div.ex", _node.link ).show();
						else $( "div.ex", _node.link ).hide();
					},
					// gets
					get point() { return _point; },
					get node() { return _node; }
				};
			},
/*###########################################################################
################################################################# ENGINE LINE
###########################################################################*/
			Line: function( nodeA, nodeB, siblingP, view ) {
				// private vars
				var _node, _view,
					_pointA, _pointB, _pointC, 
					_controlP1, _controlP2;
				// init
				_node = nodeA;
				_pointA = nodeA.point3D;
				_pointB = nodeB.point3D;
				_pointC = siblingP;
				_view = view;
				// calculate control points		
				switch ( _view.tree.environment.viewmode ) {
					case 0: case 1:
						if ( _pointC ) {
							// form the edge vectors
							var ab = {};
							ab.x = _pointA.x - _pointB.x;
							ab.y = _pointA.y - _pointB.y;
							ab.z = _pointA.z - _pointB.z;
							var bc = {};
							bc.x = _pointB.x - _pointC.x;
							bc.y = _pointB.y - _pointC.y;
							bc.z = _pointB.z - _pointC.z;
							// form the normal vector (cross product)
							var norm = {};
							norm.x = ( ab.y * bc.z ) - ( ab.z * bc.y );
							norm.y = -( ( ab.x * bc.z ) - ( ab.z * bc.x ) );
							norm.z = ( ab.x * bc.y ) - ( ab.y * bc.x );
							// find magnitude of normal vector
							var nm = Math.sqrt( norm.x * norm.x + norm.y * norm.y + norm.z * norm.z );
							// get the unit normal vector
							var un = {};
							un.x = norm.x / nm;
							un.y = norm.y / nm;
							un.z = norm.z / nm;
							// define offset for cp1
							var off = _view.gap * 0.05;
							//////////// cp 1
							// make 2 points to define a line
							var p1 = {};
							p1.x = _pointA.x + off;
							p1.y = _pointA.y;
							p1.z = _pointC.z;
							var p2 = {};
							p2.x = p1.x;
							p2.y = p1.y;
							p2.z = _pointA.z;
							// make vector to plane and vector to other point on line 
							var v1 = {};
							v1.x = _pointB.x - p1.x;
							v1.y = _pointB.y - p1.y;
							v1.z = _pointB.z - p1.z;
							var v2 = {};
							v2.x = p2.x - p1.x;
							v2.y = p2.y - p1.y;
							v2.z = p2.z - p1.z;
							// find "slope"
							var u1 = ( un.x * v1.x + un.y * v1.y + un.z * v1.z ) / ( un.x * v2.x + un.y * v2.y + un.z * v2.z ) || 0;
		                    // make the control point
							var cp1 = {};
							cp1.x = p1.x + u1 * v2.x;
							cp1.y = p1.y + u1 * v2.y;
							cp1.z = p1.z + u1 * v2.z;
							_controlP1 = new _Engine.Point3D( cp1.x, cp1.y, cp1.z );
							//////////// cp 2
							// make 2 points to define a line
							var p3 = {};
							p3.x = p1.x;
							p3.y = _pointB.y;
							p3.z = _pointC.z;
							var p4 = {};
							p4.x = p1.x;
							p4.y = p3.y;
							p4.z = _pointA.z;
							// make vector to plane and vector to other point on line 
							var v3 = {};
							v3.x = _pointB.x - p3.x;
							v3.y = _pointB.y - p3.y;
							v3.z = _pointB.z - p3.z;
							var v4 = {};
							v4.x = p4.x - p3.x;
							v4.y = p4.y - p3.y;
							v4.z = p4.z - p3.z;
							// find "slope"
							var u2 = ( un.x * v3.x + un.y * v3.y + un.z * v3.z ) / ( un.x * v4.x + un.y * v4.y + un.z * v4.z ) || 0;
		                    // make the control point
							var cp2 = {};
							cp2.x = p3.x + u2 * v4.x;
							cp2.y = p3.y + u2 * v4.y;
							cp2.z = p3.z + u2 * v4.z;
							_controlP2 = new _Engine.Point3D( cp2.x, cp2.y, cp2.z );
						} else {
							_controlP1 = new _Engine.Point3D( _pointA.x, _pointA.y, _pointA.z );
							_controlP2 = new _Engine.Point3D( _pointA.x, _pointA.y, _pointA.z );
						}
						break;
					case 2: case 3:
						if ( _pointC ) {
							// form the edge vectors
							var ab = {};
							ab.r = _pointA.r - _pointB.r;
							ab.t = _pointA.t - _pointB.t;
							ab.z = _pointA.z - _pointB.z;
							var bc = {};
							bc.r = _pointB.r - _pointC.r;
							bc.t = _pointB.t - _pointC.t;
							bc.z = _pointB.z - _pointC.z;
							// form the normal vector (cross product)
							var norm = {};
							norm.r = ( ab.t * bc.z ) - ( ab.z * bc.t );
							norm.t = -( ( ab.r * bc.z ) - ( ab.z * bc.r ) );
							norm.z = ( ab.r * bc.t ) - ( ab.t * bc.r );
							// find magnitude of normal vector
							var nm = Math.sqrt( norm.r * norm.r + norm.t * norm.t + norm.z * norm.z );
							// get the unit normal vector
							var un = {};
							un.r = norm.r / nm;
							un.t = norm.t / nm;
							un.z = norm.z / nm;
							// define offset for cp1
							var off = _view.gap * 0.05;
							//////////// cp 1
							// make 2 points to define a line
							var p1 = {};
							p1.r = _pointA.r + off;
							p1.t = _pointA.t;
							p1.z = _pointC.z;
							var p2 = {};
							p2.r = p1.r;
							p2.t = p1.t;
							p2.z = _pointA.z;
							// make vector to plane and vector to other point on line 
							var v1 = {};
							v1.r = _pointB.r - p1.r;
							v1.t = _pointB.t - p1.t;
							v1.z = _pointB.z - p1.z;
							var v2 = {};
							v2.r = p2.r - p1.r;
							v2.t = p2.t - p1.t;
							v2.z = p2.z - p1.z;
							// find "slope"
							var u1 = ( un.r * v1.r + un.t * v1.t + un.z * v1.z ) / ( un.r * v2.r + un.t * v2.t + un.z * v2.z ) || 0;
							// make the control point
							var cp1 = {};
							cp1.r = p1.r + u1 * v2.r;
							cp1.t = p1.t + u1 * v2.t;
							cp1.z = p1.z + u1 * v2.z;
							cp1.x = cp1.r * Math.cos( cp1.t ) - _view.cx;
							cp1.y = cp1.r * Math.sin( cp1.t ) - _view.cy;
							_controlP1 = new _Engine.Point3D( cp1.x, cp1.y, cp1.z, cp1.r, cp1.t );
							//////////// cp 2
							// make 2 points to define a line
							var p3 = {};
							p3.r = p1.r;
							p3.t = _pointB.t;
							p3.z = _pointC.z;
							var p4 = {};
							p4.r = p1.r;
							p4.t = p3.t;
							p4.z = _pointA.z;
							// make vector to plane and vector to other point on line 
							var v3 = {};
							v3.r = _pointB.r - p3.r;
							v3.t = _pointB.t - p3.t;
							v3.z = _pointB.z - p3.z;
							var v4 = {};
							v4.r = p4.r - p3.r;
							v4.t = p4.t - p3.t;
							v4.z = p4.z - p3.z;
							// find "slope"
							var u2 = ( un.r * v3.r + un.t * v3.t + un.z * v3.z ) / ( un.r * v4.r + un.t * v4.t + un.z * v4.z ) || 0;
							// make the control point
							var cp2 = {};
							cp2.r = p3.r + u2 * v4.r;
							cp2.t = p3.t + u2 * v4.t;
							cp2.z = p3.z + u2 * v4.z;
							cp2.x = cp2.r * Math.cos( cp2.t ) - _view.cx;
							cp2.y = cp2.r * Math.sin( cp2.t ) - _view.cy;
							_controlP2 = new _Engine.Point3D( cp2.x, cp2.y, cp2.z, cp2.r, cp2.t );
							break;
						} else {
							_controlP1 = new _Engine.Point3D( _pointA.x, _pointA.y, _pointA.z, _pointA.r, _pointA.t );
							_controlP2 = new _Engine.Point3D( _pointA.x, _pointA.y, _pointA.z, _pointA.r, _pointA.t );
						}
						break;
				}
				// methods
				return {
					draw: function( ctx ) {
						// check visibility
				        if( ! _node.visibility ) return false;
						// scale alpha and linw width with depth ---- alpha will vary from 1.0 - 0.3 across max depth of tree
						var scale = 0.7 - ( (_pointB.z / ( _view.max_z / 2 ) ) * 0.3 );
				     	// set styles
				        ctx.strokeStyle = isHex_( _node.color );
				        ctx.globalAlpha = scale;
						//ctx.globalCompositeOperation = "xor";
				        ctx.lineWidth  = _view.tree.environment.width * scale;
						// draw the line
				        ctx.beginPath();
				        ctx.moveTo( _pointA.screenX, _pointA.screenY );
						switch ( _view.tree.environment.viewmode ) {
							case 0: case 2: // dendrograms
								ctx.lineTo( _controlP1.screenX, _controlP1.screenY );
								ctx.lineTo( _controlP2.screenX, _controlP2.screenY );
								ctx.lineTo( _pointB.screenX, _pointB.screenY );
								break;
							case 1: case 3:  // cladograms
								ctx.lineTo( _pointB.screenX, _pointB.screenY );
								break;
						}
						ctx.stroke();
						//ctx.globalCompositeOperation = "source-over";
					},
					// gets
					get points() { return [ _pointA, _pointB ] },
					get pointA() { return _pointA; },
					get pointB() { return _pointB; },
					get controlP1() { return _controlP1; },
					get controlP2() { return _controlP2; }
				};
			},
/*###########################################################################
################################################################# ENGINE VIEW
###########################################################################*/
			View: function( sandbox, id, holder, padding, single, fr, full, pW, pH ) {
				// private vars
				var _sandbox = sandbox 
					, _inited = false 
					, _id = "view-" + id
					, _canvas 
					, _tree
					, _delay = 1000 / fr 
					, _holder = holder
					, _padding = padding
					, _single = single 
					, _width
					, _height
					, _full = full
					, _int_id 
					, _ctx
          , _font = 8
          , _fl = 2000
					, _vpx = 0 
					, _vpy = 0 
					, _cx = 0 
					, _cxi = 0
					, _cy = 0
					, _cyf = 0
					, _cz = 0
					, _s = 1
					, _si = 1
					, _sf = 1
					, _dx = 0 
					, _dy = 0 
					, _dz = 0 
					, _ax = 0 
					, _ay = 0 
					, _az = 0
					, _max_z = 0 
					, _gap = 0
					, _h_radius = 10
					, _fm = { x: 0, y: 0 } 
					, _m = { x: 0, y: 0 }
					, _f = { x: 0, y: 0, n: null } 
					, _selecting = false 
					, _locked = false 
					, _hovered_node 
					, _selected_node
					, _l = []
					, _d = []
					, _cp = []
					, _update_links = false
					, _boundaries = false
					, _zoomTimer
					, _zoomSteps = _delay
					, _zoomStep = 0
				;
				// start frame rendering
				function _start() {
					// check single
					if( _single ) return false;
					// begin frame rendering
					_int_id = setInterval( __enterFrameHandler, _delay );
					// define timer handler
					function __enterFrameHandler() { _update(); _render(); };
				}
				// stop frame rendering
				function _stop() {
					// check single
					if( _single ) return false;
					// stop time
					clearTimeout( _int_id );
				}
				// update coordinates of all points
				function _update() {
					// points
					for ( var d = 0; d < _d.length; d++ ) {
						_d[d].point.setVanishingPoint( _vpx, _vpy );
						_d[d].point.setCenter( _cx, _cy, _cz );
						_d[d].point.x += _dx;
					 	_d[d].point.y += _dy;
					 	_d[d].point.z += _dz;
					 	_d[d].point.rotateX( _ax );
					 	_d[d].point.rotateY( _ay );
					 	_d[d].point.rotateZ( _az );
					}
					// set control points vanishing point
					for ( var cp = 0; cp < _cp.length; cp++ ) {
						_cp[cp].setVanishingPoint( _vpx, _vpy );
						_cp[cp].setCenter( _cx, _cy, _cz );
						_cp[cp].x += _dx;
					 	_cp[cp].y += _dy;
					 	_cp[cp].z += _dz;
					 	_cp[cp].rotateX( _ax );
					 	_cp[cp].rotateY( _ay );
					 	_cp[cp].rotateZ( _az );
					}
					// store offsets
					_tree.environment.offset.ax += _ax;
					_tree.environment.offset.ay += _ay;
					_tree.environment.offset.az += _az;
					_tree.environment.offset.dx += _dx;
					_tree.environment.offset.dy += _dy;
					_tree.environment.offset.dz += _dz;
				}
				// draw objects
				function _render() {
					// enable css3 color words
		      _ctx.fillStyle = _tree.environment.color ? isHex_( _tree.environment.color ) : "rgba( 35, 35, 47, 0.0 )";
					_ctx.lineWidth = 1;
          //_ctx.font = _sandbox.options.labelSize + "px Plain";
          _ctx.font = WIDGET ? _sandbox.options.labelSize + "px Plain" : _font + "px Plain";
					//_ctx.font = "8px Plain";
					_ctx.globalAlpha = 1;
					if ( _tree.environment.color === false )
						_ctx.clearRect( 0, 0, _c_width(), _c_height() );
					else
						_ctx.fillRect( 0, 0, _c_width(), _c_height() );
					// draw dots
					for ( var d = 0; d < _d.length; d++ )
						_d[d].draw( _ctx );
					// draw lines
					for ( var l = 0; l < _l.length; l++ )
						_l[l].draw( _ctx );
					// check locked
					if ( _locked ) {
						// draw lock
						_ctx.strokeStyle = "#ff0000";
						_ctx.globalAlpha = 1;
						_ctx.lineWidth = 1;
						_ctx.dottedArc( _f.x, _f.y, _h_radius, 0, 2 * Math.PI, false );
						// draw mouse
						_ctx.fillStyle = "#ff0000";
						_ctx.globalAlpha = 0.3;
						_ctx.beginPath();
						_ctx.arc( _f.x, _f.y, _h_radius, 0, 2 * Math.PI, false );
						_ctx.fill();
					}
					// check selecting
					// else if ( _selecting ) {
					// 	// draw mouse
					// 	_ctx.fillStyle = "#ff0000";
					// 	_ctx.globalAlpha = 0.3;
					// 	_ctx.beginPath();
					// 	_ctx.arc( _m.x, _m.y, _h_radius, 0, 2 * Math.PI, false );
					// 	_ctx.fill();
					// }
					// check boundaries
					if ( _boundaries ) _showBounds();
					// kill link updates
					if ( _update_links ) _update_links = false;
				}
				// draw canvas bounds
				function _showBounds() {
					// show padding, center, and vanishing point
					_ctx.strokeStyle = "#00ffff";
					_ctx.fillStyle = "#ff00ff";
					_ctx.lineWidth = 0.5;
					_ctx.globalAlpha = 1;
					_ctx.beginPath();
					_ctx.moveTo( _cx, _cy + 30 );
					_ctx.lineTo( _cx, _cy );
					_ctx.lineTo( _cx + 30, _cy );
					_ctx.moveTo( _cx + _width, _cy + 30 );
					_ctx.lineTo( _cx + _width, _cy );
					_ctx.lineTo( _cx + _width - 30, _cy );
					_ctx.moveTo( _cx + _width, _cy + _height - 30 );
					_ctx.lineTo( _cx + _width, _cy + _height );
					_ctx.lineTo( _cx + _width - 30, _cy + _height );
					_ctx.moveTo( _cx, _cy + _height - 30 );
					_ctx.lineTo( _cx, _cy + _height );
					_ctx.lineTo( _cx + 30, _cy + _height );
					_ctx.stroke();
					_ctx.globalAlpha = 0.5;
					_ctx.beginPath();
					_ctx.moveTo( _cx + 1, _cy + 10 );
					_ctx.lineTo( _cx + 1, _cy + 1 );
					_ctx.lineTo( _cx + 10, _cy + 1 );
					_ctx.fill();
					_ctx.fillStyle = "#ffff00";
					_ctx.beginPath();
					_ctx.arc( _vpx, _vpy, 5, 0, 2 * Math.PI, false );
					_ctx.fill();
				}
				// returns true canvas size
				function _c_width() {
					return _width + _padding.l + _padding.r; 
				}
				function _c_height() {
					return _height + _padding.t + _padding.b; 
				}
        // tools
				function _select( e, t, m ) {
					// determine action
					switch ( t ) {
						case "mousedown":
							// set
							_m = m;
							_selecting = true;
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if ( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									// notify sandbox
									_sandbox.notify( "pb-nodeclick", nodes[n], true );
									// clear flag
									_locked = true;
									break;
								}
							}
							// draw
							_render();
							// clear
							_selecting = false;
							_locked = false;
							break;
						case "mousesearch":
							// set
							_m = m;
							_selecting = true;
							// notify sandbox
							_sandbox.notify( "pb-nodeexit", _hovered_node, true );
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									_locked = true;
									_hovered_node = nodes[n];
									// notify sandbox
									_sandbox.notify( "pb-nodehover", nodes[n], true );
									break;
								}
							}
							// draw
							_render();
							// clear
							_selecting = false;
							_locked = false;
							break;
					}
				}
				function _flip( e, t, m ) {
					// determine action
					switch ( t ) {
						case "mousedown":
							// set
							_m = m;
							_selecting = true;
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if ( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									// notify sandbox
									_sandbox.notify( "pb-cladeflip", nodes[n], true );
									// clear flag
									_locked = true;
									break;
								}
							}
							// draw
							_render();
							// clear
							_selecting = false;
							_locked = false;
							break;
						case "mousesearch":
							// set
							_m = m;
							_selecting = true;
							// notify sandbox
							_sandbox.notify( "pb-nodeexit", _hovered_node, true );
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									_locked = true;
									_hovered_node = nodes[n];
									// notify sandbox
									_sandbox.notify( "pb-nodehover", nodes[n], true );
									break;
								}
							}
							// draw
							_render();
							// clear
							_selecting = false;
							_locked = false;
							break;
					}
				}
				function _translate( e, t, m ) {
					// determine action
					switch( t ) {
						case "mousedown":
							// save mouse
							_fm = m;
							break;
						case "mousemove":
							// set
							_dx = m.x - _fm.x;
							_dy = m.y - _fm.y;
							_vpx += _dx;
							_vpy += _dy;
							// draw
							_update(); _render();
							// notify sandbox
							_sandbox.notify( "pb-treepan", { dx: _dx, dy: _dy, } );
							// clear
							_fm = m;
							_dx = _dy = 0;
							break;
					}
				}
				function _rotate( e, t, m ) {
					// determine action
					switch( t ) {
						case "mousedown":
							// save mouse
							_fm = m;
							break;
						case "mousemove":
							switch( _tree.environment.threeD ) {
								// 2D
								case false:
									// direction
									var sx = m.x - _fm.x,
										sy = m.y - _fm.y;
									// displacement
									var	asx = Math.abs( sx ),
										asy = Math.abs( sy );
									// unit direction
									var drx = sx / asx || 1,
										dry = sy / asy || 1;
									// quadrant
									if ( m.x < _vpx ) dry *= -1;
									if ( m.y > _vpy ) drx *= -1;
									// choose
									var dr = asx > asy ? drx : dry;
									// set
									_az = dr * Math.sqrt( asx * asx + asy * asy ) / 100;
									// draw
									_update(); _render();
									// notify sandbox
									_sandbox.notify( "pb-treerotate", { ax: _ax, ay: _ay, az: _az } );
									// clear flags
									_fm = m;
									_az = 0;
									break;
								// 3D
								case true:
									// set
									_ax = ( m.y - _fm.y ) / 100;
									_ay = ( m.x - _fm.x ) / 100;
									// draw
									_update(); _render();
									// notify sandbox
									_sandbox.notify( "pb-treerotate", { ax: _ax, ay: _ay, az: _az } );
									// clear
									_fm = m;
									_ax = _ay = 0;
									break;
							}
							break;
					}
				}
				function _zoom( e, t, m ) {
				  // determine action
					switch( t ) {
					  case "mousedown":
							// set
							_m = m;
							_selecting = true;
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if ( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									// zoom to mouse location
  								_startZoom( e.data.reverse, nodes[n].point3D.z );
									// notify sandbox
									_sandbox.notify( "pb-treezoomin", {} );
									// clear flag
									_locked = true;
									break;
								}
							}
							// clear
							_selecting = false;
							_locked = false;
							break;
						case "mousesearch":
							// set
							_m = m;
							_selecting = true;
							// notify sandbox
							_sandbox.notify( "pb-nodeexit", _hovered_node, true );
							// search for nearby nodes
							var nodes = _tree.node_list,
								r = _h_radius;
							for ( var n = 0; n < nodes.length; n++ ) {
								var p = {}; 
								p.x = nodes[n].point3D.screenX,
								p.y = nodes[n].point3D.screenY;
								if( m.x + r >= p.x && m.x - r <= p.x && m.y + r >= p.y && m.y - r <= p.y ) {
									_f.x = p.x;
									_f.y = p.y;
									_locked = true;
									_hovered_node = nodes[n];
									// notify sandbox
									_sandbox.notify( "pb-nodehover", nodes[n], true );
									break;
								}
							}
							// draw
							_render();
							// clear
							_selecting = false;
							_locked = false;
							break;
					}
				}
				// set current scale
				function _setScale( z ) {
				  _s = _fl / ( _fl + z + _cz );
				}
				// set current zoom
				function _setZoom( z ) {
				  _cz = ( _fl - _s * _fl - _s * z ) / _s;
				}
				// begin animated zoom
			  function _startZoom( reverse, depth ) {
    			var n = 1 / 5
    			  , lx = _f.x - _c_width() / 2
    			  , ly = _f.y - _c_height() / 2;
    			;
    			if ( reverse ) 
    			  n *= -1;
    			if ( _s + n >= 0.3 && _s + n <= 5 ) {
    				_si = _s;
    				_sf = _si + n;
    				_cxi = _cx;
    				_cyi = _cy;
    				_cxf = ( _cxi * _sf - lx * n ) / _si;
    				_cyf = ( _cyi * _sf - ly * n ) / _si;
    				_zoomStep = 0;
    				_zoomTimer = setInterval( function () {
    				  _zoomStepper( depth );
    				}, _delay );
    			}
    		}
        // set animations step
    		function _zoomStepper( depth ) {
    			var t = _zoomStep * _delay;
    			var d = _zoomSteps * _delay;
    			_s = _getTween( 'linear', t, _si, _sf - _si, d );
    			_setZoom( depth );
    			_cx = _getTween( 'linear', t, _cxi, _cxf - _cxi, d );
    			_cy = _getTween( 'linear', t, _cyi, _cyf - _cyi, d );
    			_update(); _render();
    			_zoomStep++;
    			if ( _zoomStep >= _zoomSteps )
    			  clearInterval( _zoomTimer );
    		}
    		// returns animation step
    		function _getTween( f, t, b, c, d ) {
    			var s = 1.70158;
    			switch ( f ) {
    				case 'linear':	
    					return c * t / d + b;
    					break;
    				case 'expo':
    					return ( t == d ) ? b + c : c * ( - Math.pow( 2, -10 * t / d ) + 1 ) + b;
    					break;
    				case 'back':
    					return c * ( ( t = t / d - 1 ) * t * ( ( s + 1 ) * t + s ) + 1 ) + b;
    					break;
    				case 'backlin':
    					var c1 = c * s;
    					var c2 = c - c1;
    					return ( t > d / s ) ? c2 * t / ( d - d / s ) + c1 : c1 * t / d / s + b;
    					break;
    			}
    		}
				// init
				_width = ! _full ? pW : _holder.width() - _padding.l - _padding.r;
				_height = ! _full ? pH : _holder.height() - _padding.t - _padding.b;
				// create canvas
				_canvas = $( "<canvas style='display:none;' width='" + _c_width() + "' height='" + _c_height() + "' id='" + _id + "'></canvas>" );
				// add to document
				_canvas.appendTo( _holder );
				// text select tool fix for chrome on mousemove
				_canvas[0].onselectstart = function () { return false; };
		    // add tool events
				_canvas.bind( "pb-select", _select );
				_canvas.bind( "pb-flip", _flip );
				_canvas.bind( "pb-translate", _translate );
				_canvas.bind( "pb-rotate", _rotate );
				_canvas.bind( "pb-zin", { reverse: false }, _zoom );
				_canvas.bind( "pb-zout", { reverse: true }, _zoom );
				// get context
				_ctx = $( "#" + _id, _sandbox.context )[0].getContext( "2d" );
				// hide
				$( "#" + _id, _sandbox.context ).hide();
				// initialized
				_inited = true;
				// methods
				return {
					begin: function() {
						// save ref
						var __this = this;
						// window resize on full
						if( ! WIDGET ) 
							$( document ).bind( "pb-treeresize", function ( e ) {
								_width = _holder.width() - _padding.l - _padding.r;
								_height = _holder.height() - _padding.t - _padding.b;
								$( "#" + _id, _sandbox.context ).attr({ width: _c_width(), height: _c_height() });
								if ( _inited ) __this.replot();
							});
						else
							$( _holder[0].parentNode ).css({ width:"", height:"" });
						// add view object to canvas
						_canvas.data( "view", this );
						// begin
						if ( ! _single ) _start();
						// dispatch ready event and show
						$( "#" + _id, _sandbox.context ).trigger( "viewready" ).fadeIn( "fast" );
					},
					plot: function( tree ) {
						// save tree on first pass
						if ( tree && ! _tree ) {
							_tree = tree;
							// add the title
              if ( _tree.title ) {
                _title = $( "<p class='tree-title' id='" + _id + "-title'>" + _tree.title + "</p>" );
                _title.appendTo( _holder );
              }
						}
						// local offsets
						var local = { 
							dx: _tree.environment.offset.dx,
							dy: _tree.environment.offset.dy,
							dz: _tree.environment.offset.dz,
							ax: _tree.environment.offset.ax,
							ay: _tree.environment.offset.ay,
							az: _tree.environment.offset.az
						};
						// position vanishing point
						_vpx = _width / 2 + ( _padding.l + _padding.r ) / 2 + local.dx;
						_vpy = _height / 2 + ( _padding.t + _padding.b ) / 2 + local.dy;
						_cx = _padding.l;
						_cy = _padding.t;
						// refresh data
						_l = [];
						_d = [];
						_cp = [];
						// parse on layer
						var nls = [];
						for ( var i = 0; i < _tree.n_layers; i++ ) 
							nls.push( [] );
						for ( var n = 0; n < _tree.node_list.length; n++ ) 
							nls[_tree.node_list[n].layer].push( _tree.node_list[n] );
						nls.reverse();
						// calculate coordinates
						switch ( _tree.environment.viewmode ) {
							// dendogram, cladogram
							case 0: case 1:
								var gap_x = _width / ( _tree.n_layers - 1 );
								var gap_y = _height / ( _tree.n_leaves - 1 );
								_max_z = ( _tree.n_layers - 1 ) * gap_x;
								var j = 0;
								for ( var l = 0; l < nls.length; l++ ) {
									for ( var n = 0; n < nls[l].length; n++ ) {
										var x = ( nls[l][n].layer * gap_x ) - _vpx;
										if ( nls[l][n].is_leaf ) {
											var y = j * gap_y - _vpy;
											j++;
										} else {
											var max_y = nls[l][n].children[0].point3D.y;
											var min_y = nls[l][n].children[nls[l][n].n_children - 1].point3D.y;
											var y = min_y + ( ( max_y - min_y ) / 2 );
										}
										var z = _tree.environment.threeD ? nls[l][n].n_parents * gap_x - ( _max_z / 2 ) : 1;
										nls[l][n].point3D =  new _Engine.Point3D( x, y, z );
									}
								}
								_gap = gap_x;
								break;
							// circular dendogram, circular cladogram
							case 2: case 3:
								var gap_r = Math.min( _width, _height ) / ( _tree.n_layers - 1 ) / 2;
								var gap_t = 2 * Math.PI / _tree.n_leaves;
								_max_z = ( _tree.n_layers - 1 ) * gap_r;
								var j = 0;
								for ( var l = 0; l < nls.length; l++ ) {
									for ( var n = 0; n < nls[l].length; n++ ) {
										var r = nls[l][n].layer * gap_r;
										if ( nls[l][n].is_leaf ) {
											var t = j * gap_t;
											var y = r * Math.sin( t ) - _cy;
											j++;
										} else {
											var max_t = nls[l][n].children[0].point3D.t;
											var min_t = nls[l][n].children[nls[l][n].n_children - 1].point3D.t;
											var t = min_t + ( ( max_t - min_t ) / 2 );
											var y = r * Math.sin( t ) - _cy;
										}
										var x = r * Math.cos( t ) - _cx;
										var z = _tree.environment.threeD ? nls[l][n].n_parents * gap_r - ( _max_z / 2 ) : 1;
										nls[l][n].point3D = new _Engine.Point3D( x, y, z, r, t );
									}
								}
								_gap = gap_r;
								break;	
						}
						// make dots
						for ( var n = 0; n < _tree.node_list.length; n++ ) 
							_d.push( new _Engine.Dot( _tree.node_list[n], this ) );
						// make lines
						this.connect( _tree.nodes );
						// zoom
						_cz = _tree.environment.threeD ? _max_z : 0;
						_setScale(1);
						// update points
						for ( var d = 0; d < _d.length; d++ ) {
							_d[d].point.setVanishingPoint( _vpx, _vpy );
							_d[d].point.setCenter( _cx, _cy, _cz );
							_d[d].point.x += _dx;
						 	_d[d].point.y += _dy;
						 	_d[d].point.z += _dz;
						 	_d[d].point.rotateX( _ax );
						 	_d[d].point.rotateY( _ay );
						 	_d[d].point.rotateZ( _az );
						}
						// check options color
						if ( _sandbox.options.branchColor !== null )
			        for ( var d = 0; d < _d.length; d++ )
			          _d[d].node.color = isHex_( _sandbox.options.branchColor );
						// update control points
						for ( var cp = 0; cp < _cp.length; cp++ ) {
							_cp[cp].setVanishingPoint( _vpx, _vpy );
							_cp[cp].setCenter( _cx, _cy, _cz );
							_cp[cp].x += _dx;
						 	_cp[cp].y += _dy;
						 	_cp[cp].z += _dz;
						 	_cp[cp].rotateX( _ax );
						 	_cp[cp].rotateY( _ay );
						 	_cp[cp].rotateZ( _az );
						}
						// first render ---------------->>>>>>
			            _ctx.fillStyle = _tree.environment.color ? isHex_( _tree.environment.color ) : "rgba( 35, 35, 47, 0.0 )";
			            _ctx.lineWidth = 1;
                        _ctx.font = WIDGET ? _sandbox.options.labelSize + "px Plain" : _font + "px Plain";
						_ctx.globalAlpha = 1;
						if ( _tree.environment.color === false )
							_ctx.clearRect( 0, 0, _c_width(), _c_height() );
						else
							_ctx.fillRect( 0, 0, _c_width(), _c_height() );
						// add to link style
						_update_links = true;
						// draw dots
						for ( var d = 0; d < _d.length; d++ )
							_d[d].draw( _ctx );
						// draw lines
						for ( var l = 0; l < _l.length; l++ )
							_l[l].draw( _ctx );
						// check boundaries
						if ( _boundaries ) _showBounds();
						// update and position title
						if ( _title )
			                _title.text( _tree.title ).css({ bottom: 0, right: 0 });
					},
					replot: function() {
						// pause time
						_stop();
						// calcs
						this.plot();
						// go
						_start();
					},
					refresh: function() {
						// check single
						if ( _single ) _render();
					},
					setSelected: function( n ) {
						// set
						n.selected = true;
						_selected_node = n;
					},
					clearSelected: function() {
						// clear
						if ( _selected_node ) _selected_node.selected = false;
					},
					// connect nodes with lines
					connect: function( node ) {
				        for ( var c = 0; c < node.children.length; c++ ) {
							var sp = node.children[c].siblings.length > 0 ? node.children[c].siblings[0].point3D : false;
							var l = new _Engine.Line( node, node.children[c], sp, this );
							var cp1 = l.controlP1;
							var cp2 = l.controlP2;
				            _l.push( l );
							_cp.push( cp1 );
							_cp.push( cp2 );
				            this.connect( node.children[c] );
				        }
					},
					// gets
					get id() { return _id; },
					get canvas() { return _canvas; },
					get tree() { return _tree; },
					get holder() { return _holder; },
					get padding() { return _padding; },
					get single() { return _single; },
					get width() { return _width; },
					get height() { return _height; },
					get ctx() { return _ctx; },
					get font() { return _font; },
					get fr() { return 1000 / _delay; },
					get cx() { return _cx; },
					get cy() { return _cy; },
					get dx() { return _dx; },
					get dy() { return _dy; },
					get dz() { return _dz; },
					get ax() { return _ax; },
					get ay() { return _ay; },
					get az() { return _az; },
					get gap() { return _gap; },
					get max_z() { return _max_z; },
					get h_radius() { return _h_radius; },
					get selecting() { return _selecting; },
					get hovered_node() { return _hovered_node; },
					get selected_node() { return _selected_node; },
					get update_links() { return _update_links; },
					get boundaries() { return _boundaries; },
					// sets
					set fr( v ) { _delay = 1000 / v; _stop(); _start(); },
					set cx( v ) { _cx = v; },
					set cy( v ) { _cy = v; },
					set dx( v ) { _dx = v; },
					set dy( v ) { _dy = v; },			
					set dz( v ) { _dz = v; },			
					set ax( v ) { _ax = v; },			
					set ay( v ) { _ay = v; },			
					set az( v ) { _az = v; },		
					set width( v ) { _width = v; },			
					set height( v ) { _height = v; },
					set font( v ) { _font = v; },
					set h_radius( v ) { _h_radius = v; },
					set selecting( v ) { _selecting = v; },
					set hovered_node( v ) { _hovered_node = v; },
					set selected_node( v ) { _selected_node = v; },
					set update_links( v ) { _update_links = v; },
					set boundaries( v ) { _boundaries = v; },
					set padding( v ) { _padding = v; }
				};
			}
		};
	}();
/*###########################################################################
##################################################################### MODULES
###########################################################################*/
	// header bar for main app
	var Navigation = function( s ) {
		// vars
		var _sandbox = s, _activeMenu;
		// widget specific markup
		var wHTML = "";
		// preset fancybox options for all modals
		var _fb_options = {
			autoDimensions: false,
			autoScale: false,
			width: 550,
			height: 300,
			transitionIn: "fade",
			transitionOut: "fade",
			opacity: true,
			modal: true
		};
		// save ref for drag-n-drop
		var dragdrop = document.body;
		// hide file / edit / share menu
		function _killMenu( e ) {
			if ( e.target.nodeName != "INPUT" ) {
				$( document ).unbind( "click", _killMenu );
				$( _activeMenu ).removeClass( "menu-butt-active" );
				$( _activeMenu.nextElementSibling ).hide();
				_activeMenu = null;
			}
		}
		// wait for images before positioning menus
		$( window ).load( function () {
			$( ".menu", _sandbox.context ).each( function ( i ) {
				$( this ).css( "left", $( this.parentNode ).offset().left );
			});
		});
		// file drop functionality        
        function dragenter( e ) {
            dragdrop.setAttribute( "dragenter", true );
        }
        function dragleave( e ) {
            dragdrop.removeAttribute( "dragenter" );
        }
        function dragover( e ) {
            e.preventDefault();
        }
        function drop( e ) {
            var dt = e.dataTransfer;
            e.preventDefault();
            if ( dt.files.length == 0 )
                return false;
            for ( var i = 0; i < dt.files.length; i++ ) {
                var file = dt.files[i];
                var reader = new FileReader();
                reader.onload = function( e ) {
                      var dropped = e.target.result;
                      pbStorage.setItem( "dragdropfile", e.target.result );
                      $( '#drag-drop-open-file' ).trigger( 'change' );
                    };
                reader.readAsText( file, "UTF-8" );
            }
        }
        
        window.addEventListener( "dragleave", dragleave, true );
        dragdrop.addEventListener( "dragover", dragover, true );
        dragdrop.addEventListener( "drop", drop, true );
        
		// url updates
        function _appendHistory( title, url, object ) {
            if ( url )
                window.history.pushState( object, title, url );
            else
                url = '/';
            $.ajax({
              url: "/api/user",
              dataType: 'json',
              data: 'url=' + url,
              success: function( json ) {
                    USER = json; 
                    if ( ! USER.user ) {
                        $( '.userAction' ).attr( 'href', USER.endpoint );
                        $( '.userAction' ).html( 'Sign In' );
                        $( '.menu-item-user' ).attr( 'class', 'menu-item-anon' );
                    } else {
                        $( '.userAction' ).attr( 'href', USER.endpoint );
                        $( '.userAction' ).html( 'Sign Out' );
                        $( '.menu-item-anon' ).attr( 'class', 'menu-item-user' );
                    }
                }
            });
        }
        // set location
		_appendHistory( window.location.href );
		// modal events
		$( "#file-menu-open-file, #welcome-new-file", _sandbox.context ).live( "change", function () {
			// check origin
			switch ( this.id ) {
				case "welcome-new-file":
					// hide modal
					$.fancybox.close();
					// show loading
					$.fancybox.showActivity();
					break;
				case "file-menu-open-file":
					// hide menu
					$( document ).unbind( "click", _killMenu );
                    if (_activeMenu){
                        $( _activeMenu ).removeClass( "menu-butt-active" );
                        $( _activeMenu.nextElementSibling ).hide();
                         _activeMenu = null;
                    }
					// show overlay and loading 
					$.fancybox.showLoading();
					break;
			}
			// save ref to parent
			var parent = this.parentNode;
			// create an iframe
			var iframe = $( "<iframe id='uploader' name='uploader' style='display:none;' />" );
			// add to doc
		    iframe.appendTo( _sandbox.context );
			// iframe event handling
			var uploaded = function( e ) {
				// remove load event
				$( "#uploader", _sandbox.context ).unbind( "load", uploaded );
				// get data
				var data = JSON.parse( $( "#uploader", _sandbox.context ).contents().find( "pre" ).html() );
				if ( ! data )
					data = JSON.parse( $( "#uploader", _sandbox.context ).contents().find( "body" ).html() );
                // make a tree
				_sandbox.load( data );
				// clean up -- safari needs the delay
				setTimeout( function () {
					$( "#uploader", _sandbox.context ).remove();
					$( "#file-form", _sandbox.context ).remove();
				}, 1000 );
			};
            // add load event to iframe
            $( "#uploader", _sandbox.context ).bind( "load", uploaded );
            // create the upload form
            var form = "<form id='file-form' action='" + API_NEW + "' enctype='multipart/form-data' encoding='multipart/form-data' method='post' style='display:none;'></form>";
            // add to doc
            $( form ).appendTo( _sandbox.context );
            // change form's target to the iframe (this is what simulates ajax)
            $( "#file-form", _sandbox.context ).attr( "target", "uploader" );
            // add the file input to the form
            $( this ).appendTo( "#file-form", _sandbox.context );
            // submit form
            $( "#file-form", _sandbox.context ).submit();
            // re-attach input field
            $( this ).prependTo( parent );
            // ensure single submit
            return false;
		});
		$( "#drag-drop-open-file", _sandbox.context ).live( "change", function () {
            var d = pbStorage.getItem("dragdropfile");
            var params = {'stringXml':d};
            $.ajax({
              url: "/api/new",
              dataType: 'json',
              type: 'POST',
              data: params,
              success: function( json ) {
                  pbStorage.removeItem( "dragdropfile" );
				  // show loading
				  $.fancybox.showActivity();
                  // load data
                  _sandbox.load( json );
                },
            });  
            
		});
		// see an example
		$( "button[name='see_an_example']", _sandbox.context ).live( "click", function () {
			// hide modal
			$.fancybox.close();
			// show loading
			$.fancybox.showActivity();
			// load an example tree from url
			_sandbox.load( EXAMPLE_TREE );
		});
		// menu events
		$( ".menu-butt", _sandbox.context ).live( "click", function () {
			// set active
			_activeMenu = this;
			// add style and show menu
			$( this ).addClass( "menu-butt-active" );
			$( this.nextElementSibling ).show();
			// hide when click out	
			$( document ).bind( "click", _killMenu );
		});
		$( ".menu-butt", _sandbox.context ).live( "mouseenter", function () {
			// check if active
			if ( _activeMenu ) {
				// remove first document listener
				$( document ).unbind( "click", _killMenu );
				// remove style and hide menu
				$( _activeMenu ).removeClass( "menu-butt-active" );
				$( _activeMenu.nextElementSibling ).hide();
				// set active
				_activeMenu = this;
				// add style and show menu
				$( this ).addClass( "menu-butt-active" );
				$( this.nextElementSibling ).show();
				// hide when click out	
				$( document ).bind( "click", _killMenu );
			}
		});
		// menu file events
		$( "#file-menu-new", _sandbox.context ).live( "click", function () {
			// show modal window
			$.fancybox( $("#confirm-new").html(), $.extend( _fb_options, { width: 350, height: 200 } ) );
		});
		$( "button[name='yes']", _sandbox.context ).live( "click", function () {
			// show welcome modal
			$.fancybox( $("#welcome").html(), $.extend( _fb_options, { width: 550, height: 300 } ) );
			// save tree(s)
			_sandbox.saveTree( true );
			// notify sandbox
			_sandbox.notify( "pb-reset" );
		});
		$( "button[name='no'], button[name='close']", _sandbox.context ).live( "click", function () {
			// hide modal
			$.fancybox.close( true );
		});
		$( "#file-menu-open-file", _sandbox.context ).live( "mouseenter", function () {
			$( this.nextElementSibling ).addClass( "menu-submit-hover" );
		});
		$( "#file-menu-open-file", _sandbox.context ).live( "mouseleave", function () {
			$( this.nextElementSibling ).removeClass( "menu-submit-hover" );
		});
		$( "#file-menu-open-file", _sandbox.context ).live( "mousedown", function () {
			$( this.nextElementSibling ).addClass( "menu-submit-active" );
		});
		$( "#file-menu-open-file", _sandbox.context ).live( "mouseup", function () {
			$( this.nextElementSibling ).removeClass( "menu-submit-active" );
		});
		// save active tree
		$( "#file-menu-save-tree", _sandbox.context ).live( "click", function () {
			// show overlay and loading 
			$.fancybox.showLoading();
			// save active tree
			_sandbox.saveTree();
		});
        // go to repo wiki
        $( "#phylobox-help", _sandbox.context ).live( "click", function () {
            window.open('https://github.com/andrewxhill/PhyloBox/wiki/_pages','PhyloBox-Help');
        });
        // export canvas as png
        $( "#file-menu-export-png", _sandbox.context ).live( "click", function () {
            var ctx = _sandbox.activeTree.view.canvas[0];
            var ow = $(ctx).width();
            var oh = $(ctx).height();
            var ocw = _sandbox.activeTree.view.width;
            var och = _sandbox.activeTree.view.height;
            var oer = _sandbox.activeTree.environment.radius;
            var oew = _sandbox.activeTree.environment.width;
            var oof = _sandbox.activeTree.view.font;
            
            var op = _sandbox.activeTree.view.padding;
            
            var modX = 3;
            
            _sandbox.activeTree.view.font = oof * modX;
            
            _sandbox.activeTree.view.padding = {'b':op.b * modX,'t':op.t * modX,'l':op.l * modX,'r':op.r * modX};
            
            
            $(ctx).width(ow  * modX); ctx.width = ow * modX;
            $(ctx).height(oh * modX); ctx.height = oh * modX;
            
            _sandbox.activeTree.environment.radius = oer * modX;
            _sandbox.activeTree.environment.width = oew * modX;
            
            _sandbox.activeTree.view.width = ocw * modX;
            _sandbox.activeTree.view.height = och * modX;
            
            _sandbox.activeTree.view.refresh();
            _sandbox.activeTree.view.replot();
            
            ctx = _sandbox.activeTree.view.canvas[0];
            window.open(ctx.toDataURL("image/png"));
            
            _sandbox.activeTree.view.padding = op;
            _sandbox.activeTree.view.font = oof;
            
            $(ctx).width(ow); ctx.width = ow;
            $(ctx).height(oh); ctx.height = oh;
            
            _sandbox.activeTree.environment.radius = oer;
            _sandbox.activeTree.environment.width = oew;
            
            _sandbox.activeTree.view.width = ocw;
            _sandbox.activeTree.view.height = och;
            
            _sandbox.activeTree.view.replot();
            _sandbox.activeTree.view.refresh();
		});
		// sharing info
		$( "#share-menu-share-tree", _sandbox.context ).live( "click", function () {
			// $.fancybox({
			// 	content: $( "#perma-link" ).html(),
			// });
			// return false;
		});
		// methods
		return {
			// begin with welcome modal
			welcome: function() {
				$.fancybox( $("#welcome").html(), _fb_options );
			},
			// show loading for key and url hashes
			loading: function() {
				// show overlay and loading
				$.fancybox.showLoading();
			},
			// respond to external actions
			handle: function( type, data ) {
				switch ( type ) {
					// create the list
					case "pb-treefocus": case "pb-cladeflipped":
						// hide doc loader
						$.fancybox.hideLoading();
						break;
					case "pb-treesave":
						// save silently
						if ( $( "#fancybox-loading" ).css( "display" ) != "none" ) {
							// hide loader
							$.fancybox.hideActivity();
							// show saved modal
							$.fancybox( $("#tree-saved").html(), $.extend( _fb_options, { width: 350, height: 200 } ) );
						}
						break;
					case "pb-cladeflip":
						// show overlay and loading 
						$.fancybox.showLoading();
						break;
					case "pb-history-change":
					    _appendHistory.apply( this, data );
					    break;
				}
			}
		};
	};
	// yep, the toolbar
	var Toolbar = function( s ) {
		// vars
		var _sandbox = s, _activeTool;
		// widget specific markup
		var wHTML = ( function () {
			var html = '<div id="toolbar">';
			html += 		'<nav>';
			html += 			'<ul>';
			html += 				'<li><a href="javascript:;" id="select" class="tool"><img src="' + HOME + 'static/gfx/tools/select.png" alt="select-tool" title="Select" /></a></li>';
			html += 				'<li><a href="javascript:;" id="translate" class="tool"><img src="' + HOME + 'static/gfx/tools/translate.png" alt="translate-tool" title="Translate" /></a></li>';
			html += 				'<li style="padding-right:30px;"><a href="javascript:;" id="rotate" class="tool"><img src="' + HOME + 'static/gfx/tools/rotate.png" alt="rotate-tool" title="Rotate" /></a></li>';
			html += 				'<li><a href="javascript:;" id="zin" class="tool"><img src="' + HOME + 'static/gfx/tools/zin.png" alt="zoom-in-tool" title="Zoom In" /></a></li>';
			html += 				'<li><a href="javascript:;" id="zout" class="tool"><img src="' + HOME + 'static/gfx/tools/zout.png" alt="zoom-out-tool" title="Zoom Out" /></a></li>';
			html += 				'<div class="clear"></div>';
			html += 			'</ul>';
			html += 		'</nav>';
			html += '</div>';
			return html;
		})();
		// get mouse position relative to tree
		function _viewMouse( e, c ) {
			// mouse
			var m = mouse_( e );
			// coords
			vx = m.x - c.offset().left;
			vy = m.y - c.offset().top;
			// format
			return { x: vx, y: vy };
		}
		// tools
		$( ".tool", _sandbox.context ).live( "click", function () {
			// check unavailable
			if ( $( this ).hasClass( "tool-off" ) ) 
				return false;
			// check already active
			if ( $( this ).hasClass( "tool-active" ) ) 
				return false;
			// clear style
			$( "#" + _activeTool, _sandbox.context ).removeClass( "tool-active" );
			// add style
			$( this ).addClass( "tool-active" );
			// set to active
			_activeTool = this.id;
		});
		$( ".tool", _sandbox.context ).live( "mousedown", function ( e ) {
			// prevent image drag behavior
			if ( e.preventDefault ) e.preventDefault();
		});
		// get all
		var canvases = $( ".tree-holder canvas", _sandbox.context );
		// canvas tools
		canvases.live( "click", function ( e ) {
			// set active if not
			if ( this.id == _sandbox.activeTree.view.id ) 
				return false;
			else {
				// notify sandbox
				_sandbox.notify( "pb-clearnode" );
				// notify sandbox
				_sandbox.notify( "pb-treefocus", $( this ).data( "view" ).tree );
				// trigger mouseenter for cursor
				$( this ).trigger( "mouseenter" );
			}
		});
		canvases.live( "mousedown", function ( e ) {
			// check if active
			if ( this.id != _sandbox.activeTree.view.id ) 
				return false;
			// save reference
			var canvas = $( this );
			// trigger event
			canvas.trigger( "pb-" + _activeTool, ["mousedown", _viewMouse( e, canvas )] );
			// add move event
			canvas.bind( "mousemove", function ( e ) {
				// trigger event
				canvas.trigger( "pb-" + _activeTool, ["mousemove", _viewMouse( e, canvas )] );
			});
			// add up event
			$( document ).bind( "mouseup", function ( e ) {
				// unbind events
				canvas.unbind( "mousemove" );
				$( this ).unbind( "mouseup" );
				// trigger event
				canvas.trigger( "pb-" + _activeTool, ["mouseup", _viewMouse( e, canvas )] );
			});
		});
		canvases.live( "mouseenter", function ( e ) {
			// check if active
			if ( this.id != _sandbox.activeTree.view.id ) { 
				$( this ).css( "cursor", "default" );
				return false;
			}
			var pre = WIDGET ? HOME : "";
      // // set cursor
      // switch( _activeTool ) {
      //  case "select": case "flip":
      //    $( this ).css( "cursor", "default" );
      //    break;
      //  case "translate":
      //    $( this ).css( "cursor", "url(" + pre + "static/gfx/tools/mouse-translate.png) 8 8, auto" );
      //    break;
      //  case "rotate":
      //    $( this ).css( "cursor", "url(" + pre + "static/gfx/tools/mouse-rotate.png) 8 8, auto" );
      //    break;
      //  case "zin":
      //    $( this ).css( "cursor", "url("+pre+"static/gfx/tools/mouse-zin.png) 6 6, auto" );
      //    break;
      //  case "zout":
      //    $( this ).css( "cursor", "url("+pre+"static/gfx/tools/mouse-zout.png) 6 6, auto" );
      //    break;    
      // }
		});
		canvases.live( "mouseleave", function ( e ) {
			// check if active
			if ( this.id != _sandbox.activeTree.view.id ) return false;
			// notify sandbox
			_sandbox.notify( "pb-treeblur" );
		});
		canvases.live( "mousemove", function ( e ) {
			// check if active
			if ( this.id != _sandbox.activeTree.view.id ) return false;
			// save reference
			var canvas = $( this );
			// trigger event
			canvas.trigger( "pb-" + _activeTool, ["mousesearch", _viewMouse( e, canvas )] );
		});
		canvases.live( "dblclick", function ( e ) {
			// check if active
			if( this.id != _sandbox.activeTree.view.id ) return false;
			// notify sandbox
			_sandbox.notify( "pb-clearnode" );
		});
		// methods
		return {
			// respond to external actions
			handle: function( type, data ) { 
				switch ( type ) {
					// set active tree
					case "pb-treefocus":
						// don't if a tree exists already
						if ( _sandbox.trees.length > 1 ) 
							return false;
						// default tool is select
						$( "#select", _sandbox.context ).addClass( "tool-active" );
						_activeTool = "select";
						break;
					case "pb-reset":
						// clear style
						$( "#" + _activeTool, _sandbox.context ).removeClass( "tool-active" );
						_activeTool = null;
						break;
				}
			}
		};
	};
	// drawing surface for trees
	var TreeEditor = function( s ) {
		// vars
		var _sandbox = s;
		// widget specific markup
		var wHTML = "";
		// methods
		return {
			// respond to external actions
			handle: function( type, data ) {
				switch ( type ) {
					// set active tree
					case "pb-treefocus":
						// grid the trees
						$( ".tree-holder", _sandbox.context ).each( function( i ) {
							$( this ).css( "height", ( 100 / _sandbox.trees.length ) + "%" );
						});
						// auto-fit
						if ( _sandbox.trees.length > 1 ) 
							$( window ).trigger( "resize" );
						break;
					case "pb-treeblur":
						// redraw tree
						_sandbox.activeTree.view.refresh();
						break;
					case "pb-treeplot":
						// replot tree
						_sandbox.activeTree.view.replot();
					case "pb-treedraw":
						// redraw tree
						_sandbox.activeTree.view.refresh();
					// hover over a node
					case "pb-nodehover":
						// redraw tree
						_sandbox.activeTree.view.refresh();
						break;
					// move away from node
					case "pb-nodeexit":
						// redraw tree
						_sandbox.activeTree.view.refresh();
						break;
					// set selected node and redraw
					case "pb-nodeclick":
						// clear selected
						_sandbox.activeTree.view.clearSelected();
						_sandbox.activeTree.view.setSelected( data.node );
						_sandbox.activeTree.view.selecting = true;
						_sandbox.activeTree.view.refresh();
						_sandbox.activeTree.view.selecting = false;
						break;
					// clear selected
					case "pb-clearnode":
						_sandbox.activeTree.view.clearSelected();
						_sandbox.activeTree.view.refresh();
						break;
					// flip clade at node
					case "pb-cladeflip":
						setTimeout( function () {
							// flip clade
							_sandbox.activeTree.view.tree.flip( data.node );
							// replot tree
							_sandbox.activeTree.view.replot();
							// notify sandbox
							_sandbox.notify( "pb-cladeflipped", data.node );
						}, 50);
						break;
					// remove all tree canvas holders - all else should be garbage collected
					case "pb-reset":
						$( "div.tree-holder" ).each( function ( i ) {
							$( this ).remove();
						});
						break;
				}
			}
		};
	};
	// node browser / list
	var TaxaList = function( s ) {
		// vars
		var _sandbox = s, _activeNode;
		// widget specific markup
		var wHTML = "";
		// animate taxa list to hovered node
		function _navTo( n ) {
			// go to it
			$( "#taxa > section", _sandbox.context ).scrollTo( "#" + n.link.attr( "id" ), 100, { offset: -45 } );
		}
		function _clear() {
			if ( _activeNode ) {
				_activeNode.link.removeClass( "taxa-link-selected" );
				// clear child style
				$( ".taxa-link", _sandbox.context ).each( function ( i ) {
					$( this ).css( "padding-left", "0" );
				});
			}
		}
		// init
		$( ".taxa-link", _sandbox.context ).live( "mouseenter", function () {
			// get node
			var node = $( this ).data( "node" );
			// set hover
			node.hover = true;
			// notify sandbox
			_sandbox.notify( "pb-nodehover", node );
		});
		$( ".taxa-link", _sandbox.context ).live( "mouseleave", function () {
			// get node
			var node = $( this ).data( "node" );
			// set hover
			node.hover = false;
			// notify sandbox
			_sandbox.notify( "pb-nodeexit", node );
		});
		$( ".taxa-link", _sandbox.context ).live( "click", function () {
			// get node
			var node = $( this ).data( "node" );
			// notify sandbox
			_sandbox.notify( "pb-nodeclick", node );
		});
		// methods
		return {
			// respond to external actions
			handle: function( type, data ) {
				switch ( type ) {
					// create the list
					case "pb-treefocus": case "pb-cladeflipped":
						// use active tree
						var node_list = _sandbox.activeTree.node_list;
						// order nodes by id
						var nodes = [];
						for ( var i = 0; i < node_list.length; i++ ) 
							nodes[i] = node_list[i];
						nodes.sort( function( a, b ) {
							return a.id - b.id; 
						});
						// get taxa list
						var taxa = $( "#taxa > section > ul", _sandbox.context );
						// empty taxa
						taxa.empty();
						// walk nodes
						for ( var n = 0; n < nodes.length; n++ ) {
							var node = nodes[n];
							// color dot
							var info = "<div class='taxa-right'>";
								info += 	"<div class='ex' style='" + ( node.visibility ? "display:none" : "" ) + "'>x</div>";
								info += 	"<div class='dot' style='background:#" + node.color + ";'></div>";
								info += "</div>";
							// add to doc
							taxa.append( "<li><a href='javascript:;' id='nl-" + node.id + "' class='taxa-link'>" + info + "<span class='taxa-link-text'>" + node.title + "</span></a></li>" );
							// add node as data to link
							var l = $( "#nl-" + node.id, _sandbox.context );
							l.data( "node", node );
							// save link to node
							node.link = l;
						}
						break;
					// hover over a node
					case "pb-nodehover":
						// set style
						data.node.link.addClass( "taxa-link-hover" );
						// go to it
						if ( data.found ) 
							_navTo( data.node );
						break;
					// move away from node
					case "pb-nodeexit":
						// check node
						if ( ! data.node ) 
							return false;
						// set style
						data.node.link.removeClass( "taxa-link-hover" );
						// go back to selected
						if ( _sandbox.activeTree.view.selected_node && data.found )
							_navTo( _sandbox.activeTree.view.selected_node );
						break;
					// set selected node in list
					case "pb-nodeclick":
						// clear first
						_clear();
						// store locally too for clear
						_activeNode = data.node;
						// set style
						_sandbox.activeNode.link.addClass( "taxa-link-selected" );
						// go to it if not using list to navigate
						if ( data.found ) _navTo( _sandbox.activeNode );
						// walk kids
						( function( n ) {
							for ( var c = 0; c < n.children.length; c++ ) {
								n.children[c].link.css( "padding-left", "20px" );
								arguments.callee( n.children[c] );
							}
						})( _sandbox.activeNode );
						break;
					// clear selected
					case "pb-clearnode":
						_clear();
						break;
					// clear list
					case "pb-reset":
						// get taxa list
						var taxa = $( "#taxa > section > ul", _sandbox.context );
						// empty taxa
						taxa.empty();
						// clear active
						_activeNode = null;
						break;
				}
			}
		};
	};
	// node / clade info panel
	var CladeInfo = function( s ) {
		// vars
		var _sandbox = s;
		// widget specific markup
		var wHTML = "";
		// wipe out title and body
		function _clear( all ) {
			// title
			$( ".panel-head", $( "#node" , _sandbox.context ) ).text( "Node" );
			// body
			if ( all )
				$( "#node > section", _sandbox.context ).html( "" );
			else
				$( "#node > section", _sandbox.context ).html( "<h2 class='prop-title nodes-blank'>Select a node to see its properties.</h2>" );
		}
		// editable cells
		$( ".editable", _sandbox.context ).live( "click", function () {
			// save ref
			var __this = this;
			// return if already editing
			if ( $( this ).hasClass( "editing" ) ) 
				return false;
			$( this ).addClass( "editing" );
			// show input
			$( this ).hide();
			$( this.nextElementSibling ).show().focus();
			// exit
			var done = function() {
				$( document ).unbind( "click", done );
				$( __this.nextElementSibling ).unbind( "keyup", done );
				$( __this ).removeClass( "editing" );
				$( __this ).text( $( __this.nextElementSibling ).val() );
				$( __this.nextElementSibling ).hide();
				$( __this ).show();
			}
			$( document ).bind( "click", done );
			$( this.nextElementSibling).bind( "keyup", "return", done );
		});
		// change clade color
		$( "#node-prop-cl", _sandbox.context ).live( "change", function () {
			// set color
			_sandbox.activeNode.color = $( this ).val();
			// walk kids
			( function ( n ) {
				for ( var c = 0; c < n.children.length; c++ ) {
					n.children[c].color = _sandbox.activeNode.color;
	            	arguments.callee( n.children[c] );
	        	}
			})( _sandbox.activeNode );
			// prepare view
			_sandbox.activeTree.view.update_links = true;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// clade toggle
		$( "#node-prop-vb", _sandbox.context ).live( "change", function () {
			// toggle
			_sandbox.activeNode.visibility = ! _sandbox.activeNode.visibility;
			// walk kids
			( function ( n ) {
				for ( var c = 0; c < n.children.length; c++ ) {
					n.children[c].visibility = _sandbox.activeNode.visibility;
	            	arguments.callee( n.children[c] );
	        	}
			})( _sandbox.activeNode );
			// prepare view
			_sandbox.activeTree.view.update_links = true;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		/// methods
		return {
			// respond to external actions
			handle: function( type, data ) {
				switch ( type ) {
					// clear clade info
					case "pb-treefocus":
						// clear selected
						_clear();
						break;
					// show selected clade info
					case "pb-nodeclick":
						// set node title
						var title = _sandbox.activeNode.title;
						$( ".panel-head", $( "#node", _sandbox.context ) ).html( "Node -" + title.substring( 13, title.length - 1 ) );
						// check parent
						var vis = _sandbox.activeNode.parent && _sandbox.activeNode.parent.visibility ? "" : "disabled='disabled'";
						// check kids
						var is_clade = _sandbox.activeNode.n_children > 0;
						// init html
						var clade, uri;
						// write clade table
						clade = "<table>";
						clade += 	"<caption>Clade Properties</caption>";
						clade += 	"<tbody>";
						clade +=		"<tr>";
						clade += 			"<td align='right'>color</td>";
						clade += 			"<td>";
						clade +=				"<span class='editable editable-prop'>" + _sandbox.activeNode.color + "</span>";
						clade +=				"<input type='text' class='editable-field editable-field-long' id='node-prop-cl' value='" + _sandbox.activeNode.color + "' />";
						clade +=			"</td>";
						clade +=		"</tr>";
						clade +=		"<tr>";
						clade += 			"<td align='right'>toggle</td>";
						clade += 			"<td>";
						clade +=				_sandbox.activeNode.visibility ? "<input type='checkbox' id='node-prop-vb' checked='checked' " + vis + " />" : "<input type='checkbox' id='node-prop-vb' " + vis + " />";
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
						if ( is_clade ) 
							$( "#node > section", _sandbox.context ).html( clade + uri ); 
						else 
							$( "#node > section", _sandbox.context ).html( uri );
						break;
					// clear selected
					case "pb-clearnode":
						_clear();
						break;
					// clear selected and head
					case "pb-reset":
						_clear( true );
						break;
				}
			}
		};
	};
	// tree properties / drawing options
	var TreeInfo = function( s ) {
		// vars
		var _sandbox = s;
		// widget specific markup
		var wHTML = "";
		// editable cells
		$( ".editable", _sandbox.context ).live( "click", function () {
			// save ref
			var __this = this;
			// return if already editing
			if ( $( this ).hasClass( "editing" ) ) 
				return false;
			$( this ).addClass( "editing" );
			// show input
			$( this ).hide();
			$( this.nextElementSibling ).show().focus();
			// exit
			var done = function() {
				$( document ).unbind( "click", done );
				$( __this.nextElementSibling ).unbind( "keyup", done );
				$( __this ).removeClass( "editing" );
				$( __this ).text( $( __this.nextElementSibling ).val() );
				$( __this.nextElementSibling ).hide();
				$( __this ).show();
			}
			$( document ).bind( "click", done );
			$( this.nextElementSibling).bind( "keyup", "return", done );
		});
		// change title
		$( "#tree-prop-name", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.title = $( this ).val();
			// notify sandbox
			_sandbox.notify( "pb-treeplot" );
		});
		// change background color
		$( "#tree-prop-bg", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.color = $(this).val();
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// change branch width
		$( "#tree-prop-bw", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.width = parseFloat( $(this).val() );
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// change node radius width
		$( "#tree-prop-nr", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.radius = parseFloat( $(this).val() );
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// change tree type
		$( "#tree-prop-vm", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.viewmode = parseInt( $( this ).val() );
			// notify sandbox
			_sandbox.notify( "pb-treeplot" );
		});
		// change branch length option
		$( "#tree-prop-bl", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.branchlenghts = ! _sandbox.activeTree.environment.branchlenghts;
			// notify sandbox
			_sandbox.notify( "pb-treeplot" );
		});
		// change 3d option
		$( "#tree-prop-3d", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.threeD = ! _sandbox.activeTree.environment.threeD;
			// notify sandbox
			_sandbox.notify( "pb-treeplot" );
		});
		// change boundaries option
		$( "#tree-prop-bn", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.view.boundaries = ! _sandbox.activeTree.view.boundaries;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// leaf labels
		$( "#tree-prop-ll", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.leaflabels = ! _sandbox.activeTree.environment.leaflabels;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// htu labels
		$( "#tree-prop-hl", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.htulabels = ! _sandbox.activeTree.environment.htulabels;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// branch labels
		$( "#tree-prop-bl", _sandbox.context ).live( "change", function () {
			_sandbox.activeTree.environment.branchlabels = ! _sandbox.activeTree.environment.branchlabels;
			// notify sandbox
			_sandbox.notify( "pb-treedraw" );
		});
		// methods
		return {
			// respond to external actions
			handle: function( type, data ) {
				switch ( type ) {
					// create the list
					case "pb-treefocus":
						// init html
						var name, visual, viewing, labels;
						// write name table
						name = "<table>";
						name += 	"<caption>Tree Name</caption>";
						name += 	"<tbody>";
						name +=			"<tr>";
						name += 			"<td>";
						name +=					"<span class='editable'>" + _sandbox.activeTree.title + "</span>";
						name +=					"<input type='text' class='editable-field' style='width:170px' id='tree-prop-name' value='" + _sandbox.activeTree.title + "' />";
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
						visual +=				"<span class='editable editable-prop'>" + _sandbox.activeTree.environment.color + "</span>";
						visual +=				"<input type='text' class='editable-field editable-field-long' id='tree-prop-bg' value='" + _sandbox.activeTree.environment.color + "' />";
						visual +=			"</td>";
						visual +=		"</tr>";
						visual +=		"<tr>";
						visual += 			"<td align='right'>branch width</td>";
						visual += 			"<td>";
						visual +=				"<span class='editable editable-prop'>" + _sandbox.activeTree.environment.width + "</span>";
						visual +=				"<input type='text' class='editable-field editable-field-short' id='tree-prop-bw' value='" + _sandbox.activeTree.environment.width + "' />";
						visual +=			"</td>";
						visual +=		"</tr>";
						visual +=		"<tr>";
						visual += 			"<td align='right'>node radius</td>";
						visual += 			"<td>";
						visual +=				"<span class='editable editable-prop'>" + _sandbox.activeTree.environment.radius + "</span>";
						visual +=				"<input type='text' class='editable-field editable-field-short' id='tree-prop-nr' value='" + _sandbox.activeTree.environment.radius + "' />";
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
						viewing += 					_sandbox.activeTree.environment.viewmode == 0 ? "<option value='0' selected='selected'>dendrogram</option>" : "<option value='0'>dendrogram</option>";
						viewing +=					_sandbox.activeTree.environment.viewmode == 1 ? "<option value='1' selected='selected'>cladogram</option>" : "<option value='1'>cladogram</option>";
						viewing +=					_sandbox.activeTree.environment.viewmode == 2 ? "<option value='2' selected='selected'>circular dendrogram</option>" : "<option value='2'>circular dendrogram</option>";
						viewing +=					_sandbox.activeTree.environment.viewmode == 3 ? "<option value='3' selected='selected'>circular cladogram</option>" : "<option value='3'>circular cladogram</option>";
						viewing += 				"</select>";
						viewing +=			"</td>";
						viewing +=		"</tr>";
						viewing +=		"<tr>";
						viewing += 			"<td align='right'>branch length</td>";
						viewing += 			"<td>";
						viewing +=				_sandbox.activeTree.environment.branchlenghts ? "<input type='checkbox' id='tree-prop-bl' disabled='disabled' />" : "<input type='checkbox' id='tree-prop-bl'  disabled='disabled' />";
						viewing +=			"</td>";
						viewing +=		"</tr>";
						viewing +=		"<tr>";
						viewing += 			"<td align='right'>3D</td>";
						viewing += 			"<td>";
						viewing +=				_sandbox.activeTree.environment.threeD ? "<input type='checkbox' id='tree-prop-3d' checked='checked' />" : "<input type='checkbox' id='tree-prop-3d' />";
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
						labels +=				_sandbox.activeTree.environment.leaflabels ? "<input type='checkbox' id='tree-prop-ll' checked='checked' />" : "<input type='checkbox' id='tree-prop-ll' />";
						labels +=			"</td>";
						labels +=		"</tr>";
						labels +=		"<tr>";
						labels += 			"<td align='right'>HTU labels</td>";
						labels += 			"<td>";
						labels +=				_sandbox.activeTree.environment.htulabels ? "<input type='checkbox' id='tree-prop-hl' checked='checked' />" : "<input type='checkbox' id='tree-prop-hl' />";
						labels +=			"</td>";
						labels +=		"</tr>";
						// labels +=		"<tr>";
						// labels += 			"<td align='right'>branch labels</td>";
						// labels += 			"<td>";
						// labels +=				_sandbox.activeTree.environment.branchlabels ? "<input type='checkbox' id='tree-prop-bl' checked='checked' disabled='disabled' />" : "<input type='checkbox' id='tree-prop-bl' disabled='disabled' />";
						// labels +=			"</td>";
						// labels +=		"</tr>";
						labels +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
						labels += 	"</tbody>";
						labels += "</table>";
						// add to doc
						$( "#doc > section", _sandbox.context ).html( name + visual + viewing + labels );
						break;
					case "pb-reset":
						$( "#doc > section", _sandbox.context ).html( "" );
						break;
				}
			}
		};
	};
	// simple feedback bar
	var Feedback = function( s ) {
		// vars
		var _sandbox = s;
		// widget specific markup
		var wHTML = "";
		// methods
		return {
			// respond to external actions
			handle: function( type, data ) {  }
		};
	};
/*###########################################################################
####################################################################### UTILS
###########################################################################*/
	// get true mouse position
	function mouse_( e ) {
		var px = 0;
		var py = 0;
		if ( ! e ) 
			var e = window.event;
		if ( e.pageX || e.pageY ) {
			px = e.pageX;
			py = e.pageY;
		} else if ( e.clientX || e.clientY ) {
			px = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			py = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		// format
		return { x: px, y: py };
	}
	// hex test
	function isHex_( c ) {
		var hex = /^([0-9a-f]{1,2}){3}$/i; 
		return hex.test( c ) ? "#" + c : c; 
	}
	// color test
  function compHex_( o ) {
    var c = o, hex = "";
    function hexToR( h ) {
			return parseInt( ( cutHex( h ) ).substring( 0, 2 ), 16 );
		}
    function hexToG( h ) { 
			return parseInt( ( cutHex( h ) ).substring( 2, 4 ), 16 );
		}
    function hexToB( h ) {
			return parseInt( ( cutHex( h ) ).substring( 4, 6 ), 16 );
		}
    function cutHex( h ) {
			return h.charAt( 0 ) == "#" ? h.substring( 1, 7 ) : h;	
		}
    c = cutHex( c );
    hexToR( c ) < 128 ?
        hex = hex + "FF" :
        hex = hex + "00" ;
    hexToG( c ) < 128 ?
        hex = hex + "FF" :
        hex = hex + "00" ;
    hexToB( c ) < 128 ?
        hex = hex + "FF" :
        hex = hex + "00" ;
    return hex.length < o.length ? "#" + hex : hex;
  }
	// throw an error to console and exit
	function error_( e ) {
		console.log( "PhyloBox Error: " + e );
		return false;
	}
	// extend native canvas - draws a dotted circle
  CanvasRenderingContext2D.prototype.dottedArc = function( x, y, radius, startAngle, endAngle, anticlockwise ) {
		var g = Math.PI / radius / 2, sa = startAngle, ea = startAngle + g;
		while ( ea < endAngle ) {
			this.beginPath();
			this.arc( x, y, radius, sa, ea, anticlockwise );
			this.stroke(); 
			sa = ea + g;
			ea = sa + g;
		}
	};
/*###########################################################################
############################################################## PUBLIC METHODS
###########################################################################*/
	return {
		// constructor
		Viz: function( phylobox_container_div_id, phylobox_environment_options ) {
			// use native container if none given here
			var _context = WIDGET ? $( "#" + phylobox_container_div_id ) : $( "body" );
			// options
		   	var _options = $.extend({
		        background: null,
		        viewMode: null,
		        threeD: null,
		        htuLabels: null,
		        leafLabels:  null,
		        labelSize:  8,
		        branchColor: null,
		        branchWidth: null,
		        nodeRadius: null,
		        title: null,
				tools: false,
				taxalist: false,
				cladeinfo: false,
				treeinfo: false,
				feedback: false,
				method: 'byKey', // to be appended to the end of the query url so /api/lookup/ becomes /api/lookup/byKey
				params: null  // parameters to be passed via lookup other than key
		    }, phylobox_environment_options );
			// make a sandbox
			var _sandbox = new _Sandbox( _context, _options );
			// to collect modules
			var modules = [];
			// for app only
			if ( ! WIDGET ) {
				// for main app only
				var _face = new _Interface( _context );
				var _nav = new Navigation( _sandbox );
				// make all modules
				modules.push( _nav );
				modules.push( new Toolbar( _sandbox ) );
				modules.push( new TreeEditor( _sandbox ) );
				modules.push( new TaxaList( _sandbox ) );
				modules.push( new CladeInfo( _sandbox ) );
				modules.push( new TreeInfo( _sandbox ) );
				modules.push( new Feedback( _sandbox ) );
			}
			// make only requested modules
			else {
				// wrap widget
				if ( _options.shadow ) {
					_context.wrap("<div class='pb-widget'>");
					$( _context[0].parentNode ).css({ width: _context.width(), height: _context.height() + 26 });
				}
				// navigation module not available in widget mode... could be though?
				if ( _options.tools ) 
					modules.push( new Toolbar( _sandbox ) );
				// tree editor required... obvi!
				modules.push( new TreeEditor(  _sandbox ) );
				if ( _options.taxalist ) 
					modules.push( new TaxaList( _sandbox ) );
				if ( _options.cladeinfo ) 
					modules.push( new CladeInfo( _sandbox ) );
				if ( _options.treeinfo ) 
					modules.push( new TreeInfo( _sandbox ) );
				if ( _options.feedback ) 
					modules.push( new Feedback( _sandbox ) );
			}
			// register all created modules
			for ( var m = 0; m < modules.length; m++ )
				_sandbox.register( modules[m] );
			// methods --> available to user
			return {
				// adds a tree which will get focus
				drawTree: function( type, value ) {
					// get data
					switch ( type ) {
						case "group":
							_sandbox.load( value, true );
							break;
						case "key": case "url":
							_sandbox.load( value );
							break;
						case "app":
							if ( window.location.hash ) {
								// start with loading
								_nav.loading();
								// load hash key or url
								_sandbox.load( window.location.hash.substr(1) );	
							} else
								// show modal window
								_nav.welcome();
							break;
						default:
							alert( "Oops! Something's not configured properly. Please check our wiki for more information on developing with PhyloBox. \
									\n\nhttps://github.com/andrewxhill/PhyloBox/wiki/_pages/\n\n"
							);
							break;
					}
				},
				// registers an event with a PhyloBox instance
				addListener: function( t, h ) {
					_context.bind( t, h );
				},
				// removes an event with a PhyloBox instance
				removeListener: function( t, h ) { 
					_context.unbind( t, h );
				}
			}
		}
	};
//####################################################################### END
})( jQuery );