var __log = '';
 
// gen alg vars
var no_city = 75;
var m_width = 700;
var m_height = 700;
var pop_size = 200;  // use even number
var cross_rate = 0.8;
var mutate_rate = 0.05;  // for each new indi
var max_gen = 100;
var cross_gen = [];
var canvas;
var ctx;

var elite = [];
var cities;
var population;
var best = [];
var prev_pop_best = [];
var timer;
var count;
var low;

function print_message( m ) {
    __log = m;
    document.getElementById( "log" ).innerHTML = __log;
}
 
// start
document.getElementById( "start" ).addEventListener( "click", function() {
    this.disabled = true;
    document.getElementById( "stop" ).disabled = false;
     
    canvas = document.getElementById( "route-canvas" );
    canvas.width = m_width;
    canvas.height = m_height;
    ctx = canvas.getContext( "2d" );
    
    // arr of city numbers from 0 to no_city-1.
    cities = first_cities( no_city, m_width, m_height );

	// population[i] = [2, 5, 12, 56, 22, ...] 
    population = get_init_population( pop_size, cities);
 
    low = get_tour_len( population[0],cities );
    best = get_best_indi( population, cities );
    paint_indi( best, cities, ctx, canvas );

    count = 0;
    timer = setInterval ( go, 5 );
});

// stop
document.getElementById( "stop" ).addEventListener( "click", stop );
function stop() {
    clearInterval( timer );
    this.disabled = true;
    document.getElementById( "start" ).disabled = false;
};
 
// gen alg run
function go() {
    var next_pop = get_next_pop( population, cities );
    population = next_pop;
     
    best = get_best_indi( population, cities );
     
    paint_indi( best, cities, ctx, canvas );
     
    if ( !( count++ < max_gen ) ) {
        clearInterval( timer );
    }
}
 
function get_next_pop( population, cities ) {
    var next_pop = [];
     
    // gen alg here
    for ( var i = 0; i < pop_size; i++ ) {
        fitness_eval(population[i]);
        
        //to next pop arr
        next_pop = population.slice();
    }
     
    return next_pop;
}
 
function get_best_indi( population, cities ) {   
    var best_indi = [];
    var temp = 0;
    
    //best dist val
    for ( var i = 0; i < pop_size; i++ ) {
        temp = get_tour_len(population[i],cities);
        // console.log( "running; " + i + " " + population[i]);
        // console.log("score " + temp);
        
        if ( temp < low ) {
            low = temp;
            elite.push( population[i] );
             
            best_indi = population[i].slice();
            prev_pop_best = population[i].slice();
            // console.log( "low " + low );
        }
    }

    if ( best_indi.length > 0 ) {   
		// none
    } else {
       best_indi = prev_pop_best;
    }
         
    print_message( "gen = " + count + " rout length = " + Math.floor(low) + "\n" + "best route = " + best_indi );
    
    return best_indi;
}
 
 
function fitness_eval( population ){
    var lengths = [];

    for ( var i = 0; i < pop_size; i++ ) {
        lengths[i] = get_tour_len( population,  cities );
    }
    
    var sum = 0;
    for ( var i = 0; i < pop_size; i++ )
        sum += 1 / lengths[i];
    
    var fitnesses = []; 
    var sum2 = 0;
    for ( var i = 0; i < pop_size; i++ ) {
    	// sum[i] 1
        fitnesses[i] = (1.0 / lengths[i]) / sum; 
    }

    // get parents
    parent_select( fitnesses );//includes crossover, and roulette
    mutate();
}

function roulette_select( fitnesses ) {
	// r is in [0, 1)
    var r = Math.random();  
    var sum = 0;
    var select_indi_i;
     
    for ( var i = 0; i < pop_size; i++ ) {
         
        if ( r <= sum ) {
            select_indi_i = i;
            break;
        }
        sum += fitnesses[i];   
    }
     
    // assume last no r
    if (select_indi_i == null)
        select_indi_i = pop_size - 1; 
         
    // return parent
    return select_indi_i;
}

