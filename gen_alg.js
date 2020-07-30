    function get_init_population( pop_size, cities ) {
        var popu = [];
        for (var i = 0; i < pop_size; i++) {
            popu[i] = random_perm_cities(cities);  // Each item is an arr of city numbers from 0 to none-1.
        }
        
        return popu;
    }
    
    // length of an item
    function get_cross_point( length ) {
        return Math.floor( Math.random() * ( length - 1 ) ) + 1;  // [1, length-1]
    }
    
    // validity
    function check_indi( indi ) {
        for ( var i = 0; i < indi.length; i++ ) {
            for ( var j = i+1; j < indi.length; j++ ) {
                if ( indi[i] == indi[j] ) {
                    return false;
                }
            }
        
            return true;
        }
    }
    
    function paint_indi( indi, cities, ctx, canvas ) {
        var temp_cities = [];
        
        for ( var i = 0; i < indi.length; i++ ) {
            temp_cities[i] = cities[indi[i]];
        }
        
        paint_cities( temp_cities, ctx, canvas );
    }
    
    function get_dist_between_cities( a, b, cities ) {
        if ( a == undefined || b == undefined || a >= cities.length || b >= cities.length || a < 0 || b < 0 ) {
            alert('hmm; a=' + a + ', b=' + b);
        }
        
        return Math.sqrt( ( cities[a].x - cities[b].x ) * ( cities[a].x - cities[b].x ) + ( cities[a].y - cities[b].y ) * ( cities[a].y - cities[b].y ) );
    }
    
    function full_random_perm_cities( cities ) {
        var perm = [];
        
        for ( var i = 0; i < cities.length; i++ ) {
            perm[i] = i;
        }

        for ( var i; i < 100; i++ ) {
            for ( var j = 0; j < cities.length; j++ ) {
                var k = Math.floor( Math.random() * cities.length );
                var temp;
                temp = perm[j];
                perm[j] = perm[k];
                perm[k] = temp;
            }
        }
        
        return perm;
    }
    
    function random_perm_cities( cities ) {
        var perm = [];
        var city;
        var goal;
        
        city = 0;
        perm[city] = Math.floor( Math.random() * cities.length );
            
        while( perm.length < cities.length ) {
            var distances = [];
            var i = 0;
            
            for ( var to = 0; to < cities.length; to++ ) {
                if ( perm.indexOf( to ) < 0 ) {
                    distances[i++] = {
                        city: to,
                        distance: get_dist_between_cities( perm[city], to, cities )
                    };
                }
            }

            distances.sort( function( a, b ) {
                return a.distance - b.distance; 
            });
            
            goal = Math.floor( Math.random() * ( distances.length / 3 ) );
            
            city++;
            perm[city] = distances[goal].city;
			//console.log('distance =' +distances[goal].distance);
        }

        //console.log('perm = ' + perm[i].distance);
        return perm;
		
    }
    
    function paint_cities( cities, ctx, canvas ) {
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        
        for ( var i = 0; i < cities.length; i++ ) {
            paint_circle( ctx, cities[i].x, cities[i].y, 5, 0 );

            if ( i != cities.length - 1 ) {
                paint_line( ctx, cities[i].x, cities[i].y, cities[i+1].x, cities[i+1].y );
            } else {
                paint_line( ctx, cities[i].x, cities[i].y, cities[0].x, cities[0].y );
            }
        }
    }
    
    function paint_line( ctx, x1, y1, x2, y2 ) {
        ctx.moveTo( x1, y1 );
        ctx.lineTo( x2, y2 );
        ctx.stroke();
    }
    
    function paint_circle( ctx, x, y, r, a ) {
        ctx.beginPath();
        ctx.arc( x, y, r, a, 2 * Math.PI) ;
        ctx.stroke();
    }

    // n city, w x h canvas
    function first_cities( n, width, height ) {
        var cities = [];
        
        for ( var i = 0; i < n; i++ ) {
            var position = {};

            position['x'] = Math.floor( Math.random() * width );
            position['y'] = Math.floor( Math.random() * height );
            cities[i] = position;
        }

        return cities;
    }
    
    function default_map( cities, width, height ) {
        var n = cities.length;
        var distances = [];
        
        for ( var i = 0; i < n; i++ ) {
            var distance = [];
            var d;

            for ( var j = 0; j < n; j++ ) {
                d = Math.sqrt( ( cities[i].x - cities[j].x) * (cities[i].x - cities[j].x ) + ( cities[i].y - cities[j].y) * (cities[i].y - cities[j].y ) );
                distance[j] = d;
            }

            distances[i] = distance;
        }
        
        return distances;
    }
