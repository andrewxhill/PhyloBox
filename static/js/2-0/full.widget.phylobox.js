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
PhyloBox = function( $ ) {
	// constants
	var HOST = window.location.host,
		WIDGET = HOST != "localhost:8080" && 
			HOST != "phylobox.appspot.com" && 
			HOST != "2-0.latest.phylobox.appspot.com",
		LOCAL = true,
		HOME = LOCAL ? "http://localhost:8080/" : "http://2-0.latest.phylobox.appspot.com/";
	var API_TREE = HOME + "api/lookup/queryTreeByKey",
		API_GROUP = HOME + "api/group",
		API_NEW = HOME + "api/new",
		API_SAVE_TREE = HOME + "api/save",
		RX_URL = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
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
					var sib = this.parentNode.parentNode.parentNode.parentNode.previousElementSibling.previousElementSibling.lastElementChild.previousElementSibling;
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
				_io = new _IO( _context, this, API_GROUP, "json", "#doc-loader" );
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
						for ( var m in _modules ) 
							_modules[m].handle( type, { tree: _activeTree } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree }] );
						break;
					case "pb-treeblur":
					case "pb-treeplot":
					case "pb-treedraw":
						// tell local modules
						for ( var m in _modules ) 
							_modules[m].handle( type, { tree: _activeTree } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree }] );
						break;
					case "pb-treesave":
						alert( "Your tree has been saved. Sick!" );
						break;
					case "pb-treepan":
					case "pb-treerotate":
					case "pb-treezoomin":
					case "pb-treezoomout":
						// tell local modules
						for ( var m in _modules ) 
							_modules[m].handle( type, { tree: _activeTree, node: _activeNode, offsets: data } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree, node: _activeNode, offsets: data }] );
						break;
					case "pb-nodehover":
					case "pb-nodeexit":
						// tell local modules
						for ( var m in _modules )
							_modules[m].handle( type, { tree: _activeTree, node: data, found: flag } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree, node: data }] );
						break;
					case "pb-nodeclick":
						// save active node
						_activeNode = data;
						// tell local modules
						for ( var m in _modules )
							_modules[m].handle( type, { tree: _activeTree, node: _activeNode, found: flag } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree, node: _activeNode }] );
						break;
					case "pb-clearnode":
						// tell local modules
						for ( var m in _modules )
							_modules[m].handle( type, { tree: _activeTree } );
						// tell anyone else who might be interested
						_context.trigger( type, [{ tree: _activeTree }] );
						break;
					default: error_( "can't notify: invalid event type..." );
				}
			},
			load: function( data, group ) {
				// check group
				if( group )
					// get the tree keys from the api
					_io.request( "load", "g=" + data );
				else {
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
				}
			},
			receive: function( type, data ) {
				// do something
				switch ( type ) {
					case "load":
						// loop over trees
						for ( var k in data ) {
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
			saveTree: function() {
				// redraw tree
				_activeTree.save();
			},
			// gets
			get context() { return _context; },
			get options() { return _options; },
			get trees() { return _trees; },
			get activeTree() { return _activeTree; },
			get activeNode() { return _activeNode; }
		}.init();
	};
/*###########################################################################
########################################################################## IO
###########################################################################*/
	var _IO = function( x, c, s, dt, l ) {
		// private vars
		var _context, _caller, _server, _dataType, _loader;
		// show / hide loading icon (if exists)
		function _loading( vis ) {
			vis ? 
				$( _loader, _context ).fadeIn( "fast" ) : 
				$( _loader, _context ).fadeOut( "slow", function () {
					$( this ).hide(); 
				}); 
		}
		// init
		if ( ! x || ! c || ! s || ! dt || ! l ) 
			return error_( "invalid arguments..." );
		_context = x; _caller = c; _server = s; _dataType = dt; _loader = l;
		// methods
		return {
			// make a data request
			request: function( a, q, s ) {
				_loading( true );
				var type = WIDGET ? undefined : "POST";
					server = s || _server,
					query = WIDGET ? q + "&callback=?" : q;
				$.ajax({
		  			type: type, 
					url: server, 
					data: query, 
					dataType: "json",
					complete: function( request ) {  },
					success: function( json ) {
						_loading( false );
						if ( ! json || json == 404 ) return error_( "nothing received..." );
						_caller.receive( a, json );
					},
					error: function( e ) {
						_loading( false );
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
					for ( var i in this.taxonomy ) {
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
			_data = [], _data_clone = [], _tree_data = [], _node_list = [], _nodes = [],
			_n_leaves = 0, _n_layers = 0, _title, _environment;
		// make tree object
		function _nest( rid ) {
			// root node?
			if ( ! rid ) 
				return error_( "no root node provided for nest..." );
			// get the root json object
			var root = _find( _tree_data, "id", rid );
			// exit if invalid
			if ( ! root )
			 	return error_( "invalid tree root id" );
			// ensure proper tree direction
			if ( root.parent_id ) {
				// if root is leaf, root's parent becomes root
				if ( ! root.children ) root = _find( _tree_data, "id", root.parent_id );
				// parent -> child
				root.children.push( { "id": root.parent_id } );
				// child -> parent
				var parent = _find( _tree_data, "id", root.parent_id );
				for ( var c in parent.children ) 
					if ( parent.children[c].id == root.id ) 
						parent.children.splice( parent.children.indexOf( parent.children[c] ), 1 );
				// for ( var c in parent.children ) if ( parent.children[c].id == root.id ) delete parent.children[c];
				if ( parent.children.length == 0 ) 
					parent.children = null;
				// rename parents
				root.parent_id = null;
				parent.parent_id = root.id;
			}
			// make the tree
			_n_leaves = 0; _n_layers = 0;
			_node_list = [];
			_nodes = new _Node( rid );
			_nodes.is_root = true;
			_branch( _nodes, root );
			// add extra properties
			for ( var n in _node_list ) {
				// assign layers
				if ( _node_list[n].is_leaf ) 
					_node_list[n].layer = _n_layers - 1;
				else
					_node_list[n].layer = _node_list[n].n_parents;
				// assign siblings
				for ( var c in _node_list[n].children ) {
					var s = _node_list[n].children.slice( 0 );
					s.splice( s.indexOf( s[c] ), 1 );
					_node_list[n].children[c].siblings = s;
				}
				// give it a title
				_node_list[n].build_title();
			}
		}
		// walk node children
		function _branch( n, d ) {
			// ensure proper tree direction
			for ( var c in d.children ) {
				if ( ! d.children[c] ) continue;
				var cd = _find( _tree_data, "id", d.children[c].id );
				// if ( cd.parent_id && cd.parent_id != d.id ) {
				if ( cd.parent_id != d.id ) {
					// parent -> child
					cd.children.push( { "id": cd.parent_id } );
					// child -> parent
					var cpd = _find( _tree_data, "id", cd.parent_id );
					for ( var cc in cpd.children ) 
						if ( cpd.children[cc].id == cd.id ) 
							cpd.children.splice( cpd.children.indexOf( cpd.children[cc] ), 1 );
					// for ( cc in cpd.children ) if ( cpd.children[cc].id == cd.id ) delete cpd.children[cc];
					if ( cpd.children.length == 0 ) cpd.children = null;
					// rename parents
					cd.parent_id = d.id;
					cpd.parent_id = cd.id;
				}
			}
			// set color
			n.color = d.color;
			// set uri links
	        n.uri = d.uri;
	        // set name
			if ( d.name ) 
				n.name = d.name;
	        else if ( d.taxonomy && d.taxonomy.scientific_name ) 
				n.name = d.taxonomy.scientific_name;
			// set taxonomy
			n.taxonomy = d.taxonomy;
			// set visibility
			n.visibility = d.visibility;
			// set length
			n.length = d.length;
			// move down tree
			if ( ! d.children ) {
				n.is_leaf = true;
				_n_leaves ++;
			} else 
				for ( var c in d.children ) {
					if ( ! d.children[c] ) continue;
					var cn = new _Node( d.children[c].id );
					n.add_child( cn );
					cn.parent = n;
					cn.n_parents = n.n_parents + 1;
					_branch( cn, _find( _tree_data, "id", cn.id ) );
				}
			// max number parents = tree's layer count
			if ( _n_layers <= n.n_parents ) _n_layers = n.n_parents + 1;
			// collect node ref for list
			_node_list.push( n );
		}
		// return object with unique requested property
		function _find( o, p, v ) {
			// returns false if not unique !
			var r, n = 0;
			for ( var i in o ) 
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
				// save key
				_key = typeof data == "string" ? data : data.k;
				// make and attach a tree holder
				var holder = $( "<div class='tree-holder' />" );
				if ( _sandbox.context.tagName == "BODY" || _sandbox.context[0].tagName == "BODY" ) 
					holder.appendTo( "#trees > section" );
				else 
					holder.appendTo( _sandbox.context );
				// add toolbox?
				if( WIDGET && _sandbox.options.tools )
					$( toolbar__ ).prependTo( holder[0].parentNode );
				// create view
	            if ( typeof data == "string" && RX_URL.test( data ) ) 
					_key = ( ( ( 1 + Math.random() ) * 0x10000 ) | 0 ).toString( 16 ).substring( 1 );
				var pt = WIDGET && _sandbox.options.tools ? 40 : 20;
	            _view = new _Engine.View( _sandbox, _key, holder, { t: pt, r: 20, b: 20, l: 20 }, true, 20, true );
	            // initialize io
				_io = new _IO( _sandbox.context, this, API_TREE, "json", "#tree-loader-" + _view.id );
				// load data or go on
				typeof data == "string" ? 
					RX_URL.test( data ) ? 
						_io.request( "load", "phyloUrl=" + data, API_NEW ) : 
						_io.request( "load", "k=" + _key ) : 
					this.receive( "load", data );
			},
			// receives data from the server
			receive: function( type, data ) {
				// save ref
				var __this = this;
				// do something with it
				switch ( type ) {
					case "load":
						// make tree
						this.make( data );
						// bind handler for tree ready
						$( "#" + _view.id, _sandbox.context ).bind( "viewready", function( e ) {
							// unbind
							$( e.target ).unbind( "viewready", arguments.callee );
							// notify sandbox
							_sandbox.notify( "pb-treefocus", __this );
						});
						// plot
						_view.plot( this );
						// go
						_view.begin();
	                    // change the url hash to the new destination
						if ( ! WIDGET )
							RX_URL( window.location.hash.substr( 1 ) ) ?
								window.location.hash = window.location.hash.substr( 1 ) :
								window.location.hash = _key;
						break;
					case "save":
						// notify sandbox
						_sandbox.notify( "pb-treesave", __this );
						break;
				}
			},
			// collect data
			make: function( data ) {
				// store data
				_data = data;
				// nest this tree around the root
				var ir = _data.environment.root ? 
					_data.environment.root : 
					_data.root ? 
						_data.root : 
						_data.tree[0].id;
				this.nest( ir );
			},
			// pre nesting setup
			nest: function( rid ) {
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
				_environment.root = rid;
				// (re)nest
				_nest( rid );
			},
			// save tree
			save: function() {
				// update phyloJSON nodes with Node properties
				for ( var n in _node_list ) {
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
			set age( v ) { _age = v; }
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
				var _fl = 2000, 
					_vpx = 0, _vpy = 0, 
					_cx = 0, _cy = 0, _cz = 0, 
					_x = 0, _y = 0, _z = 0, 
					_r = 0, _t = 0;
				// init
				_x = pX; _y = pY; _z = pZ;
				_r = pR ? pR : 0;
				_t = pT ? pT : 0;
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
							// scale radius on depth
							var scale = ( _point.z + 3000 ) / 6000;
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
							// branch label -- coming soon
							if ( _view.tree.environment.branchlabels ) {  }
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
				// improvable line depth calc
				function _depth() { 
					return Math.max( Math.min( _pointA.z, _pointB.z ), 0.0001 ); 
				}
				// for shading
				function _dimming() {
					// calc dimming
					return Math.abs(1 / _depth() )*100;
				}
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
				     	// set styles
				        ctx.strokeStyle = isHex_( _node.color );
				        ctx.globalAlpha = _dimming();
				        ctx.lineWidth  = _view.tree.environment.width;
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
				var _sandbox = sandbox, 
					_inited = false, 
					_id, _canvas, _tree, 
					_delay = 50, 
					_holder, _padding, _single = false, 
					_width = 0, _height = 0, _full = full,
					_int_id, _ctx,
					_vpx = 0, _vpy = 0, 
					_cx = 0, _cy = 0, _cz = 0, 
					_dx = 0, _dy = 0, _dz = 0, 
					_ax = 0, _ay = 0, _az = 0, 
					_max_z = 0, _gap = 0, _h_radius = 10,
					_fm = { x: 0, y: 0 }, _m = { x: 0, y: 0 }, _f = { x: 0, y: 0, n: null }, 
					_selecting = false, _locked = false, 
					_hovered_node, _selected_node,
					_l = [], _d = [], _cp = [],
					_update_links = false, _boundaries = false;
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
					for ( var d in _d ) {
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
					for ( var cp in _cp ) {
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
					_ctx.font = "6px Plain";
					_ctx.globalAlpha = 1;
					if ( _tree.environment.color === false )
						_ctx.clearRect( 0, 0, _c_width(), _c_height() );
					else
						_ctx.fillRect( 0, 0, _c_width(), _c_height() );
					// draw objects
					for ( var d in _d ) _d[d].draw( _ctx );
					for ( var l in _l ) _l[l].draw( _ctx );
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
					else if ( _selecting ) {
						// draw mouse
						_ctx.fillStyle = "#ff0000";
						_ctx.globalAlpha = 0.3;
						_ctx.beginPath();
						_ctx.arc( _m.x, _m.y, _h_radius, 0, 2 * Math.PI, false );
						_ctx.fill();
					}
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
							for ( var n in nodes ) {
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
							for ( var n in nodes ) {
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
							_sandbox.notify( "pb-treepan", { dx: _dx, dy: _dy } );
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
				function _zin( e, t, m ) {
					console.log( t + " by zoom in at " + m.x + ", " + m.y );
					// notify sandbox
					_sandbox.notify( "pb-treezoomin", {  } );
				}
				function _zout( e, t, m ) {
					console.log( t + " by zoom out at " + m.x + ", " + m.y );
					// notify sandbox
					_sandbox.notify( "pb-treezoomout", {  } );
				}
				// init
				_delay = 1000 / fr;
				_holder = holder;
				_padding = padding;
				_single = single;
				_width = ! _full ? pW : _holder.width() - _padding.l - _padding.r;
				_height = ! _full ? pH : _holder.height() - _padding.t - _padding.b;
				_id = "view-" + id;
				// create canvas
				_canvas = $( "<canvas style='display:none;' width='" + _c_width() + "' height='" + _c_height() + "' id='" + _id + "'></canvas>" );
				// add to document
				_canvas.appendTo( _holder );
				// text select tool fix for chrome on mousemove
				_canvas[0].onselectstart = function() { return false; };
		        // add tool events
				_canvas.bind( "pb-select", _select );
				_canvas.bind( "pb-translate", _translate );
				_canvas.bind( "pb-rotate", _rotate );
				_canvas.bind( "pb-zin", _zin );
				_canvas.bind( "pb-zout", _zout );
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
						for ( var i = 0; i < _tree.n_layers; i++ ) nls.push( [] );
						for ( var n in _tree.node_list ) nls[_tree.node_list[n].layer].push( _tree.node_list[n] );
						nls.reverse();
						// calculate coordinates
						switch ( _tree.environment.viewmode ) {
							// dendogram, cladogram
							case 0: case 1:
								var gap_x = _width / ( _tree.n_layers - 1 );
								var gap_y = _height / ( _tree.n_leaves - 1 );
								_max_z = ( _tree.n_layers - 1 ) * gap_x;
								var j = 0;
								for ( var l in nls ) {
									for ( var n in nls[l] ) {
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
								for ( var l in nls ) {
									for ( var n in nls[l] ) {
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
						for ( var n in _tree.node_list ) _d.push( new _Engine.Dot( _tree.node_list[n], this ) );
						// make lines
						this.connect( _tree.nodes );
						// zoom
						_cz = _tree.environment.threeD ? _max_z : 0;
						// update points
						for ( var d in _d ) {
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
			                for ( var d in _d )
			                    _d[d].node.color = isHex_( _sandbox.options.branchColor );
						// update control points
						for ( var cp in _cp ) {
							_cp[cp].setVanishingPoint( _vpx, _vpy );
							_cp[cp].setCenter( _cx, _cy, _cz );
							_cp[cp].x += _dx;
						 	_cp[cp].y += _dy;
						 	_cp[cp].z += _dz;
						 	_cp[cp].rotateX( _ax );
						 	_cp[cp].rotateY( _ay );
						 	_cp[cp].rotateZ( _az );
						}
						// first render
			            _ctx.fillStyle = _tree.environment.color ? isHex_( _tree.environment.color ) : "rgba( 35, 35, 47, 0.0 )";
			            _ctx.lineWidth = 1;
						_ctx.font = "6px Plain";
						_ctx.globalAlpha = 1;
						if ( _tree.environment.color === false )
							_ctx.clearRect( 0, 0, _c_width(), _c_height() );
						else
							_ctx.fillRect( 0, 0, _c_width(), _c_height() );
						// add to link style
						_update_links = true;
						// draw objects
						for ( var d in _d ) _d[d].draw( _ctx );
						for ( var l in _l ) _l[l].draw( _ctx );
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
				        for ( var c in node.children ) {
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
					get fr() { return 1000 / _delay; },
					get cx(v) { return _cx; },
					get cy(v) { return _cy; },
					get dx(v) { return _dx; },
					get dy(v) { return _dy; },
					get dz(v) { return _dz; },
					get ax(v) { return _ax; },
					get ay(v) { return _ay; },
					get az(v) { return _az; },
					get gap() { return _gap; },
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
					set h_radius( v ) { _h_radius = v; },
					set selecting( v ) { _selecting = v; },
					set hovered_node( v ) { _hovered_node = v; },
					set selected_node( v ) { _selected_node = v; },
					set update_links( v ) { _update_links = v; },
					set boundaries( v ) { _boundaries = v; }
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
	$( "#file-menu-new-file", _sandbox.context ).live( "mouseenter", function () {
		$( this.nextElementSibling ).addClass( "menu-submit-hover" );
	});
	$( "#file-menu-new-file", _sandbox.context ).live( "mouseleave", function () {
		$( this.nextElementSibling ).removeClass( "menu-submit-hover" );
	});
	$( "#file-menu-new-file", _sandbox.context ).live( "mousedown", function () {
		$( this.nextElementSibling ).addClass( "menu-submit-active" );
	});
	$( "#file-menu-new-file", _sandbox.context ).live( "mouseup", function () {
		$( this.nextElementSibling ).removeClass( "menu-submit-active" );
	});
	$( "#file-menu-new-file", _sandbox.context ).live( "change", function () {
		// hide menu
		$( document ).unbind( "click", _killMenu );
		$( _activeMenu ).removeClass( "menu-butt-active" );
		$( _activeMenu.nextElementSibling ).hide();
		_activeMenu = null;
		// show loading gif
		
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
		}
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
	// save active tree
	$( "#file-menu-save-tree", _sandbox.context ).live( "click", function () {
		// save active tree
		_sandbox.saveTree();
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
		handle: function( type, data ) {  }
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
		// clear styles
		$( ".tool", _sandbox.context ).each( function( i ) { 
			$( this ).removeClass( "tool-active" ); 
		});
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
		// set cursor
		switch( _activeTool ) {
			case "select":
				$( this ).css( "cursor", "none" );
				break;
			case "translate":
				$( this ).css( "cursor", "url(" + pre + "static/gfx/tools/mouse-translate.png) 8 8, auto" );
				break;
			case "rotate":
				$( this ).css( "cursor", "url(" + pre + "static/gfx/tools/mouse-rotate.png) 8 8, auto" );
				break;
			case "zin":
				$( this ).css( "cursor", "url("+pre+"static/gfx/tools/mouse-zin.png) 6 6, auto" );
				break;
			case "zout":
				$( this ).css( "cursor", "url("+pre+"static/gfx/tools/mouse-zout.png) 6 6, auto" );
				break;		
		}
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
				case "pb-clearnode":
					// clear selected
					_sandbox.activeTree.view.clearSelected();
					_sandbox.activeTree.view.refresh();
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
				case "pb-treefocus":
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
					for ( var n in nodes ) {
						var node = nodes[n];
						// color dot
						var info = "<div class='taxa-right'>";
						info += 	"<div class='ex' style='" + ( node.visibility ? "display:none" : "" ) + "'>x</div>";
						info += 	"<div class='dot' style='background:#" + node.color + ";'></div>";
						info += "</div>";
						// add to doc
						taxa.append( "<li><a href='javascript:;' id='nl-" + node.id + "' class='taxa-link'>" + node.title + info + "</a></li>" );
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
						for ( var c in n.children ) {
							n.children[c].link.css( "padding-left", "20px" );
							arguments.callee( n.children[c] );
						}
					})( _sandbox.activeNode );
					break;
				case "pb-clearnode":
					// clear selected
					_clear();
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
	function _clear() {
		// title
		$( ".panel-head", $( "#node" , _sandbox.context ) ).text( "Node" );
		// body
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
			for ( var c in n.children ) {
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
			for ( var c in n.children ) {
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
				case "pb-clearnode":
					// clear selected
					_clear();
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
		_sandbox.notify( "pb-treedraw" );
	});
	// change background color
	$( "#tree-prop-bg", _sandbox.context ).live( "change", function () {
		_sandbox.activeTree.environment.color = $(this).val();
		// notify sandbox
		_sandbox.notify( "pb-treedraw" );
	});
	// change branch width
	$( "#tree-prop-bw", _sandbox.context ).live( "change", function () {
		_sandbox.activeTree.environment.width = parseInt( $(this).val() );
		// notify sandbox
		_sandbox.notify( "pb-treedraw" );
	});
	// change node radius width
	$( "#tree-prop-nr", _sandbox.context ).live( "change", function () {
		_sandbox.activeTree.environment.radius = parseInt( $(this).val() );
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
					labels +=		"<tr>";
					labels += 			"<td align='right'>branch labels</td>";
					labels += 			"<td>";
					labels +=				_sandbox.activeTree.environment.branchlabels ? "<input type='checkbox' id='tree-prop-bl' checked='checked' disabled='disabled' />" : "<input type='checkbox' id='tree-prop-bl' disabled='disabled' />";
					labels +=			"</td>";
					labels +=		"</tr>";
					labels +=		"<tr><td colspan='2' class='empty'>&nbsp;</td></tr>";
					labels += 	"</tbody>";
					labels += "</table>";
					// add to doc
					$( "#doc > section", _sandbox.context ).html( name + visual + viewing + labels );
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
		        branchColor: null,
		        branchWidth: null,
		        nodeRadius: null,
		        title: null,
				tools: false,
				taxalist: false,
				cladeinfo: false,
				treeinfo: false,
				feedback: false
		    }, phylobox_environment_options );
			// make a sandbox
			var _sandbox = new _Sandbox( _context, _options );
			// to collect modules
			var modules = [];
			// for app only
			if ( ! WIDGET ) {
				// for main app only
				var _face = new _Interface( _context, _sandbox );
				// make all modules
				modules.push( new Navigation( _sandbox ) );
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
			for ( var m in modules )
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
						default: alert( "This is a blank document. Please upload your phylogeny via the File menu." );
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
}( jQuery );
var version="http://2-0.latest.phylobox.appspot.com/";(function(){var head=document.getElementsByTagName("head").item(0),style=document.createElement("link");style.type="text/css";style.rel="stylesheet";style.href=version+"static/css/2-0/widget.style.css";style.media="screen";head.appendChild(style)});var toolbar__='<div id="toolbar">';toolbar__+="<nav>";toolbar__+="<ul>";toolbar__+='<li><a href="javascript:;" id="select" class="tool"><img src="'+version+'static/gfx/tools/select.png" alt="select-tool" title="Select" /></a></li>';
toolbar__+='<li><a href="javascript:;" id="translate" class="tool"><img src="'+version+'static/gfx/tools/translate.png" alt="translate-tool" title="Translate" /></a></li>';toolbar__+='<li style="padding-right:30px;"><a href="javascript:;" id="rotate" class="tool"><img src="'+version+'static/gfx/tools/rotate.png" alt="rotate-tool" title="Rotate" /></a></li>';toolbar__+='<li><a href="javascript:;" id="zin" class="tool"><img src="'+version+'static/gfx/tools/zin.png" alt="zoom-in-tool" title="Zoom In" /></a></li>';
toolbar__+='<li><a href="javascript:;" id="zout" class="tool"><img src="'+version+'static/gfx/tools/zout.png" alt="zoom-out-tool" title="Zoom Out" /></a></li>';toolbar__+='<div class="clear"></div>';toolbar__+="</ul>";toolbar__+="</nav>";toolbar__+="</div>";(function(E,B){function ka(a,b,d){if(d===B&&a.nodeType===1){d=a.getAttribute("data-"+b);if(typeof d==="string"){try{d=d==="true"?true:d==="false"?false:d==="null"?null:!c.isNaN(d)?parseFloat(d):Ja.test(d)?c.parseJSON(d):d}catch(e){}c.data(a,b,d)}else d=B}return d}function U(){return false}function ca(){return true}function la(a,b,d){d[0].type=a;return c.event.handle.apply(b,d)}function Ka(a){var b,d,e,f,h,l,k,o,x,r,A,C=[];f=[];h=c.data(this,this.nodeType?"events":"__events__");if(typeof h==="function")h=
h.events;if(!(a.liveFired===this||!h||!h.live||a.button&&a.type==="click")){if(a.namespace)A=RegExp("(^|\\.)"+a.namespace.split(".").join("\\.(?:.*\\.)?")+"(\\.|$)");a.liveFired=this;var J=h.live.slice(0);for(k=0;k<J.length;k++){h=J[k];h.origType.replace(X,"")===a.type?f.push(h.selector):J.splice(k--,1)}f=c(a.target).closest(f,a.currentTarget);o=0;for(x=f.length;o<x;o++){r=f[o];for(k=0;k<J.length;k++){h=J[k];if(r.selector===h.selector&&(!A||A.test(h.namespace))){l=r.elem;e=null;if(h.preType==="mouseenter"||
h.preType==="mouseleave"){a.type=h.preType;e=c(a.relatedTarget).closest(h.selector)[0]}if(!e||e!==l)C.push({elem:l,handleObj:h,level:r.level})}}}o=0;for(x=C.length;o<x;o++){f=C[o];if(d&&f.level>d)break;a.currentTarget=f.elem;a.data=f.handleObj.data;a.handleObj=f.handleObj;A=f.handleObj.origHandler.apply(f.elem,arguments);if(A===false||a.isPropagationStopped()){d=f.level;if(A===false)b=false;if(a.isImmediatePropagationStopped())break}}return b}}function Y(a,b){return(a&&a!=="*"?a+".":"")+b.replace(La,
"`").replace(Ma,"&")}function ma(a,b,d){if(c.isFunction(b))return c.grep(a,function(f,h){return!!b.call(f,h,f)===d});else if(b.nodeType)return c.grep(a,function(f){return f===b===d});else if(typeof b==="string"){var e=c.grep(a,function(f){return f.nodeType===1});if(Na.test(b))return c.filter(b,e,!d);else b=c.filter(b,e)}return c.grep(a,function(f){return c.inArray(f,b)>=0===d})}function na(a,b){var d=0;b.each(function(){if(this.nodeName===(a[d]&&a[d].nodeName)){var e=c.data(a[d++]),f=c.data(this,
e);if(e=e&&e.events){delete f.handle;f.events={};for(var h in e)for(var l in e[h])c.event.add(this,h,e[h][l],e[h][l].data)}}})}function Oa(a,b){b.src?c.ajax({url:b.src,async:false,dataType:"script"}):c.globalEval(b.text||b.textContent||b.innerHTML||"");b.parentNode&&b.parentNode.removeChild(b)}function oa(a,b,d){var e=b==="width"?a.offsetWidth:a.offsetHeight;if(d==="border")return e;c.each(b==="width"?Pa:Qa,function(){d||(e-=parseFloat(c.css(a,"padding"+this))||0);if(d==="margin")e+=parseFloat(c.css(a,
"margin"+this))||0;else e-=parseFloat(c.css(a,"border"+this+"Width"))||0});return e}function da(a,b,d,e){if(c.isArray(b)&&b.length)c.each(b,function(f,h){d||Ra.test(a)?e(a,h):da(a+"["+(typeof h==="object"||c.isArray(h)?f:"")+"]",h,d,e)});else if(!d&&b!=null&&typeof b==="object")c.isEmptyObject(b)?e(a,""):c.each(b,function(f,h){da(a+"["+f+"]",h,d,e)});else e(a,b)}function S(a,b){var d={};c.each(pa.concat.apply([],pa.slice(0,b)),function(){d[this]=a});return d}function qa(a){if(!ea[a]){var b=c("<"+
a+">").appendTo("body"),d=b.css("display");b.remove();if(d==="none"||d==="")d="block";ea[a]=d}return ea[a]}function fa(a){return c.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var t=E.document,c=function(){function a(){if(!b.isReady){try{t.documentElement.doScroll("left")}catch(j){setTimeout(a,1);return}b.ready()}}var b=function(j,s){return new b.fn.init(j,s)},d=E.jQuery,e=E.$,f,h=/^(?:[^<]*(<[\w\W]+>)[^>]*$|#([\w\-]+)$)/,l=/\S/,k=/^\s+/,o=/\s+$/,x=/\W/,r=/\d/,A=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,
C=/^[\],:{}\s]*$/,J=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,w=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,I=/(?:^|:|,)(?:\s*\[)+/g,L=/(webkit)[ \/]([\w.]+)/,g=/(opera)(?:.*version)?[ \/]([\w.]+)/,i=/(msie) ([\w.]+)/,n=/(mozilla)(?:.*? rv:([\w.]+))?/,m=navigator.userAgent,p=false,q=[],u,y=Object.prototype.toString,F=Object.prototype.hasOwnProperty,M=Array.prototype.push,N=Array.prototype.slice,O=String.prototype.trim,D=Array.prototype.indexOf,R={};b.fn=b.prototype={init:function(j,
s){var v,z,H;if(!j)return this;if(j.nodeType){this.context=this[0]=j;this.length=1;return this}if(j==="body"&&!s&&t.body){this.context=t;this[0]=t.body;this.selector="body";this.length=1;return this}if(typeof j==="string")if((v=h.exec(j))&&(v[1]||!s))if(v[1]){H=s?s.ownerDocument||s:t;if(z=A.exec(j))if(b.isPlainObject(s)){j=[t.createElement(z[1])];b.fn.attr.call(j,s,true)}else j=[H.createElement(z[1])];else{z=b.buildFragment([v[1]],[H]);j=(z.cacheable?z.fragment.cloneNode(true):z.fragment).childNodes}return b.merge(this,
j)}else{if((z=t.getElementById(v[2]))&&z.parentNode){if(z.id!==v[2])return f.find(j);this.length=1;this[0]=z}this.context=t;this.selector=j;return this}else if(!s&&!x.test(j)){this.selector=j;this.context=t;j=t.getElementsByTagName(j);return b.merge(this,j)}else return!s||s.jquery?(s||f).find(j):b(s).find(j);else if(b.isFunction(j))return f.ready(j);if(j.selector!==B){this.selector=j.selector;this.context=j.context}return b.makeArray(j,this)},selector:"",jquery:"1.4.4",length:0,size:function(){return this.length},
toArray:function(){return N.call(this,0)},get:function(j){return j==null?this.toArray():j<0?this.slice(j)[0]:this[j]},pushStack:function(j,s,v){var z=b();b.isArray(j)?M.apply(z,j):b.merge(z,j);z.prevObject=this;z.context=this.context;if(s==="find")z.selector=this.selector+(this.selector?" ":"")+v;else if(s)z.selector=this.selector+"."+s+"("+v+")";return z},each:function(j,s){return b.each(this,j,s)},ready:function(j){b.bindReady();if(b.isReady)j.call(t,b);else q&&q.push(j);return this},eq:function(j){return j===
-1?this.slice(j):this.slice(j,+j+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(N.apply(this,arguments),"slice",N.call(arguments).join(","))},map:function(j){return this.pushStack(b.map(this,function(s,v){return j.call(s,v,s)}))},end:function(){return this.prevObject||b(null)},push:M,sort:[].sort,splice:[].splice};b.fn.init.prototype=b.fn;b.extend=b.fn.extend=function(){var j,s,v,z,H,G=arguments[0]||{},K=1,Q=arguments.length,ga=false;
if(typeof G==="boolean"){ga=G;G=arguments[1]||{};K=2}if(typeof G!=="object"&&!b.isFunction(G))G={};if(Q===K){G=this;--K}for(;K<Q;K++)if((j=arguments[K])!=null)for(s in j){v=G[s];z=j[s];if(G!==z)if(ga&&z&&(b.isPlainObject(z)||(H=b.isArray(z)))){if(H){H=false;v=v&&b.isArray(v)?v:[]}else v=v&&b.isPlainObject(v)?v:{};G[s]=b.extend(ga,v,z)}else if(z!==B)G[s]=z}return G};b.extend({noConflict:function(j){E.$=e;if(j)E.jQuery=d;return b},isReady:false,readyWait:1,ready:function(j){j===true&&b.readyWait--;
if(!b.readyWait||j!==true&&!b.isReady){if(!t.body)return setTimeout(b.ready,1);b.isReady=true;if(!(j!==true&&--b.readyWait>0))if(q){var s=0,v=q;for(q=null;j=v[s++];)j.call(t,b);b.fn.trigger&&b(t).trigger("ready").unbind("ready")}}},bindReady:function(){if(!p){p=true;if(t.readyState==="complete")return setTimeout(b.ready,1);if(t.addEventListener){t.addEventListener("DOMContentLoaded",u,false);E.addEventListener("load",b.ready,false)}else if(t.attachEvent){t.attachEvent("onreadystatechange",u);E.attachEvent("onload",
b.ready);var j=false;try{j=E.frameElement==null}catch(s){}t.documentElement.doScroll&&j&&a()}}},isFunction:function(j){return b.type(j)==="function"},isArray:Array.isArray||function(j){return b.type(j)==="array"},isWindow:function(j){return j&&typeof j==="object"&&"setInterval"in j},isNaN:function(j){return j==null||!r.test(j)||isNaN(j)},type:function(j){return j==null?String(j):R[y.call(j)]||"object"},isPlainObject:function(j){if(!j||b.type(j)!=="object"||j.nodeType||b.isWindow(j))return false;if(j.constructor&&
!F.call(j,"constructor")&&!F.call(j.constructor.prototype,"isPrototypeOf"))return false;for(var s in j);return s===B||F.call(j,s)},isEmptyObject:function(j){for(var s in j)return false;return true},error:function(j){throw j;},parseJSON:function(j){if(typeof j!=="string"||!j)return null;j=b.trim(j);if(C.test(j.replace(J,"@").replace(w,"]").replace(I,"")))return E.JSON&&E.JSON.parse?E.JSON.parse(j):(new Function("return "+j))();else b.error("Invalid JSON: "+j)},noop:function(){},globalEval:function(j){if(j&&
l.test(j)){var s=t.getElementsByTagName("head")[0]||t.documentElement,v=t.createElement("script");v.type="text/javascript";if(b.support.scriptEval)v.appendChild(t.createTextNode(j));else v.text=j;s.insertBefore(v,s.firstChild);s.removeChild(v)}},nodeName:function(j,s){return j.nodeName&&j.nodeName.toUpperCase()===s.toUpperCase()},each:function(j,s,v){var z,H=0,G=j.length,K=G===B||b.isFunction(j);if(v)if(K)for(z in j){if(s.apply(j[z],v)===false)break}else for(;H<G;){if(s.apply(j[H++],v)===false)break}else if(K)for(z in j){if(s.call(j[z],
z,j[z])===false)break}else for(v=j[0];H<G&&s.call(v,H,v)!==false;v=j[++H]);return j},trim:O?function(j){return j==null?"":O.call(j)}:function(j){return j==null?"":j.toString().replace(k,"").replace(o,"")},makeArray:function(j,s){var v=s||[];if(j!=null){var z=b.type(j);j.length==null||z==="string"||z==="function"||z==="regexp"||b.isWindow(j)?M.call(v,j):b.merge(v,j)}return v},inArray:function(j,s){if(s.indexOf)return s.indexOf(j);for(var v=0,z=s.length;v<z;v++)if(s[v]===j)return v;return-1},merge:function(j,
s){var v=j.length,z=0;if(typeof s.length==="number")for(var H=s.length;z<H;z++)j[v++]=s[z];else for(;s[z]!==B;)j[v++]=s[z++];j.length=v;return j},grep:function(j,s,v){var z=[],H;v=!!v;for(var G=0,K=j.length;G<K;G++){H=!!s(j[G],G);v!==H&&z.push(j[G])}return z},map:function(j,s,v){for(var z=[],H,G=0,K=j.length;G<K;G++){H=s(j[G],G,v);if(H!=null)z[z.length]=H}return z.concat.apply([],z)},guid:1,proxy:function(j,s,v){if(arguments.length===2)if(typeof s==="string"){v=j;j=v[s];s=B}else if(s&&!b.isFunction(s)){v=
s;s=B}if(!s&&j)s=function(){return j.apply(v||this,arguments)};if(j)s.guid=j.guid=j.guid||s.guid||b.guid++;return s},access:function(j,s,v,z,H,G){var K=j.length;if(typeof s==="object"){for(var Q in s)b.access(j,Q,s[Q],z,H,v);return j}if(v!==B){z=!G&&z&&b.isFunction(v);for(Q=0;Q<K;Q++)H(j[Q],s,z?v.call(j[Q],Q,H(j[Q],s)):v,G);return j}return K?H(j[0],s):B},now:function(){return(new Date).getTime()},uaMatch:function(j){j=j.toLowerCase();j=L.exec(j)||g.exec(j)||i.exec(j)||j.indexOf("compatible")<0&&n.exec(j)||
[];return{browser:j[1]||"",version:j[2]||"0"}},browser:{}});b.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(j,s){R["[object "+s+"]"]=s.toLowerCase()});m=b.uaMatch(m);if(m.browser){b.browser[m.browser]=true;b.browser.version=m.version}if(b.browser.webkit)b.browser.safari=true;if(D)b.inArray=function(j,s){return D.call(s,j)};if(!/\s/.test("\u00a0")){k=/^[\s\xA0]+/;o=/[\s\xA0]+$/}f=b(t);if(t.addEventListener)u=function(){t.removeEventListener("DOMContentLoaded",u,
false);b.ready()};else if(t.attachEvent)u=function(){if(t.readyState==="complete"){t.detachEvent("onreadystatechange",u);b.ready()}};return E.jQuery=E.$=b}();(function(){c.support={};var a=t.documentElement,b=t.createElement("script"),d=t.createElement("div"),e="script"+c.now();d.style.display="none";d.innerHTML="   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";var f=d.getElementsByTagName("*"),h=d.getElementsByTagName("a")[0],l=t.createElement("select"),
k=l.appendChild(t.createElement("option"));if(!(!f||!f.length||!h)){c.support={leadingWhitespace:d.firstChild.nodeType===3,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/red/.test(h.getAttribute("style")),hrefNormalized:h.getAttribute("href")==="/a",opacity:/^0.55$/.test(h.style.opacity),cssFloat:!!h.style.cssFloat,checkOn:d.getElementsByTagName("input")[0].value==="on",optSelected:k.selected,deleteExpando:true,optDisabled:false,checkClone:false,
scriptEval:false,noCloneEvent:true,boxModel:null,inlineBlockNeedsLayout:false,shrinkWrapBlocks:false,reliableHiddenOffsets:true};l.disabled=true;c.support.optDisabled=!k.disabled;b.type="text/javascript";try{b.appendChild(t.createTextNode("window."+e+"=1;"))}catch(o){}a.insertBefore(b,a.firstChild);if(E[e]){c.support.scriptEval=true;delete E[e]}try{delete b.test}catch(x){c.support.deleteExpando=false}a.removeChild(b);if(d.attachEvent&&d.fireEvent){d.attachEvent("onclick",function r(){c.support.noCloneEvent=
false;d.detachEvent("onclick",r)});d.cloneNode(true).fireEvent("onclick")}d=t.createElement("div");d.innerHTML="<input type='radio' name='radiotest' checked='checked'/>";a=t.createDocumentFragment();a.appendChild(d.firstChild);c.support.checkClone=a.cloneNode(true).cloneNode(true).lastChild.checked;c(function(){var r=t.createElement("div");r.style.width=r.style.paddingLeft="1px";t.body.appendChild(r);c.boxModel=c.support.boxModel=r.offsetWidth===2;if("zoom"in r.style){r.style.display="inline";r.style.zoom=
1;c.support.inlineBlockNeedsLayout=r.offsetWidth===2;r.style.display="";r.innerHTML="<div style='width:4px;'></div>";c.support.shrinkWrapBlocks=r.offsetWidth!==2}r.innerHTML="<table><tr><td style='padding:0;display:none'></td><td>t</td></tr></table>";var A=r.getElementsByTagName("td");c.support.reliableHiddenOffsets=A[0].offsetHeight===0;A[0].style.display="";A[1].style.display="none";c.support.reliableHiddenOffsets=c.support.reliableHiddenOffsets&&A[0].offsetHeight===0;r.innerHTML="";t.body.removeChild(r).style.display=
"none"});a=function(r){var A=t.createElement("div");r="on"+r;var C=r in A;if(!C){A.setAttribute(r,"return;");C=typeof A[r]==="function"}return C};c.support.submitBubbles=a("submit");c.support.changeBubbles=a("change");a=b=d=f=h=null}})();var ra={},Ja=/^(?:\{.*\}|\[.*\])$/;c.extend({cache:{},uuid:0,expando:"jQuery"+c.now(),noData:{embed:true,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:true},data:function(a,b,d){if(c.acceptData(a)){a=a==E?ra:a;var e=a.nodeType,f=e?a[c.expando]:null,h=
c.cache;if(!(e&&!f&&typeof b==="string"&&d===B)){if(e)f||(a[c.expando]=f=++c.uuid);else h=a;if(typeof b==="object")if(e)h[f]=c.extend(h[f],b);else c.extend(h,b);else if(e&&!h[f])h[f]={};a=e?h[f]:h;if(d!==B)a[b]=d;return typeof b==="string"?a[b]:a}}},removeData:function(a,b){if(c.acceptData(a)){a=a==E?ra:a;var d=a.nodeType,e=d?a[c.expando]:a,f=c.cache,h=d?f[e]:e;if(b){if(h){delete h[b];d&&c.isEmptyObject(h)&&c.removeData(a)}}else if(d&&c.support.deleteExpando)delete a[c.expando];else if(a.removeAttribute)a.removeAttribute(c.expando);
else if(d)delete f[e];else for(var l in a)delete a[l]}},acceptData:function(a){if(a.nodeName){var b=c.noData[a.nodeName.toLowerCase()];if(b)return!(b===true||a.getAttribute("classid")!==b)}return true}});c.fn.extend({data:function(a,b){var d=null;if(typeof a==="undefined"){if(this.length){var e=this[0].attributes,f;d=c.data(this[0]);for(var h=0,l=e.length;h<l;h++){f=e[h].name;if(f.indexOf("data-")===0){f=f.substr(5);ka(this[0],f,d[f])}}}return d}else if(typeof a==="object")return this.each(function(){c.data(this,
a)});var k=a.split(".");k[1]=k[1]?"."+k[1]:"";if(b===B){d=this.triggerHandler("getData"+k[1]+"!",[k[0]]);if(d===B&&this.length){d=c.data(this[0],a);d=ka(this[0],a,d)}return d===B&&k[1]?this.data(k[0]):d}else return this.each(function(){var o=c(this),x=[k[0],b];o.triggerHandler("setData"+k[1]+"!",x);c.data(this,a,b);o.triggerHandler("changeData"+k[1]+"!",x)})},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({queue:function(a,b,d){if(a){b=(b||"fx")+"queue";var e=
c.data(a,b);if(!d)return e||[];if(!e||c.isArray(d))e=c.data(a,b,c.makeArray(d));else e.push(d);return e}},dequeue:function(a,b){b=b||"fx";var d=c.queue(a,b),e=d.shift();if(e==="inprogress")e=d.shift();if(e){b==="fx"&&d.unshift("inprogress");e.call(a,function(){c.dequeue(a,b)})}}});c.fn.extend({queue:function(a,b){if(typeof a!=="string"){b=a;a="fx"}if(b===B)return c.queue(this[0],a);return this.each(function(){var d=c.queue(this,a,b);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,
a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;b=b||"fx";return this.queue(b,function(){var d=this;setTimeout(function(){c.dequeue(d,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])}});var sa=/[\n\t]/g,ha=/\s+/,Sa=/\r/g,Ta=/^(?:href|src|style)$/,Ua=/^(?:button|input)$/i,Va=/^(?:button|input|object|select|textarea)$/i,Wa=/^a(?:rea)?$/i,ta=/^(?:radio|checkbox)$/i;c.props={"for":"htmlFor","class":"className",readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",
colspan:"colSpan",tabindex:"tabIndex",usemap:"useMap",frameborder:"frameBorder"};c.fn.extend({attr:function(a,b){return c.access(this,a,b,true,c.attr)},removeAttr:function(a){return this.each(function(){c.attr(this,a,"");this.nodeType===1&&this.removeAttribute(a)})},addClass:function(a){if(c.isFunction(a))return this.each(function(x){var r=c(this);r.addClass(a.call(this,x,r.attr("class")))});if(a&&typeof a==="string")for(var b=(a||"").split(ha),d=0,e=this.length;d<e;d++){var f=this[d];if(f.nodeType===
1)if(f.className){for(var h=" "+f.className+" ",l=f.className,k=0,o=b.length;k<o;k++)if(h.indexOf(" "+b[k]+" ")<0)l+=" "+b[k];f.className=c.trim(l)}else f.className=a}return this},removeClass:function(a){if(c.isFunction(a))return this.each(function(o){var x=c(this);x.removeClass(a.call(this,o,x.attr("class")))});if(a&&typeof a==="string"||a===B)for(var b=(a||"").split(ha),d=0,e=this.length;d<e;d++){var f=this[d];if(f.nodeType===1&&f.className)if(a){for(var h=(" "+f.className+" ").replace(sa," "),
l=0,k=b.length;l<k;l++)h=h.replace(" "+b[l]+" "," ");f.className=c.trim(h)}else f.className=""}return this},toggleClass:function(a,b){var d=typeof a,e=typeof b==="boolean";if(c.isFunction(a))return this.each(function(f){var h=c(this);h.toggleClass(a.call(this,f,h.attr("class"),b),b)});return this.each(function(){if(d==="string")for(var f,h=0,l=c(this),k=b,o=a.split(ha);f=o[h++];){k=e?k:!l.hasClass(f);l[k?"addClass":"removeClass"](f)}else if(d==="undefined"||d==="boolean"){this.className&&c.data(this,
"__className__",this.className);this.className=this.className||a===false?"":c.data(this,"__className__")||""}})},hasClass:function(a){a=" "+a+" ";for(var b=0,d=this.length;b<d;b++)if((" "+this[b].className+" ").replace(sa," ").indexOf(a)>-1)return true;return false},val:function(a){if(!arguments.length){var b=this[0];if(b){if(c.nodeName(b,"option")){var d=b.attributes.value;return!d||d.specified?b.value:b.text}if(c.nodeName(b,"select")){var e=b.selectedIndex;d=[];var f=b.options;b=b.type==="select-one";
if(e<0)return null;var h=b?e:0;for(e=b?e+1:f.length;h<e;h++){var l=f[h];if(l.selected&&(c.support.optDisabled?!l.disabled:l.getAttribute("disabled")===null)&&(!l.parentNode.disabled||!c.nodeName(l.parentNode,"optgroup"))){a=c(l).val();if(b)return a;d.push(a)}}return d}if(ta.test(b.type)&&!c.support.checkOn)return b.getAttribute("value")===null?"on":b.value;return(b.value||"").replace(Sa,"")}return B}var k=c.isFunction(a);return this.each(function(o){var x=c(this),r=a;if(this.nodeType===1){if(k)r=
a.call(this,o,x.val());if(r==null)r="";else if(typeof r==="number")r+="";else if(c.isArray(r))r=c.map(r,function(C){return C==null?"":C+""});if(c.isArray(r)&&ta.test(this.type))this.checked=c.inArray(x.val(),r)>=0;else if(c.nodeName(this,"select")){var A=c.makeArray(r);c("option",this).each(function(){this.selected=c.inArray(c(this).val(),A)>=0});if(!A.length)this.selectedIndex=-1}else this.value=r}})}});c.extend({attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},
attr:function(a,b,d,e){if(!a||a.nodeType===3||a.nodeType===8)return B;if(e&&b in c.attrFn)return c(a)[b](d);e=a.nodeType!==1||!c.isXMLDoc(a);var f=d!==B;b=e&&c.props[b]||b;var h=Ta.test(b);if((b in a||a[b]!==B)&&e&&!h){if(f){b==="type"&&Ua.test(a.nodeName)&&a.parentNode&&c.error("type property can't be changed");if(d===null)a.nodeType===1&&a.removeAttribute(b);else a[b]=d}if(c.nodeName(a,"form")&&a.getAttributeNode(b))return a.getAttributeNode(b).nodeValue;if(b==="tabIndex")return(b=a.getAttributeNode("tabIndex"))&&
b.specified?b.value:Va.test(a.nodeName)||Wa.test(a.nodeName)&&a.href?0:B;return a[b]}if(!c.support.style&&e&&b==="style"){if(f)a.style.cssText=""+d;return a.style.cssText}f&&a.setAttribute(b,""+d);if(!a.attributes[b]&&a.hasAttribute&&!a.hasAttribute(b))return B;a=!c.support.hrefNormalized&&e&&h?a.getAttribute(b,2):a.getAttribute(b);return a===null?B:a}});var X=/\.(.*)$/,ia=/^(?:textarea|input|select)$/i,La=/\./g,Ma=/ /g,Xa=/[^\w\s.|`]/g,Ya=function(a){return a.replace(Xa,"\\$&")},ua={focusin:0,focusout:0};
c.event={add:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===8)){if(c.isWindow(a)&&a!==E&&!a.frameElement)a=E;if(d===false)d=U;else if(!d)return;var f,h;if(d.handler){f=d;d=f.handler}if(!d.guid)d.guid=c.guid++;if(h=c.data(a)){var l=a.nodeType?"events":"__events__",k=h[l],o=h.handle;if(typeof k==="function"){o=k.handle;k=k.events}else if(!k){a.nodeType||(h[l]=h=function(){});h.events=k={}}if(!o)h.handle=o=function(){return typeof c!=="undefined"&&!c.event.triggered?c.event.handle.apply(o.elem,
arguments):B};o.elem=a;b=b.split(" ");for(var x=0,r;l=b[x++];){h=f?c.extend({},f):{handler:d,data:e};if(l.indexOf(".")>-1){r=l.split(".");l=r.shift();h.namespace=r.slice(0).sort().join(".")}else{r=[];h.namespace=""}h.type=l;if(!h.guid)h.guid=d.guid;var A=k[l],C=c.event.special[l]||{};if(!A){A=k[l]=[];if(!C.setup||C.setup.call(a,e,r,o)===false)if(a.addEventListener)a.addEventListener(l,o,false);else a.attachEvent&&a.attachEvent("on"+l,o)}if(C.add){C.add.call(a,h);if(!h.handler.guid)h.handler.guid=
d.guid}A.push(h);c.event.global[l]=true}a=null}}},global:{},remove:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===8)){if(d===false)d=U;var f,h,l=0,k,o,x,r,A,C,J=a.nodeType?"events":"__events__",w=c.data(a),I=w&&w[J];if(w&&I){if(typeof I==="function"){w=I;I=I.events}if(b&&b.type){d=b.handler;b=b.type}if(!b||typeof b==="string"&&b.charAt(0)==="."){b=b||"";for(f in I)c.event.remove(a,f+b)}else{for(b=b.split(" ");f=b[l++];){r=f;k=f.indexOf(".")<0;o=[];if(!k){o=f.split(".");f=o.shift();x=RegExp("(^|\\.)"+
c.map(o.slice(0).sort(),Ya).join("\\.(?:.*\\.)?")+"(\\.|$)")}if(A=I[f])if(d){r=c.event.special[f]||{};for(h=e||0;h<A.length;h++){C=A[h];if(d.guid===C.guid){if(k||x.test(C.namespace)){e==null&&A.splice(h--,1);r.remove&&r.remove.call(a,C)}if(e!=null)break}}if(A.length===0||e!=null&&A.length===1){if(!r.teardown||r.teardown.call(a,o)===false)c.removeEvent(a,f,w.handle);delete I[f]}}else for(h=0;h<A.length;h++){C=A[h];if(k||x.test(C.namespace)){c.event.remove(a,r,C.handler,h);A.splice(h--,1)}}}if(c.isEmptyObject(I)){if(b=
w.handle)b.elem=null;delete w.events;delete w.handle;if(typeof w==="function")c.removeData(a,J);else c.isEmptyObject(w)&&c.removeData(a)}}}}},trigger:function(a,b,d,e){var f=a.type||a;if(!e){a=typeof a==="object"?a[c.expando]?a:c.extend(c.Event(f),a):c.Event(f);if(f.indexOf("!")>=0){a.type=f=f.slice(0,-1);a.exclusive=true}if(!d){a.stopPropagation();c.event.global[f]&&c.each(c.cache,function(){this.events&&this.events[f]&&c.event.trigger(a,b,this.handle.elem)})}if(!d||d.nodeType===3||d.nodeType===
8)return B;a.result=B;a.target=d;b=c.makeArray(b);b.unshift(a)}a.currentTarget=d;(e=d.nodeType?c.data(d,"handle"):(c.data(d,"__events__")||{}).handle)&&e.apply(d,b);e=d.parentNode||d.ownerDocument;try{if(!(d&&d.nodeName&&c.noData[d.nodeName.toLowerCase()]))if(d["on"+f]&&d["on"+f].apply(d,b)===false){a.result=false;a.preventDefault()}}catch(h){}if(!a.isPropagationStopped()&&e)c.event.trigger(a,b,e,true);else if(!a.isDefaultPrevented()){var l;e=a.target;var k=f.replace(X,""),o=c.nodeName(e,"a")&&k===
"click",x=c.event.special[k]||{};if((!x._default||x._default.call(d,a)===false)&&!o&&!(e&&e.nodeName&&c.noData[e.nodeName.toLowerCase()])){try{if(e[k]){if(l=e["on"+k])e["on"+k]=null;c.event.triggered=true;e[k]()}}catch(r){}if(l)e["on"+k]=l;c.event.triggered=false}}},handle:function(a){var b,d,e,f;d=[];var h=c.makeArray(arguments);a=h[0]=c.event.fix(a||E.event);a.currentTarget=this;b=a.type.indexOf(".")<0&&!a.exclusive;if(!b){e=a.type.split(".");a.type=e.shift();d=e.slice(0).sort();e=RegExp("(^|\\.)"+
d.join("\\.(?:.*\\.)?")+"(\\.|$)")}a.namespace=a.namespace||d.join(".");f=c.data(this,this.nodeType?"events":"__events__");if(typeof f==="function")f=f.events;d=(f||{})[a.type];if(f&&d){d=d.slice(0);f=0;for(var l=d.length;f<l;f++){var k=d[f];if(b||e.test(k.namespace)){a.handler=k.handler;a.data=k.data;a.handleObj=k;k=k.handler.apply(this,h);if(k!==B){a.result=k;if(k===false){a.preventDefault();a.stopPropagation()}}if(a.isImmediatePropagationStopped())break}}}return a.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),
fix:function(a){if(a[c.expando])return a;var b=a;a=c.Event(b);for(var d=this.props.length,e;d;){e=this.props[--d];a[e]=b[e]}if(!a.target)a.target=a.srcElement||t;if(a.target.nodeType===3)a.target=a.target.parentNode;if(!a.relatedTarget&&a.fromElement)a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement;if(a.pageX==null&&a.clientX!=null){b=t.documentElement;d=t.body;a.pageX=a.clientX+(b&&b.scrollLeft||d&&d.scrollLeft||0)-(b&&b.clientLeft||d&&d.clientLeft||0);a.pageY=a.clientY+(b&&b.scrollTop||
d&&d.scrollTop||0)-(b&&b.clientTop||d&&d.clientTop||0)}if(a.which==null&&(a.charCode!=null||a.keyCode!=null))a.which=a.charCode!=null?a.charCode:a.keyCode;if(!a.metaKey&&a.ctrlKey)a.metaKey=a.ctrlKey;if(!a.which&&a.button!==B)a.which=a.button&1?1:a.button&2?3:a.button&4?2:0;return a},guid:1E8,proxy:c.proxy,special:{ready:{setup:c.bindReady,teardown:c.noop},live:{add:function(a){c.event.add(this,Y(a.origType,a.selector),c.extend({},a,{handler:Ka,guid:a.handler.guid}))},remove:function(a){c.event.remove(this,
Y(a.origType,a.selector),a)}},beforeunload:{setup:function(a,b,d){if(c.isWindow(this))this.onbeforeunload=d},teardown:function(a,b){if(this.onbeforeunload===b)this.onbeforeunload=null}}}};c.removeEvent=t.removeEventListener?function(a,b,d){a.removeEventListener&&a.removeEventListener(b,d,false)}:function(a,b,d){a.detachEvent&&a.detachEvent("on"+b,d)};c.Event=function(a){if(!this.preventDefault)return new c.Event(a);if(a&&a.type){this.originalEvent=a;this.type=a.type}else this.type=a;this.timeStamp=
c.now();this[c.expando]=true};c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=ca;var a=this.originalEvent;if(a)if(a.preventDefault)a.preventDefault();else a.returnValue=false},stopPropagation:function(){this.isPropagationStopped=ca;var a=this.originalEvent;if(a){a.stopPropagation&&a.stopPropagation();a.cancelBubble=true}},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=ca;this.stopPropagation()},isDefaultPrevented:U,isPropagationStopped:U,isImmediatePropagationStopped:U};
var va=function(a){var b=a.relatedTarget;try{for(;b&&b!==this;)b=b.parentNode;if(b!==this){a.type=a.data;c.event.handle.apply(this,arguments)}}catch(d){}},wa=function(a){a.type=a.data;c.event.handle.apply(this,arguments)};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={setup:function(d){c.event.add(this,b,d&&d.selector?wa:va,a)},teardown:function(d){c.event.remove(this,b,d&&d.selector?wa:va)}}});if(!c.support.submitBubbles)c.event.special.submit={setup:function(){if(this.nodeName.toLowerCase()!==
"form"){c.event.add(this,"click.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="submit"||d==="image")&&c(b).closest("form").length){a.liveFired=B;return la("submit",this,arguments)}});c.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="text"||d==="password")&&c(b).closest("form").length&&a.keyCode===13){a.liveFired=B;return la("submit",this,arguments)}})}else return false},teardown:function(){c.event.remove(this,".specialSubmit")}};if(!c.support.changeBubbles){var V,
xa=function(a){var b=a.type,d=a.value;if(b==="radio"||b==="checkbox")d=a.checked;else if(b==="select-multiple")d=a.selectedIndex>-1?c.map(a.options,function(e){return e.selected}).join("-"):"";else if(a.nodeName.toLowerCase()==="select")d=a.selectedIndex;return d},Z=function(a,b){var d=a.target,e,f;if(!(!ia.test(d.nodeName)||d.readOnly)){e=c.data(d,"_change_data");f=xa(d);if(a.type!=="focusout"||d.type!=="radio")c.data(d,"_change_data",f);if(!(e===B||f===e))if(e!=null||f){a.type="change";a.liveFired=
B;return c.event.trigger(a,b,d)}}};c.event.special.change={filters:{focusout:Z,beforedeactivate:Z,click:function(a){var b=a.target,d=b.type;if(d==="radio"||d==="checkbox"||b.nodeName.toLowerCase()==="select")return Z.call(this,a)},keydown:function(a){var b=a.target,d=b.type;if(a.keyCode===13&&b.nodeName.toLowerCase()!=="textarea"||a.keyCode===32&&(d==="checkbox"||d==="radio")||d==="select-multiple")return Z.call(this,a)},beforeactivate:function(a){a=a.target;c.data(a,"_change_data",xa(a))}},setup:function(){if(this.type===
"file")return false;for(var a in V)c.event.add(this,a+".specialChange",V[a]);return ia.test(this.nodeName)},teardown:function(){c.event.remove(this,".specialChange");return ia.test(this.nodeName)}};V=c.event.special.change.filters;V.focus=V.beforeactivate}t.addEventListener&&c.each({focus:"focusin",blur:"focusout"},function(a,b){function d(e){e=c.event.fix(e);e.type=b;return c.event.trigger(e,null,e.target)}c.event.special[b]={setup:function(){ua[b]++===0&&t.addEventListener(a,d,true)},teardown:function(){--ua[b]===
0&&t.removeEventListener(a,d,true)}}});c.each(["bind","one"],function(a,b){c.fn[b]=function(d,e,f){if(typeof d==="object"){for(var h in d)this[b](h,e,d[h],f);return this}if(c.isFunction(e)||e===false){f=e;e=B}var l=b==="one"?c.proxy(f,function(o){c(this).unbind(o,l);return f.apply(this,arguments)}):f;if(d==="unload"&&b!=="one")this.one(d,e,f);else{h=0;for(var k=this.length;h<k;h++)c.event.add(this[h],d,l,e)}return this}});c.fn.extend({unbind:function(a,b){if(typeof a==="object"&&!a.preventDefault)for(var d in a)this.unbind(d,
a[d]);else{d=0;for(var e=this.length;d<e;d++)c.event.remove(this[d],a,b)}return this},delegate:function(a,b,d,e){return this.live(b,d,e,a)},undelegate:function(a,b,d){return arguments.length===0?this.unbind("live"):this.die(b,null,d,a)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){var d=c.Event(a);d.preventDefault();d.stopPropagation();c.event.trigger(d,b,this[0]);return d.result}},toggle:function(a){for(var b=arguments,d=
1;d<b.length;)c.proxy(a,b[d++]);return this.click(c.proxy(a,function(e){var f=(c.data(this,"lastToggle"+a.guid)||0)%d;c.data(this,"lastToggle"+a.guid,f+1);e.preventDefault();return b[f].apply(this,arguments)||false}))},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var ya={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};c.each(["live","die"],function(a,b){c.fn[b]=function(d,e,f,h){var l,k=0,o,x,r=h||this.selector;h=h?this:c(this.context);if(typeof d===
"object"&&!d.preventDefault){for(l in d)h[b](l,e,d[l],r);return this}if(c.isFunction(e)){f=e;e=B}for(d=(d||"").split(" ");(l=d[k++])!=null;){o=X.exec(l);x="";if(o){x=o[0];l=l.replace(X,"")}if(l==="hover")d.push("mouseenter"+x,"mouseleave"+x);else{o=l;if(l==="focus"||l==="blur"){d.push(ya[l]+x);l+=x}else l=(ya[l]||l)+x;if(b==="live"){x=0;for(var A=h.length;x<A;x++)c.event.add(h[x],"live."+Y(l,r),{data:e,selector:r,handler:f,origType:l,origHandler:f,preType:o})}else h.unbind("live."+Y(l,r),f)}}return this}});
c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),function(a,b){c.fn[b]=function(d,e){if(e==null){e=d;d=null}return arguments.length>0?this.bind(b,d,e):this.trigger(b)};if(c.attrFn)c.attrFn[b]=true});E.attachEvent&&!E.addEventListener&&c(E).bind("unload",function(){for(var a in c.cache)if(c.cache[a].handle)try{c.event.remove(c.cache[a].handle.elem)}catch(b){}});
(function(){function a(g,i,n,m,p,q){p=0;for(var u=m.length;p<u;p++){var y=m[p];if(y){var F=false;for(y=y[g];y;){if(y.sizcache===n){F=m[y.sizset];break}if(y.nodeType===1&&!q){y.sizcache=n;y.sizset=p}if(y.nodeName.toLowerCase()===i){F=y;break}y=y[g]}m[p]=F}}}function b(g,i,n,m,p,q){p=0;for(var u=m.length;p<u;p++){var y=m[p];if(y){var F=false;for(y=y[g];y;){if(y.sizcache===n){F=m[y.sizset];break}if(y.nodeType===1){if(!q){y.sizcache=n;y.sizset=p}if(typeof i!=="string"){if(y===i){F=true;break}}else if(k.filter(i,
[y]).length>0){F=y;break}}y=y[g]}m[p]=F}}}var d=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,e=0,f=Object.prototype.toString,h=false,l=true;[0,0].sort(function(){l=false;return 0});var k=function(g,i,n,m){n=n||[];var p=i=i||t;if(i.nodeType!==1&&i.nodeType!==9)return[];if(!g||typeof g!=="string")return n;var q,u,y,F,M,N=true,O=k.isXML(i),D=[],R=g;do{d.exec("");if(q=d.exec(R)){R=q[3];D.push(q[1]);if(q[2]){F=q[3];
break}}}while(q);if(D.length>1&&x.exec(g))if(D.length===2&&o.relative[D[0]])u=L(D[0]+D[1],i);else for(u=o.relative[D[0]]?[i]:k(D.shift(),i);D.length;){g=D.shift();if(o.relative[g])g+=D.shift();u=L(g,u)}else{if(!m&&D.length>1&&i.nodeType===9&&!O&&o.match.ID.test(D[0])&&!o.match.ID.test(D[D.length-1])){q=k.find(D.shift(),i,O);i=q.expr?k.filter(q.expr,q.set)[0]:q.set[0]}if(i){q=m?{expr:D.pop(),set:C(m)}:k.find(D.pop(),D.length===1&&(D[0]==="~"||D[0]==="+")&&i.parentNode?i.parentNode:i,O);u=q.expr?k.filter(q.expr,
q.set):q.set;if(D.length>0)y=C(u);else N=false;for(;D.length;){q=M=D.pop();if(o.relative[M])q=D.pop();else M="";if(q==null)q=i;o.relative[M](y,q,O)}}else y=[]}y||(y=u);y||k.error(M||g);if(f.call(y)==="[object Array]")if(N)if(i&&i.nodeType===1)for(g=0;y[g]!=null;g++){if(y[g]&&(y[g]===true||y[g].nodeType===1&&k.contains(i,y[g])))n.push(u[g])}else for(g=0;y[g]!=null;g++)y[g]&&y[g].nodeType===1&&n.push(u[g]);else n.push.apply(n,y);else C(y,n);if(F){k(F,p,n,m);k.uniqueSort(n)}return n};k.uniqueSort=function(g){if(w){h=
l;g.sort(w);if(h)for(var i=1;i<g.length;i++)g[i]===g[i-1]&&g.splice(i--,1)}return g};k.matches=function(g,i){return k(g,null,null,i)};k.matchesSelector=function(g,i){return k(i,null,null,[g]).length>0};k.find=function(g,i,n){var m;if(!g)return[];for(var p=0,q=o.order.length;p<q;p++){var u,y=o.order[p];if(u=o.leftMatch[y].exec(g)){var F=u[1];u.splice(1,1);if(F.substr(F.length-1)!=="\\"){u[1]=(u[1]||"").replace(/\\/g,"");m=o.find[y](u,i,n);if(m!=null){g=g.replace(o.match[y],"");break}}}}m||(m=i.getElementsByTagName("*"));
return{set:m,expr:g}};k.filter=function(g,i,n,m){for(var p,q,u=g,y=[],F=i,M=i&&i[0]&&k.isXML(i[0]);g&&i.length;){for(var N in o.filter)if((p=o.leftMatch[N].exec(g))!=null&&p[2]){var O,D,R=o.filter[N];D=p[1];q=false;p.splice(1,1);if(D.substr(D.length-1)!=="\\"){if(F===y)y=[];if(o.preFilter[N])if(p=o.preFilter[N](p,F,n,y,m,M)){if(p===true)continue}else q=O=true;if(p)for(var j=0;(D=F[j])!=null;j++)if(D){O=R(D,p,j,F);var s=m^!!O;if(n&&O!=null)if(s)q=true;else F[j]=false;else if(s){y.push(D);q=true}}if(O!==
B){n||(F=y);g=g.replace(o.match[N],"");if(!q)return[];break}}}if(g===u)if(q==null)k.error(g);else break;u=g}return F};k.error=function(g){throw"Syntax error, unrecognized expression: "+g;};var o=k.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+\-]*)\))?/,
POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(g){return g.getAttribute("href")}},relative:{"+":function(g,i){var n=typeof i==="string",m=n&&!/\W/.test(i);n=n&&!m;if(m)i=i.toLowerCase();m=0;for(var p=g.length,q;m<p;m++)if(q=g[m]){for(;(q=q.previousSibling)&&q.nodeType!==1;);g[m]=n||q&&q.nodeName.toLowerCase()===
i?q||false:q===i}n&&k.filter(i,g,true)},">":function(g,i){var n,m=typeof i==="string",p=0,q=g.length;if(m&&!/\W/.test(i))for(i=i.toLowerCase();p<q;p++){if(n=g[p]){n=n.parentNode;g[p]=n.nodeName.toLowerCase()===i?n:false}}else{for(;p<q;p++)if(n=g[p])g[p]=m?n.parentNode:n.parentNode===i;m&&k.filter(i,g,true)}},"":function(g,i,n){var m,p=e++,q=b;if(typeof i==="string"&&!/\W/.test(i)){m=i=i.toLowerCase();q=a}q("parentNode",i,p,g,m,n)},"~":function(g,i,n){var m,p=e++,q=b;if(typeof i==="string"&&!/\W/.test(i)){m=
i=i.toLowerCase();q=a}q("previousSibling",i,p,g,m,n)}},find:{ID:function(g,i,n){if(typeof i.getElementById!=="undefined"&&!n)return(g=i.getElementById(g[1]))&&g.parentNode?[g]:[]},NAME:function(g,i){if(typeof i.getElementsByName!=="undefined"){for(var n=[],m=i.getElementsByName(g[1]),p=0,q=m.length;p<q;p++)m[p].getAttribute("name")===g[1]&&n.push(m[p]);return n.length===0?null:n}},TAG:function(g,i){return i.getElementsByTagName(g[1])}},preFilter:{CLASS:function(g,i,n,m,p,q){g=" "+g[1].replace(/\\/g,
"")+" ";if(q)return g;q=0;for(var u;(u=i[q])!=null;q++)if(u)if(p^(u.className&&(" "+u.className+" ").replace(/[\t\n]/g," ").indexOf(g)>=0))n||m.push(u);else if(n)i[q]=false;return false},ID:function(g){return g[1].replace(/\\/g,"")},TAG:function(g){return g[1].toLowerCase()},CHILD:function(g){if(g[1]==="nth"){var i=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(g[2]==="even"&&"2n"||g[2]==="odd"&&"2n+1"||!/\D/.test(g[2])&&"0n+"+g[2]||g[2]);g[2]=i[1]+(i[2]||1)-0;g[3]=i[3]-0}g[0]=e++;return g},ATTR:function(g,i,n,
m,p,q){i=g[1].replace(/\\/g,"");if(!q&&o.attrMap[i])g[1]=o.attrMap[i];if(g[2]==="~=")g[4]=" "+g[4]+" ";return g},PSEUDO:function(g,i,n,m,p){if(g[1]==="not")if((d.exec(g[3])||"").length>1||/^\w/.test(g[3]))g[3]=k(g[3],null,null,i);else{g=k.filter(g[3],i,n,true^p);n||m.push.apply(m,g);return false}else if(o.match.POS.test(g[0])||o.match.CHILD.test(g[0]))return true;return g},POS:function(g){g.unshift(true);return g}},filters:{enabled:function(g){return g.disabled===false&&g.type!=="hidden"},disabled:function(g){return g.disabled===
true},checked:function(g){return g.checked===true},selected:function(g){return g.selected===true},parent:function(g){return!!g.firstChild},empty:function(g){return!g.firstChild},has:function(g,i,n){return!!k(n[3],g).length},header:function(g){return/h\d/i.test(g.nodeName)},text:function(g){return"text"===g.type},radio:function(g){return"radio"===g.type},checkbox:function(g){return"checkbox"===g.type},file:function(g){return"file"===g.type},password:function(g){return"password"===g.type},submit:function(g){return"submit"===
g.type},image:function(g){return"image"===g.type},reset:function(g){return"reset"===g.type},button:function(g){return"button"===g.type||g.nodeName.toLowerCase()==="button"},input:function(g){return/input|select|textarea|button/i.test(g.nodeName)}},setFilters:{first:function(g,i){return i===0},last:function(g,i,n,m){return i===m.length-1},even:function(g,i){return i%2===0},odd:function(g,i){return i%2===1},lt:function(g,i,n){return i<n[3]-0},gt:function(g,i,n){return i>n[3]-0},nth:function(g,i,n){return n[3]-
0===i},eq:function(g,i,n){return n[3]-0===i}},filter:{PSEUDO:function(g,i,n,m){var p=i[1],q=o.filters[p];if(q)return q(g,n,i,m);else if(p==="contains")return(g.textContent||g.innerText||k.getText([g])||"").indexOf(i[3])>=0;else if(p==="not"){i=i[3];n=0;for(m=i.length;n<m;n++)if(i[n]===g)return false;return true}else k.error("Syntax error, unrecognized expression: "+p)},CHILD:function(g,i){var n=i[1],m=g;switch(n){case "only":case "first":for(;m=m.previousSibling;)if(m.nodeType===1)return false;if(n===
"first")return true;m=g;case "last":for(;m=m.nextSibling;)if(m.nodeType===1)return false;return true;case "nth":n=i[2];var p=i[3];if(n===1&&p===0)return true;var q=i[0],u=g.parentNode;if(u&&(u.sizcache!==q||!g.nodeIndex)){var y=0;for(m=u.firstChild;m;m=m.nextSibling)if(m.nodeType===1)m.nodeIndex=++y;u.sizcache=q}m=g.nodeIndex-p;return n===0?m===0:m%n===0&&m/n>=0}},ID:function(g,i){return g.nodeType===1&&g.getAttribute("id")===i},TAG:function(g,i){return i==="*"&&g.nodeType===1||g.nodeName.toLowerCase()===
i},CLASS:function(g,i){return(" "+(g.className||g.getAttribute("class"))+" ").indexOf(i)>-1},ATTR:function(g,i){var n=i[1];n=o.attrHandle[n]?o.attrHandle[n](g):g[n]!=null?g[n]:g.getAttribute(n);var m=n+"",p=i[2],q=i[4];return n==null?p==="!=":p==="="?m===q:p==="*="?m.indexOf(q)>=0:p==="~="?(" "+m+" ").indexOf(q)>=0:!q?m&&n!==false:p==="!="?m!==q:p==="^="?m.indexOf(q)===0:p==="$="?m.substr(m.length-q.length)===q:p==="|="?m===q||m.substr(0,q.length+1)===q+"-":false},POS:function(g,i,n,m){var p=o.setFilters[i[2]];
if(p)return p(g,n,i,m)}}},x=o.match.POS,r=function(g,i){return"\\"+(i-0+1)},A;for(A in o.match){o.match[A]=RegExp(o.match[A].source+/(?![^\[]*\])(?![^\(]*\))/.source);o.leftMatch[A]=RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[A].source.replace(/\\(\d+)/g,r))}var C=function(g,i){g=Array.prototype.slice.call(g,0);if(i){i.push.apply(i,g);return i}return g};try{Array.prototype.slice.call(t.documentElement.childNodes,0)}catch(J){C=function(g,i){var n=0,m=i||[];if(f.call(g)==="[object Array]")Array.prototype.push.apply(m,
g);else if(typeof g.length==="number")for(var p=g.length;n<p;n++)m.push(g[n]);else for(;g[n];n++)m.push(g[n]);return m}}var w,I;if(t.documentElement.compareDocumentPosition)w=function(g,i){if(g===i){h=true;return 0}if(!g.compareDocumentPosition||!i.compareDocumentPosition)return g.compareDocumentPosition?-1:1;return g.compareDocumentPosition(i)&4?-1:1};else{w=function(g,i){var n,m,p=[],q=[];n=g.parentNode;m=i.parentNode;var u=n;if(g===i){h=true;return 0}else if(n===m)return I(g,i);else if(n){if(!m)return 1}else return-1;
for(;u;){p.unshift(u);u=u.parentNode}for(u=m;u;){q.unshift(u);u=u.parentNode}n=p.length;m=q.length;for(u=0;u<n&&u<m;u++)if(p[u]!==q[u])return I(p[u],q[u]);return u===n?I(g,q[u],-1):I(p[u],i,1)};I=function(g,i,n){if(g===i)return n;for(g=g.nextSibling;g;){if(g===i)return-1;g=g.nextSibling}return 1}}k.getText=function(g){for(var i="",n,m=0;g[m];m++){n=g[m];if(n.nodeType===3||n.nodeType===4)i+=n.nodeValue;else if(n.nodeType!==8)i+=k.getText(n.childNodes)}return i};(function(){var g=t.createElement("div"),
i="script"+(new Date).getTime(),n=t.documentElement;g.innerHTML="<a name='"+i+"'/>";n.insertBefore(g,n.firstChild);if(t.getElementById(i)){o.find.ID=function(m,p,q){if(typeof p.getElementById!=="undefined"&&!q)return(p=p.getElementById(m[1]))?p.id===m[1]||typeof p.getAttributeNode!=="undefined"&&p.getAttributeNode("id").nodeValue===m[1]?[p]:B:[]};o.filter.ID=function(m,p){var q=typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id");return m.nodeType===1&&q&&q.nodeValue===p}}n.removeChild(g);
n=g=null})();(function(){var g=t.createElement("div");g.appendChild(t.createComment(""));if(g.getElementsByTagName("*").length>0)o.find.TAG=function(i,n){var m=n.getElementsByTagName(i[1]);if(i[1]==="*"){for(var p=[],q=0;m[q];q++)m[q].nodeType===1&&p.push(m[q]);m=p}return m};g.innerHTML="<a href='#'></a>";if(g.firstChild&&typeof g.firstChild.getAttribute!=="undefined"&&g.firstChild.getAttribute("href")!=="#")o.attrHandle.href=function(i){return i.getAttribute("href",2)};g=null})();t.querySelectorAll&&
function(){var g=k,i=t.createElement("div");i.innerHTML="<p class='TEST'></p>";if(!(i.querySelectorAll&&i.querySelectorAll(".TEST").length===0)){k=function(m,p,q,u){p=p||t;m=m.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!u&&!k.isXML(p))if(p.nodeType===9)try{return C(p.querySelectorAll(m),q)}catch(y){}else if(p.nodeType===1&&p.nodeName.toLowerCase()!=="object"){var F=p.getAttribute("id"),M=F||"__sizzle__";F||p.setAttribute("id",M);try{return C(p.querySelectorAll("#"+M+" "+m),q)}catch(N){}finally{F||
p.removeAttribute("id")}}return g(m,p,q,u)};for(var n in g)k[n]=g[n];i=null}}();(function(){var g=t.documentElement,i=g.matchesSelector||g.mozMatchesSelector||g.webkitMatchesSelector||g.msMatchesSelector,n=false;try{i.call(t.documentElement,"[test!='']:sizzle")}catch(m){n=true}if(i)k.matchesSelector=function(p,q){q=q.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!k.isXML(p))try{if(n||!o.match.PSEUDO.test(q)&&!/!=/.test(q))return i.call(p,q)}catch(u){}return k(q,null,null,[p]).length>0}})();(function(){var g=
t.createElement("div");g.innerHTML="<div class='test e'></div><div class='test'></div>";if(!(!g.getElementsByClassName||g.getElementsByClassName("e").length===0)){g.lastChild.className="e";if(g.getElementsByClassName("e").length!==1){o.order.splice(1,0,"CLASS");o.find.CLASS=function(i,n,m){if(typeof n.getElementsByClassName!=="undefined"&&!m)return n.getElementsByClassName(i[1])};g=null}}})();k.contains=t.documentElement.contains?function(g,i){return g!==i&&(g.contains?g.contains(i):true)}:t.documentElement.compareDocumentPosition?
function(g,i){return!!(g.compareDocumentPosition(i)&16)}:function(){return false};k.isXML=function(g){return(g=(g?g.ownerDocument||g:0).documentElement)?g.nodeName!=="HTML":false};var L=function(g,i){for(var n,m=[],p="",q=i.nodeType?[i]:i;n=o.match.PSEUDO.exec(g);){p+=n[0];g=g.replace(o.match.PSEUDO,"")}g=o.relative[g]?g+"*":g;n=0;for(var u=q.length;n<u;n++)k(g,q[n],m);return k.filter(p,m)};c.find=k;c.expr=k.selectors;c.expr[":"]=c.expr.filters;c.unique=k.uniqueSort;c.text=k.getText;c.isXMLDoc=k.isXML;
c.contains=k.contains})();var Za=/Until$/,$a=/^(?:parents|prevUntil|prevAll)/,ab=/,/,Na=/^.[^:#\[\.,]*$/,bb=Array.prototype.slice,cb=c.expr.match.POS;c.fn.extend({find:function(a){for(var b=this.pushStack("","find",a),d=0,e=0,f=this.length;e<f;e++){d=b.length;c.find(a,this[e],b);if(e>0)for(var h=d;h<b.length;h++)for(var l=0;l<d;l++)if(b[l]===b[h]){b.splice(h--,1);break}}return b},has:function(a){var b=c(a);return this.filter(function(){for(var d=0,e=b.length;d<e;d++)if(c.contains(this,b[d]))return true})},
not:function(a){return this.pushStack(ma(this,a,false),"not",a)},filter:function(a){return this.pushStack(ma(this,a,true),"filter",a)},is:function(a){return!!a&&c.filter(a,this).length>0},closest:function(a,b){var d=[],e,f,h=this[0];if(c.isArray(a)){var l,k={},o=1;if(h&&a.length){e=0;for(f=a.length;e<f;e++){l=a[e];k[l]||(k[l]=c.expr.match.POS.test(l)?c(l,b||this.context):l)}for(;h&&h.ownerDocument&&h!==b;){for(l in k){e=k[l];if(e.jquery?e.index(h)>-1:c(h).is(e))d.push({selector:l,elem:h,level:o})}h=
h.parentNode;o++}}return d}l=cb.test(a)?c(a,b||this.context):null;e=0;for(f=this.length;e<f;e++)for(h=this[e];h;)if(l?l.index(h)>-1:c.find.matchesSelector(h,a)){d.push(h);break}else{h=h.parentNode;if(!h||!h.ownerDocument||h===b)break}d=d.length>1?c.unique(d):d;return this.pushStack(d,"closest",a)},index:function(a){if(!a||typeof a==="string")return c.inArray(this[0],a?c(a):this.parent().children());return c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var d=typeof a==="string"?c(a,b||this.context):
c.makeArray(a),e=c.merge(this.get(),d);return this.pushStack(!d[0]||!d[0].parentNode||d[0].parentNode.nodeType===11||!e[0]||!e[0].parentNode||e[0].parentNode.nodeType===11?e:c.unique(e))},andSelf:function(){return this.add(this.prevObject)}});c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",d)},next:function(a){return c.nth(a,2,"nextSibling")},prev:function(a){return c.nth(a,
2,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",d)},siblings:function(a){return c.sibling(a.parentNode.firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:c.makeArray(a.childNodes)}},function(a,
b){c.fn[a]=function(d,e){var f=c.map(this,b,d);Za.test(a)||(e=d);if(e&&typeof e==="string")f=c.filter(e,f);f=this.length>1?c.unique(f):f;if((this.length>1||ab.test(e))&&$a.test(a))f=f.reverse();return this.pushStack(f,a,bb.call(arguments).join(","))}});c.extend({filter:function(a,b,d){if(d)a=":not("+a+")";return b.length===1?c.find.matchesSelector(b[0],a)?[b[0]]:[]:c.find.matches(a,b)},dir:function(a,b,d){var e=[];for(a=a[b];a&&a.nodeType!==9&&(d===B||a.nodeType!==1||!c(a).is(d));){a.nodeType===1&&
e.push(a);a=a[b]}return e},nth:function(a,b,d){b=b||1;for(var e=0;a;a=a[d])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){for(var d=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&d.push(a);return d}});var za=/ jQuery\d+="(?:\d+|null)"/g,$=/^\s+/,Aa=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Ba=/<([\w:]+)/,db=/<tbody/i,eb=/<|&#?\w+;/,Ca=/<(?:script|object|embed|option|style)/i,Da=/checked\s*(?:[^=]|=\s*.checked.)/i,fb=/\=([^="'>\s]+\/)>/g,P={option:[1,
"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};P.optgroup=P.option;P.tbody=P.tfoot=P.colgroup=P.caption=P.thead;P.th=P.td;if(!c.support.htmlSerialize)P._default=[1,"div<div>","</div>"];c.fn.extend({text:function(a){if(c.isFunction(a))return this.each(function(b){var d=
c(this);d.text(a.call(this,b,d.text()))});if(typeof a!=="object"&&a!==B)return this.empty().append((this[0]&&this[0].ownerDocument||t).createTextNode(a));return c.text(this)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(d){c(this).wrapAll(a.call(this,d))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var d=this;d.firstChild&&d.firstChild.nodeType===1;)d=d.firstChild;return d}).append(this)}return this},
wrapInner:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapInner(a.call(this,b))});return this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){c(this).wrapAll(a)})},unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.appendChild(a)})},
prepend:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this)});else if(arguments.length){var a=c(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,
this.nextSibling)});else if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,c(arguments[0]).toArray());return a}},remove:function(a,b){for(var d=0,e;(e=this[d])!=null;d++)if(!a||c.filter(a,[e]).length){if(!b&&e.nodeType===1){c.cleanData(e.getElementsByTagName("*"));c.cleanData([e])}e.parentNode&&e.parentNode.removeChild(e)}return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++)for(b.nodeType===1&&c.cleanData(b.getElementsByTagName("*"));b.firstChild;)b.removeChild(b.firstChild);
return this},clone:function(a){var b=this.map(function(){if(!c.support.noCloneEvent&&!c.isXMLDoc(this)){var d=this.outerHTML,e=this.ownerDocument;if(!d){d=e.createElement("div");d.appendChild(this.cloneNode(true));d=d.innerHTML}return c.clean([d.replace(za,"").replace(fb,'="$1">').replace($,"")],e)[0]}else return this.cloneNode(true)});if(a===true){na(this,b);na(this.find("*"),b.find("*"))}return b},html:function(a){if(a===B)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(za,""):null;
else if(typeof a==="string"&&!Ca.test(a)&&(c.support.leadingWhitespace||!$.test(a))&&!P[(Ba.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Aa,"<$1></$2>");try{for(var b=0,d=this.length;b<d;b++)if(this[b].nodeType===1){c.cleanData(this[b].getElementsByTagName("*"));this[b].innerHTML=a}}catch(e){this.empty().append(a)}}else c.isFunction(a)?this.each(function(f){var h=c(this);h.html(a.call(this,f,h.html()))}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(c.isFunction(a))return this.each(function(b){var d=
c(this),e=d.html();d.replaceWith(a.call(this,b,e))});if(typeof a!=="string")a=c(a).detach();return this.each(function(){var b=this.nextSibling,d=this.parentNode;c(this).remove();b?c(b).before(a):c(d).append(a)})}else return this.pushStack(c(c.isFunction(a)?a():a),"replaceWith",a)},detach:function(a){return this.remove(a,true)},domManip:function(a,b,d){var e,f,h,l=a[0],k=[];if(!c.support.checkClone&&arguments.length===3&&typeof l==="string"&&Da.test(l))return this.each(function(){c(this).domManip(a,
b,d,true)});if(c.isFunction(l))return this.each(function(x){var r=c(this);a[0]=l.call(this,x,b?r.html():B);r.domManip(a,b,d)});if(this[0]){e=l&&l.parentNode;e=c.support.parentNode&&e&&e.nodeType===11&&e.childNodes.length===this.length?{fragment:e}:c.buildFragment(a,this,k);h=e.fragment;if(f=h.childNodes.length===1?h=h.firstChild:h.firstChild){b=b&&c.nodeName(f,"tr");f=0;for(var o=this.length;f<o;f++)d.call(b?c.nodeName(this[f],"table")?this[f].getElementsByTagName("tbody")[0]||this[f].appendChild(this[f].ownerDocument.createElement("tbody")):
this[f]:this[f],f>0||e.cacheable||this.length>1?h.cloneNode(true):h)}k.length&&c.each(k,Oa)}return this}});c.buildFragment=function(a,b,d){var e,f,h;b=b&&b[0]?b[0].ownerDocument||b[0]:t;if(a.length===1&&typeof a[0]==="string"&&a[0].length<512&&b===t&&!Ca.test(a[0])&&(c.support.checkClone||!Da.test(a[0]))){f=true;if(h=c.fragments[a[0]])if(h!==1)e=h}if(!e){e=b.createDocumentFragment();c.clean(a,b,e,d)}if(f)c.fragments[a[0]]=h?e:1;return{fragment:e,cacheable:f}};c.fragments={};c.each({appendTo:"append",
prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(d){var e=[];d=c(d);var f=this.length===1&&this[0].parentNode;if(f&&f.nodeType===11&&f.childNodes.length===1&&d.length===1){d[b](this[0]);return this}else{f=0;for(var h=d.length;f<h;f++){var l=(f>0?this.clone(true):this).get();c(d[f])[b](l);e=e.concat(l)}return this.pushStack(e,a,d.selector)}}});c.extend({clean:function(a,b,d,e){b=b||t;if(typeof b.createElement==="undefined")b=b.ownerDocument||
b[0]&&b[0].ownerDocument||t;for(var f=[],h=0,l;(l=a[h])!=null;h++){if(typeof l==="number")l+="";if(l){if(typeof l==="string"&&!eb.test(l))l=b.createTextNode(l);else if(typeof l==="string"){l=l.replace(Aa,"<$1></$2>");var k=(Ba.exec(l)||["",""])[1].toLowerCase(),o=P[k]||P._default,x=o[0],r=b.createElement("div");for(r.innerHTML=o[1]+l+o[2];x--;)r=r.lastChild;if(!c.support.tbody){x=db.test(l);k=k==="table"&&!x?r.firstChild&&r.firstChild.childNodes:o[1]==="<table>"&&!x?r.childNodes:[];for(o=k.length-
1;o>=0;--o)c.nodeName(k[o],"tbody")&&!k[o].childNodes.length&&k[o].parentNode.removeChild(k[o])}!c.support.leadingWhitespace&&$.test(l)&&r.insertBefore(b.createTextNode($.exec(l)[0]),r.firstChild);l=r.childNodes}if(l.nodeType)f.push(l);else f=c.merge(f,l)}}if(d)for(h=0;f[h];h++)if(e&&c.nodeName(f[h],"script")&&(!f[h].type||f[h].type.toLowerCase()==="text/javascript"))e.push(f[h].parentNode?f[h].parentNode.removeChild(f[h]):f[h]);else{f[h].nodeType===1&&f.splice.apply(f,[h+1,0].concat(c.makeArray(f[h].getElementsByTagName("script"))));
d.appendChild(f[h])}return f},cleanData:function(a){for(var b,d,e=c.cache,f=c.event.special,h=c.support.deleteExpando,l=0,k;(k=a[l])!=null;l++)if(!(k.nodeName&&c.noData[k.nodeName.toLowerCase()]))if(d=k[c.expando]){if((b=e[d])&&b.events)for(var o in b.events)f[o]?c.event.remove(k,o):c.removeEvent(k,o,b.handle);if(h)delete k[c.expando];else k.removeAttribute&&k.removeAttribute(c.expando);delete e[d]}}});var Ea=/alpha\([^)]*\)/i,gb=/opacity=([^)]*)/,hb=/-([a-z])/ig,ib=/([A-Z])/g,Fa=/^-?\d+(?:px)?$/i,
jb=/^-?\d/,kb={position:"absolute",visibility:"hidden",display:"block"},Pa=["Left","Right"],Qa=["Top","Bottom"],W,Ga,aa,lb=function(a,b){return b.toUpperCase()};c.fn.css=function(a,b){if(arguments.length===2&&b===B)return this;return c.access(this,a,b,true,function(d,e,f){return f!==B?c.style(d,e,f):c.css(d,e)})};c.extend({cssHooks:{opacity:{get:function(a,b){if(b){var d=W(a,"opacity","opacity");return d===""?"1":d}else return a.style.opacity}}},cssNumber:{zIndex:true,fontWeight:true,opacity:true,
zoom:true,lineHeight:true},cssProps:{"float":c.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,d,e){if(!(!a||a.nodeType===3||a.nodeType===8||!a.style)){var f,h=c.camelCase(b),l=a.style,k=c.cssHooks[h];b=c.cssProps[h]||h;if(d!==B){if(!(typeof d==="number"&&isNaN(d)||d==null)){if(typeof d==="number"&&!c.cssNumber[h])d+="px";if(!k||!("set"in k)||(d=k.set(a,d))!==B)try{l[b]=d}catch(o){}}}else{if(k&&"get"in k&&(f=k.get(a,false,e))!==B)return f;return l[b]}}},css:function(a,b,d){var e,f=c.camelCase(b),
h=c.cssHooks[f];b=c.cssProps[f]||f;if(h&&"get"in h&&(e=h.get(a,true,d))!==B)return e;else if(W)return W(a,b,f)},swap:function(a,b,d){var e={},f;for(f in b){e[f]=a.style[f];a.style[f]=b[f]}d.call(a);for(f in b)a.style[f]=e[f]},camelCase:function(a){return a.replace(hb,lb)}});c.curCSS=c.css;c.each(["height","width"],function(a,b){c.cssHooks[b]={get:function(d,e,f){var h;if(e){if(d.offsetWidth!==0)h=oa(d,b,f);else c.swap(d,kb,function(){h=oa(d,b,f)});if(h<=0){h=W(d,b,b);if(h==="0px"&&aa)h=aa(d,b,b);
if(h!=null)return h===""||h==="auto"?"0px":h}if(h<0||h==null){h=d.style[b];return h===""||h==="auto"?"0px":h}return typeof h==="string"?h:h+"px"}},set:function(d,e){if(Fa.test(e)){e=parseFloat(e);if(e>=0)return e+"px"}else return e}}});if(!c.support.opacity)c.cssHooks.opacity={get:function(a,b){return gb.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var d=a.style;d.zoom=1;var e=c.isNaN(b)?"":"alpha(opacity="+b*100+")",f=
d.filter||"";d.filter=Ea.test(f)?f.replace(Ea,e):d.filter+" "+e}};if(t.defaultView&&t.defaultView.getComputedStyle)Ga=function(a,b,d){var e;d=d.replace(ib,"-$1").toLowerCase();if(!(b=a.ownerDocument.defaultView))return B;if(b=b.getComputedStyle(a,null)){e=b.getPropertyValue(d);if(e===""&&!c.contains(a.ownerDocument.documentElement,a))e=c.style(a,d)}return e};if(t.documentElement.currentStyle)aa=function(a,b){var d,e,f=a.currentStyle&&a.currentStyle[b],h=a.style;if(!Fa.test(f)&&jb.test(f)){d=h.left;
e=a.runtimeStyle.left;a.runtimeStyle.left=a.currentStyle.left;h.left=b==="fontSize"?"1em":f||0;f=h.pixelLeft+"px";h.left=d;a.runtimeStyle.left=e}return f===""?"auto":f};W=Ga||aa;if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(a){var b=a.offsetHeight;return a.offsetWidth===0&&b===0||!c.support.reliableHiddenOffsets&&(a.style.display||c.css(a,"display"))==="none"};c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)}}var mb=c.now(),nb=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
ob=/^(?:select|textarea)/i,pb=/^(?:color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,qb=/^(?:GET|HEAD)$/,Ra=/\[\]$/,T=/\=\?(&|$)/,ja=/\?/,rb=/([?&])_=[^&]*/,sb=/^(\w+:)?\/\/([^\/?#]+)/,tb=/%20/g,ub=/#.*$/,Ha=c.fn.load;c.fn.extend({load:function(a,b,d){if(typeof a!=="string"&&Ha)return Ha.apply(this,arguments);else if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var f=a.slice(e,a.length);a=a.slice(0,e)}e="GET";if(b)if(c.isFunction(b)){d=b;b=null}else if(typeof b===
"object"){b=c.param(b,c.ajaxSettings.traditional);e="POST"}var h=this;c.ajax({url:a,type:e,dataType:"html",data:b,complete:function(l,k){if(k==="success"||k==="notmodified")h.html(f?c("<div>").append(l.responseText.replace(nb,"")).find(f):l.responseText);d&&h.each(d,[l.responseText,k,l])}});return this},serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&
!this.disabled&&(this.checked||ob.test(this.nodeName)||pb.test(this.type))}).map(function(a,b){var d=c(this).val();return d==null?null:c.isArray(d)?c.map(d,function(e){return{name:b.name,value:e}}):{name:b.name,value:d}}).get()}});c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){c.fn[b]=function(d){return this.bind(b,d)}});c.extend({get:function(a,b,d,e){if(c.isFunction(b)){e=e||d;d=b;b=null}return c.ajax({type:"GET",url:a,data:b,success:d,dataType:e})},
getScript:function(a,b){return c.get(a,null,b,"script")},getJSON:function(a,b,d){return c.get(a,b,d,"json")},post:function(a,b,d,e){if(c.isFunction(b)){e=e||d;d=b;b={}}return c.ajax({type:"POST",url:a,data:b,success:d,dataType:e})},ajaxSetup:function(a){c.extend(c.ajaxSettings,a)},ajaxSettings:{url:location.href,global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:function(){return new E.XMLHttpRequest},accepts:{xml:"application/xml, text/xml",html:"text/html",
script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},ajax:function(a){var b=c.extend(true,{},c.ajaxSettings,a),d,e,f,h=b.type.toUpperCase(),l=qb.test(h);b.url=b.url.replace(ub,"");b.context=a&&a.context!=null?a.context:b;if(b.data&&b.processData&&typeof b.data!=="string")b.data=c.param(b.data,b.traditional);if(b.dataType==="jsonp"){if(h==="GET")T.test(b.url)||(b.url+=(ja.test(b.url)?"&":"?")+(b.jsonp||"callback")+"=?");else if(!b.data||
!T.test(b.data))b.data=(b.data?b.data+"&":"")+(b.jsonp||"callback")+"=?";b.dataType="json"}if(b.dataType==="json"&&(b.data&&T.test(b.data)||T.test(b.url))){d=b.jsonpCallback||"jsonp"+mb++;if(b.data)b.data=(b.data+"").replace(T,"="+d+"$1");b.url=b.url.replace(T,"="+d+"$1");b.dataType="script";var k=E[d];E[d]=function(m){if(c.isFunction(k))k(m);else{E[d]=B;try{delete E[d]}catch(p){}}f=m;c.handleSuccess(b,w,e,f);c.handleComplete(b,w,e,f);r&&r.removeChild(A)}}if(b.dataType==="script"&&b.cache===null)b.cache=
false;if(b.cache===false&&l){var o=c.now(),x=b.url.replace(rb,"$1_="+o);b.url=x+(x===b.url?(ja.test(b.url)?"&":"?")+"_="+o:"")}if(b.data&&l)b.url+=(ja.test(b.url)?"&":"?")+b.data;b.global&&c.active++===0&&c.event.trigger("ajaxStart");o=(o=sb.exec(b.url))&&(o[1]&&o[1].toLowerCase()!==location.protocol||o[2].toLowerCase()!==location.host);if(b.dataType==="script"&&h==="GET"&&o){var r=t.getElementsByTagName("head")[0]||t.documentElement,A=t.createElement("script");if(b.scriptCharset)A.charset=b.scriptCharset;
A.src=b.url;if(!d){var C=false;A.onload=A.onreadystatechange=function(){if(!C&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete")){C=true;c.handleSuccess(b,w,e,f);c.handleComplete(b,w,e,f);A.onload=A.onreadystatechange=null;r&&A.parentNode&&r.removeChild(A)}}}r.insertBefore(A,r.firstChild);return B}var J=false,w=b.xhr();if(w){b.username?w.open(h,b.url,b.async,b.username,b.password):w.open(h,b.url,b.async);try{if(b.data!=null&&!l||a&&a.contentType)w.setRequestHeader("Content-Type",
b.contentType);if(b.ifModified){c.lastModified[b.url]&&w.setRequestHeader("If-Modified-Since",c.lastModified[b.url]);c.etag[b.url]&&w.setRequestHeader("If-None-Match",c.etag[b.url])}o||w.setRequestHeader("X-Requested-With","XMLHttpRequest");w.setRequestHeader("Accept",b.dataType&&b.accepts[b.dataType]?b.accepts[b.dataType]+", */*; q=0.01":b.accepts._default)}catch(I){}if(b.beforeSend&&b.beforeSend.call(b.context,w,b)===false){b.global&&c.active--===1&&c.event.trigger("ajaxStop");w.abort();return false}b.global&&
c.triggerGlobal(b,"ajaxSend",[w,b]);var L=w.onreadystatechange=function(m){if(!w||w.readyState===0||m==="abort"){J||c.handleComplete(b,w,e,f);J=true;if(w)w.onreadystatechange=c.noop}else if(!J&&w&&(w.readyState===4||m==="timeout")){J=true;w.onreadystatechange=c.noop;e=m==="timeout"?"timeout":!c.httpSuccess(w)?"error":b.ifModified&&c.httpNotModified(w,b.url)?"notmodified":"success";var p;if(e==="success")try{f=c.httpData(w,b.dataType,b)}catch(q){e="parsererror";p=q}if(e==="success"||e==="notmodified")d||
c.handleSuccess(b,w,e,f);else c.handleError(b,w,e,p);d||c.handleComplete(b,w,e,f);m==="timeout"&&w.abort();if(b.async)w=null}};try{var g=w.abort;w.abort=function(){w&&Function.prototype.call.call(g,w);L("abort")}}catch(i){}b.async&&b.timeout>0&&setTimeout(function(){w&&!J&&L("timeout")},b.timeout);try{w.send(l||b.data==null?null:b.data)}catch(n){c.handleError(b,w,null,n);c.handleComplete(b,w,e,f)}b.async||L();return w}},param:function(a,b){var d=[],e=function(h,l){l=c.isFunction(l)?l():l;d[d.length]=
encodeURIComponent(h)+"="+encodeURIComponent(l)};if(b===B)b=c.ajaxSettings.traditional;if(c.isArray(a)||a.jquery)c.each(a,function(){e(this.name,this.value)});else for(var f in a)da(f,a[f],b,e);return d.join("&").replace(tb,"+")}});c.extend({active:0,lastModified:{},etag:{},handleError:function(a,b,d,e){a.error&&a.error.call(a.context,b,d,e);a.global&&c.triggerGlobal(a,"ajaxError",[b,a,e])},handleSuccess:function(a,b,d,e){a.success&&a.success.call(a.context,e,d,b);a.global&&c.triggerGlobal(a,"ajaxSuccess",
[b,a])},handleComplete:function(a,b,d){a.complete&&a.complete.call(a.context,b,d);a.global&&c.triggerGlobal(a,"ajaxComplete",[b,a]);a.global&&c.active--===1&&c.event.trigger("ajaxStop")},triggerGlobal:function(a,b,d){(a.context&&a.context.url==null?c(a.context):c.event).trigger(b,d)},httpSuccess:function(a){try{return!a.status&&location.protocol==="file:"||a.status>=200&&a.status<300||a.status===304||a.status===1223}catch(b){}return false},httpNotModified:function(a,b){var d=a.getResponseHeader("Last-Modified"),
e=a.getResponseHeader("Etag");if(d)c.lastModified[b]=d;if(e)c.etag[b]=e;return a.status===304},httpData:function(a,b,d){var e=a.getResponseHeader("content-type")||"",f=b==="xml"||!b&&e.indexOf("xml")>=0;a=f?a.responseXML:a.responseText;f&&a.documentElement.nodeName==="parsererror"&&c.error("parsererror");if(d&&d.dataFilter)a=d.dataFilter(a,b);if(typeof a==="string")if(b==="json"||!b&&e.indexOf("json")>=0)a=c.parseJSON(a);else if(b==="script"||!b&&e.indexOf("javascript")>=0)c.globalEval(a);return a}});
if(E.ActiveXObject)c.ajaxSettings.xhr=function(){if(E.location.protocol!=="file:")try{return new E.XMLHttpRequest}catch(a){}try{return new E.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}};c.support.ajax=!!c.ajaxSettings.xhr();var ea={},vb=/^(?:toggle|show|hide)$/,wb=/^([+\-]=)?([\d+.\-]+)(.*)$/,ba,pa=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];c.fn.extend({show:function(a,b,d){if(a||a===0)return this.animate(S("show",
3),a,b,d);else{d=0;for(var e=this.length;d<e;d++){a=this[d];b=a.style.display;if(!c.data(a,"olddisplay")&&b==="none")b=a.style.display="";b===""&&c.css(a,"display")==="none"&&c.data(a,"olddisplay",qa(a.nodeName))}for(d=0;d<e;d++){a=this[d];b=a.style.display;if(b===""||b==="none")a.style.display=c.data(a,"olddisplay")||""}return this}},hide:function(a,b,d){if(a||a===0)return this.animate(S("hide",3),a,b,d);else{a=0;for(b=this.length;a<b;a++){d=c.css(this[a],"display");d!=="none"&&c.data(this[a],"olddisplay",
d)}for(a=0;a<b;a++)this[a].style.display="none";return this}},_toggle:c.fn.toggle,toggle:function(a,b,d){var e=typeof a==="boolean";if(c.isFunction(a)&&c.isFunction(b))this._toggle.apply(this,arguments);else a==null||e?this.each(function(){var f=e?a:c(this).is(":hidden");c(this)[f?"show":"hide"]()}):this.animate(S("toggle",3),a,b,d);return this},fadeTo:function(a,b,d,e){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,d,e)},animate:function(a,b,d,e){var f=c.speed(b,
d,e);if(c.isEmptyObject(a))return this.each(f.complete);return this[f.queue===false?"each":"queue"](function(){var h=c.extend({},f),l,k=this.nodeType===1,o=k&&c(this).is(":hidden"),x=this;for(l in a){var r=c.camelCase(l);if(l!==r){a[r]=a[l];delete a[l];l=r}if(a[l]==="hide"&&o||a[l]==="show"&&!o)return h.complete.call(this);if(k&&(l==="height"||l==="width")){h.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY];if(c.css(this,"display")==="inline"&&c.css(this,"float")==="none")if(c.support.inlineBlockNeedsLayout)if(qa(this.nodeName)===
"inline")this.style.display="inline-block";else{this.style.display="inline";this.style.zoom=1}else this.style.display="inline-block"}if(c.isArray(a[l])){(h.specialEasing=h.specialEasing||{})[l]=a[l][1];a[l]=a[l][0]}}if(h.overflow!=null)this.style.overflow="hidden";h.curAnim=c.extend({},a);c.each(a,function(A,C){var J=new c.fx(x,h,A);if(vb.test(C))J[C==="toggle"?o?"show":"hide":C](a);else{var w=wb.exec(C),I=J.cur()||0;if(w){var L=parseFloat(w[2]),g=w[3]||"px";if(g!=="px"){c.style(x,A,(L||1)+g);I=(L||
1)/J.cur()*I;c.style(x,A,I+g)}if(w[1])L=(w[1]==="-="?-1:1)*L+I;J.custom(I,L,g)}else J.custom(I,C,"")}});return true})},stop:function(a,b){var d=c.timers;a&&this.queue([]);this.each(function(){for(var e=d.length-1;e>=0;e--)if(d[e].elem===this){b&&d[e](true);d.splice(e,1)}});b||this.dequeue();return this}});c.each({slideDown:S("show",1),slideUp:S("hide",1),slideToggle:S("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){c.fn[a]=function(d,e,f){return this.animate(b,
d,e,f)}});c.extend({speed:function(a,b,d){var e=a&&typeof a==="object"?c.extend({},a):{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};e.duration=c.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in c.fx.speeds?c.fx.speeds[e.duration]:c.fx.speeds._default;e.old=e.complete;e.complete=function(){e.queue!==false&&c(this).dequeue();c.isFunction(e.old)&&e.old.call(this)};return e},easing:{linear:function(a,b,d,e){return d+e*a},swing:function(a,b,d,e){return(-Math.cos(a*
Math.PI)/2+0.5)*e+d}},timers:[],fx:function(a,b,d){this.options=b;this.elem=a;this.prop=d;if(!b.orig)b.orig={}}});c.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this);(c.fx.step[this.prop]||c.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a=parseFloat(c.css(this.elem,this.prop));return a&&a>-1E4?a:0},custom:function(a,b,d){function e(l){return f.step(l)}
var f=this,h=c.fx;this.startTime=c.now();this.start=a;this.end=b;this.unit=d||this.unit||"px";this.now=this.start;this.pos=this.state=0;e.elem=this.elem;if(e()&&c.timers.push(e)&&!ba)ba=setInterval(h.tick,h.interval)},show:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.show=true;this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur());c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.hide=true;
this.custom(this.cur(),0)},step:function(a){var b=c.now(),d=true;if(a||b>=this.options.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;for(var e in this.options.curAnim)if(this.options.curAnim[e]!==true)d=false;if(d){if(this.options.overflow!=null&&!c.support.shrinkWrapBlocks){var f=this.elem,h=this.options;c.each(["","X","Y"],function(k,o){f.style["overflow"+o]=h.overflow[k]})}this.options.hide&&c(this.elem).hide();if(this.options.hide||
this.options.show)for(var l in this.options.curAnim)c.style(this.elem,l,this.options.orig[l]);this.options.complete.call(this.elem)}return false}else{a=b-this.startTime;this.state=a/this.options.duration;b=this.options.easing||(c.easing.swing?"swing":"linear");this.pos=c.easing[this.options.specialEasing&&this.options.specialEasing[this.prop]||b](this.state,a,0,1,this.options.duration);this.now=this.start+(this.end-this.start)*this.pos;this.update()}return true}};c.extend(c.fx,{tick:function(){for(var a=
c.timers,b=0;b<a.length;b++)a[b]()||a.splice(b--,1);a.length||c.fx.stop()},interval:13,stop:function(){clearInterval(ba);ba=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){c.style(a.elem,"opacity",a.now)},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=null)a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit;else a.elem[a.prop]=a.now}}});if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===
b.elem}).length};var xb=/^t(?:able|d|h)$/i,Ia=/^(?:body|html)$/i;c.fn.offset="getBoundingClientRect"in t.documentElement?function(a){var b=this[0],d;if(a)return this.each(function(l){c.offset.setOffset(this,a,l)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);try{d=b.getBoundingClientRect()}catch(e){}var f=b.ownerDocument,h=f.documentElement;if(!d||!c.contains(h,b))return d||{top:0,left:0};b=f.body;f=fa(f);return{top:d.top+(f.pageYOffset||c.support.boxModel&&
h.scrollTop||b.scrollTop)-(h.clientTop||b.clientTop||0),left:d.left+(f.pageXOffset||c.support.boxModel&&h.scrollLeft||b.scrollLeft)-(h.clientLeft||b.clientLeft||0)}}:function(a){var b=this[0];if(a)return this.each(function(x){c.offset.setOffset(this,a,x)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);c.offset.initialize();var d,e=b.offsetParent,f=b.ownerDocument,h=f.documentElement,l=f.body;d=(f=f.defaultView)?f.getComputedStyle(b,null):b.currentStyle;
for(var k=b.offsetTop,o=b.offsetLeft;(b=b.parentNode)&&b!==l&&b!==h;){if(c.offset.supportsFixedPosition&&d.position==="fixed")break;d=f?f.getComputedStyle(b,null):b.currentStyle;k-=b.scrollTop;o-=b.scrollLeft;if(b===e){k+=b.offsetTop;o+=b.offsetLeft;if(c.offset.doesNotAddBorder&&!(c.offset.doesAddBorderForTableAndCells&&xb.test(b.nodeName))){k+=parseFloat(d.borderTopWidth)||0;o+=parseFloat(d.borderLeftWidth)||0}e=b.offsetParent}if(c.offset.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"){k+=
parseFloat(d.borderTopWidth)||0;o+=parseFloat(d.borderLeftWidth)||0}d=d}if(d.position==="relative"||d.position==="static"){k+=l.offsetTop;o+=l.offsetLeft}if(c.offset.supportsFixedPosition&&d.position==="fixed"){k+=Math.max(h.scrollTop,l.scrollTop);o+=Math.max(h.scrollLeft,l.scrollLeft)}return{top:k,left:o}};c.offset={initialize:function(){var a=t.body,b=t.createElement("div"),d,e,f,h=parseFloat(c.css(a,"marginTop"))||0;c.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",
height:"1px",visibility:"hidden"});b.innerHTML="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";a.insertBefore(b,a.firstChild);d=b.firstChild;e=d.firstChild;f=d.nextSibling.firstChild.firstChild;this.doesNotAddBorder=e.offsetTop!==5;this.doesAddBorderForTableAndCells=
f.offsetTop===5;e.style.position="fixed";e.style.top="20px";this.supportsFixedPosition=e.offsetTop===20||e.offsetTop===15;e.style.position=e.style.top="";d.style.overflow="hidden";d.style.position="relative";this.subtractsBorderForOverflowNotVisible=e.offsetTop===-5;this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==h;a.removeChild(b);c.offset.initialize=c.noop},bodyOffset:function(a){var b=a.offsetTop,d=a.offsetLeft;c.offset.initialize();if(c.offset.doesNotIncludeMarginInBodyOffset){b+=parseFloat(c.css(a,
"marginTop"))||0;d+=parseFloat(c.css(a,"marginLeft"))||0}return{top:b,left:d}},setOffset:function(a,b,d){var e=c.css(a,"position");if(e==="static")a.style.position="relative";var f=c(a),h=f.offset(),l=c.css(a,"top"),k=c.css(a,"left"),o=e==="absolute"&&c.inArray("auto",[l,k])>-1;e={};var x={};if(o)x=f.position();l=o?x.top:parseInt(l,10)||0;k=o?x.left:parseInt(k,10)||0;if(c.isFunction(b))b=b.call(a,d,h);if(b.top!=null)e.top=b.top-h.top+l;if(b.left!=null)e.left=b.left-h.left+k;"using"in b?b.using.call(a,
e):f.css(e)}};c.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),d=this.offset(),e=Ia.test(b[0].nodeName)?{top:0,left:0}:b.offset();d.top-=parseFloat(c.css(a,"marginTop"))||0;d.left-=parseFloat(c.css(a,"marginLeft"))||0;e.top+=parseFloat(c.css(b[0],"borderTopWidth"))||0;e.left+=parseFloat(c.css(b[0],"borderLeftWidth"))||0;return{top:d.top-e.top,left:d.left-e.left}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||t.body;a&&!Ia.test(a.nodeName)&&
c.css(a,"position")==="static";)a=a.offsetParent;return a})}});c.each(["Left","Top"],function(a,b){var d="scroll"+b;c.fn[d]=function(e){var f=this[0],h;if(!f)return null;if(e!==B)return this.each(function(){if(h=fa(this))h.scrollTo(!a?e:c(h).scrollLeft(),a?e:c(h).scrollTop());else this[d]=e});else return(h=fa(f))?"pageXOffset"in h?h[a?"pageYOffset":"pageXOffset"]:c.support.boxModel&&h.document.documentElement[d]||h.document.body[d]:f[d]}});c.each(["Height","Width"],function(a,b){var d=b.toLowerCase();
c.fn["inner"+b]=function(){return this[0]?parseFloat(c.css(this[0],d,"padding")):null};c.fn["outer"+b]=function(e){return this[0]?parseFloat(c.css(this[0],d,e?"margin":"border")):null};c.fn[d]=function(e){var f=this[0];if(!f)return e==null?null:this;if(c.isFunction(e))return this.each(function(l){var k=c(this);k[d](e.call(this,l,k[d]()))});if(c.isWindow(f))return f.document.compatMode==="CSS1Compat"&&f.document.documentElement["client"+b]||f.document.body["client"+b];else if(f.nodeType===9)return Math.max(f.documentElement["client"+
b],f.body["scroll"+b],f.documentElement["scroll"+b],f.body["offset"+b],f.documentElement["offset"+b]);else if(e===B){f=c.css(f,d);var h=parseFloat(f);return c.isNaN(h)?f:h}else return this.css(d,typeof e==="string"?e:e+"px")}})})(window);(function(){var initializing=false,fnTest=/xyz/.test(function(){xyz})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(prop){var _super=this.prototype;initializing=true;var prototype=new this;initializing=false;for(var name in prop)prototype[name]=typeof prop[name]=="function"&&typeof _super[name]=="function"&&fnTest.test(prop[name])?function(name,fn){return function(){var tmp=this._super;this._super=_super[name];var ret=fn.apply(this,arguments);this._super=tmp;return ret}}(name,prop[name]):
prop[name];function Class(){if(!initializing&&this.init)this.init.apply(this,arguments)}Class.prototype=prototype;Class.constructor=Class;Class.extend=arguments.callee;return Class}})();

PbEvent=function(){var _events=["pb-nodeclick","pb-nodekill","pb-nodeflip","pb-nodechange","pb-pan","pb-rotate","pb-zoom"],_isValidType=function(t){for(var e in _events)if(t==_events[e])return true},_error=function(e){console.log("PhyloBox Error: "+e);return false};return{addListener:function(pB,t,h){if(!pB)return _error("you must supply a valid PhyloBox object...");if(_isValidType(t))pB.addListener(t,h);else return _error("invalid PhyloBox event requested...")},removeListener:function(pB,t,h){if(!pB)return _error("you must supply a valid PhyloBox object...");
if(_isValidType(t))pB.removeListener(t,h);else return _error("invalid PhyloBox event requested...")}}}();

