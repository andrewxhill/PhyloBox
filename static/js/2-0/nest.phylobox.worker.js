

var tree_data, n_leaves, n_layers;


onmessage = function (e) {
	// init vars
	var root = e.data.r, rid = e.data.rid, nodes = {},
	tree_data = e.data.td;
	n_leaves = 0; 
	n_layers = 0;
	// ensure proper tree direction
	if ( root.parent_id ) {
		// if root is leaf, root's parent becomes root
		if ( ! root.children ) root = _find( tree_data, "id", root.parent_id );
		// parent -> child
		root.children.push( { "id": root.parent_id } );
		// child -> parent
		var parent = _find( tree_data, "id", root.parent_id );
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
	

	
	
	nodes.is_root = true;
	nodes.n_parents = 0;
	_branch( nodes, root );
	
	
	// postMessage({
	//  	type: "complete",
	//  	nodes: nodes
	// });
	
	

};


// walk node children
function _branch( n, d ) {
	// ensure proper tree direction
	for ( var c in d.children ) {
		if ( ! d.children[c] ) continue;
		var cd = _find( tree_data, "id", d.children[c].id );
		// if ( cd.parent_id && cd.parent_id != d.id )
		if ( cd.parent_id && cd.parent_id != d.id ) {
			// parent -> child
			cd.children.push( { "id": cd.parent_id } );
			// child -> parent
			var cpd = _find( tree_data, "id", cd.parent_id );
			for ( var cc in cpd.children ) 
				if ( cpd.children[cc].id == cd.id ) 
					cpd.children.splice( cpd.children.indexOf( cpd.children[cc] ), 1 );
			// for ( cc in cpd.children ) if ( cpd.children[cc].id == cd.id ) delete cpd.children[cc];
			if ( cpd.children.length == 0 ) 
				cpd.children = null;
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
	
	n.children = [];
	
	// move down tree
	if ( ! d.children ) {
		n.is_leaf = true;
		n_leaves ++;
	} else 
		for ( var c in d.children ) {
			if ( ! d.children[c] ) continue;
			//var cn = new _Node( d.children[c].id );
			//n.add_child( cn );
			
			var cn = {};
			cd.id = d.children[c].id;
			
			n.children.push( cn ); 
			cn.parent = n;
			cn.n_parents = n.n_parents + 1;
			_branch( cn, _find( tree_data, "id", cn.id ) );
		}
	// max number parents = tree's layer count
	if ( n_layers <= n.n_parents ) n_layers = n.n_parents + 1;
	// collect node ref for list
	var i = 0;
	for ( prop in n.children[0] ) {
		var r = {};
		r.p = prop;
		r.v = n[prop];
		postMessage( r );
		i++;
		//if ( i > 6 ) break;
	}
	
	
	//postMessage( n.children.length );
	
	
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



