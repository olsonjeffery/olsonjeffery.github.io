// This THREEx helper makes it easy to handle window resize.
// It will update renderer and camera when window is resized.
//
// # Usage
//
// **Step 1**: Start updating renderer and camera
//
// ```var windowResize = THREEx.WindowResize(aRenderer, aCamera)```
//    
// **Step 2**: Start updating renderer and camera
//
// ```windowResize.stop()```
// # Code

//

/** @namespace */
var THREEx	= THREEx 		|| {};

/**
 * Update renderer and camera when the window is resized
 * 
 * @param {Object} renderer the renderer to update
 * @param {Object} Camera the camera to update
*/
THREEx.WindowResize	= function(renderer, camera){
	var l_renderer = renderer;
  var l_camera = camera;
	var callback	= function(){
		// notify the renderer of the size change
		l_renderer.setSize( window.innerWidth, window.innerHeight );
		// update the camera
		l_camera.aspect	= window.innerWidth / window.innerHeight;
		l_camera.updateProjectionMatrix();
	};
	// bind the resize event
	window.addEventListener('resize', callback, false);
	// return .stop() the function to stop watching window resize
	return {
		do	: function(){
			callback();
		},
		set_camera: function(c) {
			l_camera = c;
			this.do();
		},
		/**
		 * Stop watching window resize
		*/
		stop	: function(){
			window.removeEventListener('resize', callback);
		}
	};
};
