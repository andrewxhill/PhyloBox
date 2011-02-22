/*--------------------------------------------------------------------------.
|  Software: PhyloBox API                                                   |
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
PbAPI = {
	//
	rotate : function( pB, d ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		// do something to pB with d
	},
	//
	translate : function( pB, d ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		// do something to pB with d
	},
	//
	zoom : function( pB, d ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		// do something to pB with d
	},
	//
	killNode : function( pB, d ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		// do something to pB with d
	},
	//
	flipNode : function( pB, d ) {
		if ( ! pB )
			return this._error("you must supply a valid PhyloBox object...");
		// do something to pB with d
	},
	// throw and error to console and exit
	_error: function( e ) {
		console.log("PhyloBox Error: "+e);
		return false;
	}
}