(function() {
    var gen_raw_height_map = function(x_origin, y_origin, width, height, depth, random, generator, zoom) {
        var size  = width * height;
        var heights  = new Float32Array( size );
        var y_limit = y_origin + height;
        var x_limit = x_origin + width;
        // zero the heights
        for(var i = 0; i < size; i ++)  heights[i] = 0;
        // initial terrain generation.. looks like it does
        // multiple passes over the terrain building out
        // and reinforcing the noise as it goes..
        for(var j = 0; j < 4; j++ ){
            var linear_ctr = 0;
            for(var y = y_origin; y < y_limit; y++ ){
                for(var x = x_origin; x < x_limit; x++ ){
                    var noise  = generator.noise( x / zoom, y / zoom, depth );
                    heights[linear_ctr]  += Math.abs( noise * zoom * 5 *2 );
                    linear_ctr++;
                }
            }
            zoom *= 5;
        }
        return heights;
    };
    
    var smooth_height_map = function(heights, width, length, smoothing_const) {
        var calc_index = function(x, y, width) {
            return x + (y * width);
        };
        var do_smoothing = function(hm, target, neighbor) {
            var target_val = hm[target];
            var neighbor_val = typeof(hm[neighbor]) == 'undefined' ?
                target_val : hm[neighbor];
            hm[target] = neighbor_val * (1-smoothing_const) + 
                target_val * smoothing_const;
        };
        var index = 0;
        /* Rows, left to right */
        for (z = 0;z < length; z++) {
            for(x = 0;x < width; x++) {
                index = calc_index(x, z, width);
                var west_index = calc_index(x-1, z, width);
                do_smoothing(heights, index, west_index);
            }
        }
        /* Rows, right to left*/
        for (z = 0;z < length; z++) {
            for(x = width-1;x < -1; x--) {
                index = calc_index(x, z, width);
                var east_index = calc_index(x+1, z, width);
                do_smoothing(heights, index, east_index);
            }
        }
        /* Columns, top to bottom */
        for(x = 0;x < width; x++) {
            for (z = 0;z < length; z++) {
                index = calc_index(x, z, width);
                var north_index = calc_index(x, z-1, width);
                do_smoothing(heights, index, north_index);
            }
        }
        /* Columns, bottom to top */
        for(x = 0;x < width; x++) {
            for (z = length-1; z < -1; z--) {
                index = calc_index(x, z, width);
                var south_index = calc_index(x, z+1, width);
                do_smoothing(heights, index, south_index);
            }
        }
        return heights;
    };

    var WorldSimGenerator = function(seed, noise_type) {
        var WorldSim = function(seed, noise_type) {
            // if no seed is provided, we will get a random one and
            // set it aside for reuse. this world instance has be consistent
            // for its lifetime
            if (typeof(seed) == 'undefined') {
                seed = Math.seedrandom();
            }
            this.seed = seed;
            this.noise_type = noise_type;
        };
        WorldSim.prototype.generate_map_for = function(x,y,width,height, quality) {
            var size  = width * height;
            Math.seedrandom(this.seed);
            var random = Math.random;
            var simplex_orig = new SimplexNoise(random);
            var noise_generators = {
                simplex: {
                    noise: function(x, y, z) {
                        return simplex_orig.noise3D(x, y, z);
                    }
                },
                perlin: new ImprovedNoise()
            };
            var generator = noise_generators[this.noise_type];
            var z  = random() * 100;
            var heights = gen_raw_height_map(x, y, width, height, z, random, generator, quality);
            heights = smooth_height_map(heights, width, height, 0.35);
            
            // terrain coloring.. will one color scheme for whole
            // map for now.. this should be pushed down into the
            // tiles sooner or later.
            // brown - 96,32,0 - #602000
            var colors = {
                min_color: 0x031400,
                rng_color: 0x031400
            };
            var new_map = new ss0.backend.game.map.Map(width, height, colors);
            new_map.reset_with_height_map(size, heights);
            return new_map;
        };
        
        return new WorldSim(seed, noise_type);
    };
    sugs.namespace.set(this, 'ss0.backend.game.world', function(world) {
        world.WorldSim = WorldSimGenerator;
    });
}).call(this);
