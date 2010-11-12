/*--------------------------------------------------------------------------.
|  Software: PhyloBox Events Wrapper                                        |
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
PbEvent = {
	// supported phylobox events
	_events : [
		"pb-nodeclick",
		"pb-nodekill",
		"pb-nodeflip",
		"pb-nodechange",
		"pb-pan",
		"pb-rotate",
		"pb-zoom"
	],
	// register an event with phylobox
	addListener : function( pB, t, h ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		if ( this._isValidType(t) ) 
			pB.addListener(t,h);
		else 
			return this._error("invalid PhyloBox event requested...");
	},
	// remove an event with phylobox
	removeListener : function( pB, t, h ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		if ( this._isValidType(t) ) 
			pB.removeListener(t,h);
		else 
			return this._error("invalid PhyloBox event requested...");
	},
	// checks if valid event type
	_isValidType : function( t ) {
		for ( var e in this._events )
			if ( t == this._events[e] )
				return true;
	},
	// throw and error to console and exit
	_error: function( e ) {
		console.log("PhyloBox Error: "+e);
		return false;
	}
}