function parent_select( fitnesses ) {
    //Select two parent indis with cross_rate;
    var roulette = [];
    var fit_i = 0;
    var parent1;
    var parent2;
    var cross_1;
    var cross_2;
    var r = Math.random();
    var same_parent = false;
    
    if ( r <= 100 ) {
       	// ordered crossover, keep good to next gen
        var elite_offset = elite.length;
        for ( var i = 0; i < elite_offset; i++ ) {
            roulette[i] = elite[i];
        }

        for ( var i = elite_offset; i < pop_size; i++ ){
            fit_i = roulette_select( fitnesses ) ;
            // select indi based on fitness
            roulette[i] = population[fit_i];
        }
         
        // cross
        for ( var i = 0; i < pop_size-1; i++ ) {
            cross_1 = get_cross_point(no_city);
            cross_2 = get_cross_point(no_city);
             
            // is cross_1 smaller
            if (cross_1 > cross_2){
                var temp = cross_1;
                cross_1 = cross_2;
                cross_2 = temp;
            }

            // new pop w child
            cross_gen[i] = cross( roulette[i], roulette[i+1], cross_1, cross_2 );
             
        }
        
        cross_gen[pop_size - 1] = cross( roulette[cross_1], roulette[cross_2], cross_1, cross_2 ).slice();
         
        //copy to pop
        for ( var i = 0; i < pop_size; i++ ){
            // only good gen
            if ( get_tour_len( cross_gen[i], cities ) < get_tour_len( population[i], cities ) ) {
                population[i] = cross_gen[i];
            }
        }
    }
}
 
// crossover (ordered)
function cross( parent1, parent2, start_needle, end_needle ){
    var child=[];
     
    for ( var i = 0; i < no_city; i++ ) {
        child[i] = -1;
    }

	// add sub tour from par to child
    for (var i = 0; i < no_city; i++) {
        // end needle not less than start
        if ( i > start_needle && i < end_needle ) {
            child[i] = parent1[i];
        } 
    }
    
    // parent2 tour loop
    for ( var i = 0; i < no_city; i++ ) {
        // add city if none
        if ( !contains_city( child, parent2[i] ) ) {
            // find spare pos
            for ( var j = 0; j < no_city; j++ ) {
                    // add city
                    if ( child[j] == -1 ) {
                        child[j] = parent2[i];
                        break;
                    }
            }
        }
    }
    return child;
}

function contains_city(indi, city){
    var i = indi.length;
    while ( i-- ) {
       if ( indi[i] === city ) {
           return true;
       }
    }
    return false;
}
 
function mutate() {
    for ( i = 0; i < pop_size; i++ ) {
        var r = Math.random();

        if ( r < mutate_rate ) {
            //move the 2nd after 1st shift rest
            var a = Math.floor( Math.random() * ( no_city - 1 ) ) + 1;
            var b = Math.floor(Math.random() * ( no_city - 1) ) + 1;

            var temp;
            
            if ( a > b ) {
                temp = a;
                a = b;
                b = temp;
            }

            for ( var j = a; j < b-1; j++ ) {
                array_move(population[i],a+1,b);
            }
        }
    }
}
 
function array_move( arr, fromI, toI ) {
    var elem = arr[fromI];
    arr.splice( fromI, 1 );
    arr.splice( toI, 0, elem );
}

function get_tour_len( population, cities ){
    var tour = 0;
    var dist = 0;

    for ( var i = 0; i < no_city-1; i++ ) {
        // from city pop i and i + 1
        dist = get_dist_between_cities(population[i], population[i+1], cities);
        tour += dist;   
    }
     
    // connect last to first
    last_city = population[population.length-1];
    first_city = population[0];
    dist = get_dist_between_cities(first_city, last_city, cities);
    tour += dist;
 
    return tour;
}