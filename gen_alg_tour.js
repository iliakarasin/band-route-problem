( function ( d3, _ ) {
	"use strict";
	console.log( "*mario voice* here we goooo" );

	var w = 960, // px
	    h = 500, // px
	    centered,
	    state_stroke_color = '#fff',
	    state_fill_color = '#d1f542',
	    state_stroke_size = '2px',
	    line_color = '#000',
	    arrow_size = 5,
	    dot_scale = 40, // radius
	    cities = [];

	var path = d3.geo.path();

	// make canvas
	var svg = d3.select( "#route-canvas" ).append( "svg" )
	    .attr( "height", h )
	    .attr( "width", w );

	// more canvas
	svg.append( "rect" )
	    .attr( "class", "background" )
	    .attr("width", w)
	    .attr("height", h)
	    .on( "click", map_click );

	// scaffold states
	var g = svg.append("g")
	    .attr("id", "states");

    // make states from json
	d3.json( "us-states.json", function( json ) {
	  g.selectAll( "path" )
	      .data( json.features )
	    .enter().append( "path" )
	      .attr( "d", path )
	      .on( "click", map_click );
	});

	// build `->` elem
	// @TODO(IK): var arrow w/h a, obj maybe?
	svg.append( "svg:defs" )
	  .append( "svg:marker" )
	    .attr( "id", "directed-line" )
	    .attr( "viewBox", "0 -5 10 10" )
	    .attr( "refX", 15 )
	    .attr( "refY", -1.5 )
	    .attr( "markerWidth", arrow_size ) // width of arrow
	    .attr( "markerHeight", arrow_size ) // height of arrow
	    .attr( "orient", "auto" )
	    .attr( "stroke", line_color )
	  .append( "svg:path" )
	    .attr( "d", "M0,-5L10,0L0,5" );

	// pretty much what you think
	function map_click() {
        d3.select(this)
        	.attr( "fill", state_fill_color )
        	.attr( "stroke", state_stroke_color )
        	.attr( "stroke-width", state_stroke_size );
		cities.push( d3.mouse( this ) );
		draw_cities();
	}

	// self explanatory
	function stop() {
		cities = [];
		svg.selectAll( "circle" ).remove();
		svg.selectAll( "path.connection" ).remove();
	}

	// draw points as cities
	function draw_cities() {
		svg.selectAll( "circle" ).data( cities ).enter()
		.append( "svg:image" )
			.attr( "xlink:href", "stage.png")
			.attr( "width", dot_scale )
			.attr( "height", dot_scale )
			.attr( "y", function ( d ) {
				return d[ 1 ] - ( dot_scale / 2 ) // offset
			} )
			.attr( "x", function ( d ) {
				return d[ 0 ] - ( dot_scale / 2 ) // offset 
			} )
			.attr( "class", "city" );
	}

	function show_thinker() {
		var _el = document.getElementById( "thinking" );
		_el.classList.add( "show" );
	}

	function hide_thinker() {
		var _el = document.getElementById( "thinking" );
		_el.classList.remove( "show" );
	}

	function drawPaths( ipath ) {
		var paths = _.map(
			_.zip(
				ipath.slice( 0, ipath.length - 1), ipath.slice( 1 ) ), function ( pair ) {
				return [ cities [ pair [ 0 ] ], cities [ pair [ 1 ] ] ]
		}).slice();

		svg.selectAll( "path.connection" ).remove();
		svg.selectAll( "path.connection" ).data( paths ).enter()
			.append( "path" )
				.attr( "d", function( d ) {
			    var dx = d[ 1 ][ 0 ] - d[ 0 ][ 0 ],
			        dy = d[ 1 ][ 1 ] - d[ 0 ][ 1 ],
			        dr = Math.sqrt( dx * dx + dy * dy );
			    return "M" + d[ 0 ][ 0 ] + "," + d[ 0 ][ 1 ] + "A" + dr + "," + dr + " 0 0,1 " + d[ 1 ][ 0 ] + "," + d[ 1 ][ 1 ];
			  })
				.attr( "class", "connection" )
    		.attr( "marker-end", "url(#directed-line)" );
	}

	// @TODO(IK): this whole method is gross, refactor
	function run() {
		console.log("running", cities);
		
		show_thinker();

		setTimeout( function() {
			var answer = the_travel(cities, {});
			drawPaths(answer.initial.path);
		}, 500);
		
		setTimeout( function () {
			hide_thinker();
			var answer = the_travel(cities, {});
			drawPaths(answer.final.path);
		}, 750);
	}

	// @NOTE(IK): refactored using simulated annealing
	function sum(arr) {
		return _.reduce( arr, function ( x,y ){
			return x + y;
		}, 0);
	}

	function cc_cost( c1, c2 ) {
		return Math.sqrt( Math.pow( c1[ 0 ] - c2[ 0 ], 2 ) + Math.pow( c1[ 1 ] - c2[ 1 ], 2 ) );
	}

	function path_cost( path ) {
		var zipped = _.zip( path.slice( 0, path.length - 1 ), path.slice( 1 ) );
		return sum( _.map( zipped, function ( pair ) {
			return cc_cost( cities[ pair[ 0 ] ], cities[ pair[ 1 ] ] );
		}));
	}

	function random_path() {
		var n = cities.length,
				path = [0], // start 0
				rest = _.range( 1, n );

		while ( rest.length > 0 ) {
			var i = Math.floor( Math.random() * rest.length );
			
			path.push( rest[ i ] );
			rest.splice( i, 1 );
		}

		return path.concat( [ 0 ] );
	}

	function invert( path, a, b ) {
		return path.slice( 0, a )
			.concat( path.slice( a, b ).reverse() )
			.concat( path.slice( b) );
	}

	function translate( path, a, b ) {
		return path.slice( 0, a )
			.concat(path.slice( b, b + 1 ) )
			.concat(path.slice( a, b ) )
			.concat(path.slice( b + 1 ) );
	}
	function switchh( path, a, b ) {
		return path.slice( 0, a )
			.concat( path.slice( b - 1, b ) )
			.concat( path.slice( a + 1, b - 1 ) )
			.concat( path.slice( a, a + 1 ) )
			.concat( path.slice( b ) );
	}

	var operations = [
		[ .75, invert ],
		[ .125, translate ],
		[ .125, switchh ]
	];

	function create_new_path( path ) {
		var roll = Math.random(),
				a = Math.floor( Math.random() * ( path.length - 4 ) + 1 ),
				b = Math.floor( Math.random() * ( path.length - 4 )) + 3,
				_op = null;
		_.each( operations, function (pair) {
			if ( roll < pair[ 0 ] ) {
				_op = pair[1];
				roll = 1000;
			} else {
				roll -= pair[0];
			}
		});

		return _op( path, a, b );
	}

	function metro( c1, c2, T ) {
		return Math.random() <= Math.exp( ( c1 - c2 ) / T );
	}

	function anneal( T, lambda ) {
		return T * lambda;
	}

	function rounder( cur, T ) {
		var newpath = create_new_path( cur.path ),
			newcost = path_cost( newpath );

		if ( ( newcost < cur.cost ) || metro( newcost, cur.cost ) ) {
			return {
				path: newpath,
				cost: newcost
			};
		} else {
			return cur;
		}
	}

	// iterate to final answer
	function do_it( options ) {
		var T = options.T,
			path = random_path(),
			cur = {
				path: path,
				cost: path_cost( path )
			},
			answer = {
				initial: cur
			},
			i;

		if ( options.onRound ) {
			options.onRound( cur.path )
		};

		console.log( "starting...", cur );

		for ( i = 1; i < options.N; i++ ) {
			cur = rounder( cur, T );

			if ( i % options.round ) {
				T = anneal( T, options.lambda );
				
				if ( operations.onRound ) {
					options.onRound( cur.path );
				}

				console.log( "iterate... " + i, cur );
			}
		}
		console.log( "finished...", cur );
		
		answer.final = cur;

		return answer;
	}

	function the_travel( cities, options ) {
		options = options || {};
		options.N = options.N || 10000; // max loss
		options.T = options.T || 70;
		options.lambda = options.lambda || 0.95;
		options.round = options.round || 100;

		return do_it( options );
	}

	// button binds
	d3.select( "#start" ).on( "click", run );
	d3.select( "#stop" ).on( "click", stop );

	console.log( "ready" );
})(d3, _);