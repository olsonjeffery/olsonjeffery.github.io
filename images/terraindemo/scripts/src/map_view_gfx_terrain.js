(function(){
  var local_got = function(width, height, tile_size, orders) {
  };
  /**
   * Generate a light map
   * TODO make it more tunable
   * TODO make that usable standalone
  */
  var local_gt = function( game_map, width, height, minColor, rngColor ){
  	var sun		= new THREE.Vector3( .3, 1, 1 );
  	//var sun		= new THREE.Vector3( 1, 0.5, 1 );
  	sun.normalize();
  
  	var canvas	= document.createElement( 'canvas' );
  	canvas.width	= width;
  	canvas.height	= height;
  
  	var context	= canvas.getContext( '2d' );
  	context.fillStyle = '#000';
  	context.fillRect(0, 0, width, height );
  
  	var image	= context.getImageData( 0, 0, canvas.width, canvas.height );
  	var imageData	= image.data;
  
      //colors
  
  	var normal	= new THREE.Vector3( 0, 0, 0 );
  	for ( var i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {
      // so this is pretty entangled in the impl details of the grid..
      // it's getting info on surrounding tiles...
      var spot = ss0.game.map_util.get_tile_single_dim(game_map,j);
      var spot_height = spot == undefined ?
        0 : spot.height;
      var west = ss0.game.map_util.get_tile_single_dim(game_map, j - 2 );
      var west_height = west == undefined ?
        0 : west.height;
      var east = ss0.game.map_util.get_tile_single_dim(game_map, j + 2 );
      var east_height = east == undefined ?
        0 : east.height;
      var north = ss0.game.map_util.get_tile_single_dim(game_map, j - width * 2 );
      var north_height = north == undefined ?
        0 : north.height;
      var south = ss0.game.map_util.get_tile_single_dim(game_map, j + width * 2 );
      var south_height = south == undefined ?
        0 : south.height;
  		// compute the normal
  		normal.x	= west_height - east_height;
  		normal.y	= 3;
  		normal.z	= north_height - south_height;
  		normal.normalize();
  		// compute the shade
  		var shade	= normal.dot( sun );
  		// fill the pixel
  		// - make color tunable
  		var factor		= 194.0 * ( 0.5 + spot_height * 0.015 );
  		//var factor		= 256.0;
  		imageData[i + 0]	= (minColor.r + shade * rngColor.r) * factor;
  		imageData[i + 1]	= (minColor.g + shade * rngColor.g) * factor;
  		imageData[i + 2]	= (minColor.b + shade * rngColor.b) * factor;
  	}
  	// draw the image in a canvas
  	context.putImageData(image, 0, 0);
  
  	var texture	= new THREE.Texture(canvas);
  	texture.needsUpdate = true;
  
  	return texture;
  
  	// Scaled 4x
  	var canvasScaled	= document.createElement( 'canvas' );
  	canvasScaled.width	= width  * 4;
  	canvasScaled.height	= height * 4;
  
  	var context	= canvasScaled.getContext( '2d' );
  	context.scale(4, 4);
  	context.drawImage(canvas, 0, 0);
  
  
  	var image	= context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
  	var imageData	= image.data;
  	for(var i = 0; i < imageData.length; i += 4){
  		var v	= Math.floor( Math.random() * 5 );
  		imageData[i + 0]	+= v;
  		imageData[i + 1]	+= v;
  		imageData[i + 2]	+= v;
  	}
  	context.putImageData(image, 0, 0);
  
  	return canvasScaled;
  
  };
  
  /**
   * terrain generator geometry
   *
   * all hard work in http://mrdoob.github.com/three.js/examples/webgl_geometry_terrain.html
  */
  var local_gtg = function(opts){
  	// build basic geometry
    var calc_index = function(x, y, width) {
      return x + (y * width);
    };
  	var game_map = opts.game_map;
    var tGeometry	= new THREE.PlaneGeometry(opts.x_size, opts.y_size, opts.segmentsW-1, opts.segmentsH-1 );
  	tGeometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
  
    // so, this is kinda weird.. but.. in terms of the geometry,
    // the "height" represents the vertex in the upper-left
    // corner of our Tile in the game_map .. so we actually created
    // an extra set of vertexes along the "right" and "bottom" edges
    // of the map, so that the Tiles on the respective edges of the
    // game_map actually have some space of their own
    var last_h = 0;
    for(y = 0; y < opts.segmentsH; y++) {
      for(x = 0; x < opts.segmentsW; x++) {
        // here, segmentsW isnt' neccesary gonna == game_map.width..
        var map_i = calc_index(x, y, game_map.width);
        var geom_i = calc_index(x, y, opts.segmentsW);
        var h = ss0.game.map_util.get_tile_single_dim(game_map, map_i);
        h = typeof(h) == 'undefined' ? last_h : h.height;
        last_h = h;
  		  tGeometry.vertices[geom_i].y = h;
      }
    }
  
  	// mark the vertices as dirty
  	tGeometry.verticesNeedUpdate = true;
  	tGeometry.computeBoundingBox();
  	tGeometry.computeCentroids();
  	tGeometry.computeFaceNormals();
  	tGeometry.computeVertexNormals();
  
  	return tGeometry;
  };
  
  sugs.namespace.set(this,'ss0.map_view.gfx.terrain',function(terrain) {
    terrain.generate = local_gtg;
    terrain.generate_texture = local_gt;
    terrain.generate_overlay = local_got;
  });
}).call(this);
