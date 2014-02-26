(function() {
   var global = this;
   var tileUvWidth = 1/64;
   var tileUvHeight = 1/32;
   function uvmap(geometry, faceIdx, x1, y1, w, h) {
     var tileUvW= 1/64;
     var tileUvH= 1/32;
     var x2 = x1 + w;
     var y2 = y1 - h;
     var UVs= geometry.faceVertexUvs[0][faceIdx];
     UVs[0].x = x1 * tileUvW; UVs[0].y = y1 * tileUvH;
     UVs[1].x = x1 * tileUvW; UVs[1].y = y2 * tileUvH;
     UVs[2].x = x2 * tileUvW; UVs[2].y = y2 * tileUvH;
     UVs[3].x = x2 * tileUvW; UVs[3].y = y1 * tileUvH;
   };
   function uvmap_old (geometry, face, x, y, w, h, rotateBy) {
     if(!rotateBy) rotateBy = 0;
     var uvs = geometry.faceVertexUvs[0][face];
     var tileU = x;
     var tileV = y;
     
     uvs[ (0 + rotateBy) % 4 ].x = tileU * tileUvWidth;
     uvs[ (0 + rotateBy) % 4 ].y = tileV * tileUvHeight;
     uvs[ (1 + rotateBy) % 4 ].x = tileU * tileUvWidth;
     uvs[ (1 + rotateBy) % 4 ].y = tileV * tileUvHeight + h * tileUvHeight;
     uvs[ (2 + rotateBy) % 4 ].x = tileU * tileUvWidth + w * tileUvWidth;
     uvs[ (2 + rotateBy) % 4 ].y = tileV * tileUvHeight + h * tileUvHeight;
     uvs[ (3 + rotateBy) % 4 ].x = tileU * tileUvWidth + w * tileUvWidth;
     uvs[ (3 + rotateBy) % 4 ].y = tileV * tileUvHeight;
     geometry.uvNeedsUpdate = true;
   };
   function cubeFromPlanes (size, mat) {
     var cube = new THREE.Object3D();
     var meshes = [];
     for(var i=0; i < 6; i++) {
       var mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size),mat);
       mesh.doubleSided = true;
       cube.add(mesh);
       meshes.push(mesh);
     }
     // Front
     meshes[0].rotation.x = Math.PI/2;
     meshes[0].rotation.z = -Math.PI/2;
     meshes[0].position.x = size/2;
     
     // Back
     meshes[1].rotation.x = Math.PI/2;
     meshes[1].rotation.z = Math.PI/2;
     meshes[1].position.x = -size/2;
     
     // Top
     meshes[2].position.y = size/2;
     
     // Bottom
     meshes[3].rotation.y = Math.PI;
     meshes[3].rotation.z = Math.PI;
     meshes[3].position.y = -size/2;
     
     // Left
     meshes[4].rotation.x = Math.PI/2;
     meshes[4].position.z = size/2;
     
     // Right
     meshes[5].rotation.x = -Math.PI/2;
     meshes[5].rotation.y = Math.PI;
     meshes[5].position.z = -size/2;
     
     return cube;
   };
   var create_actor_material = function(img_path, done_cb) {
     var skincanvas = global.document.createElement('canvas');
     skincanvas.width = 64;
     skincanvas.height = 32;
     var skinc = skincanvas.getContext('2d');
     var skin_img = new Image();
     skin_img.onload = function () {
       skinc.clearRect(0, 0, skincanvas.width, skincanvas.height);
       skinc.drawImage(skin_img, 0, 0);
       var material = new THREE.MeshBasicMaterial({
         map: new THREE.Texture(
           skincanvas,
           new THREE.UVMapping(),
           THREE.ClampToEdgeWrapping,
           THREE.ClampToEdgeWrapping,
           THREE.NearestFilter,
           THREE.NearestFilter,
           THREE.RGBFormat
         ),
         transparent: false,
         flipY: true
       });
       var material_trans = new THREE.MeshBasicMaterial({
         map: new THREE.Texture(
           skincanvas,
           new THREE.UVMapping(),
           THREE.ClampToEdgeWrapping,
           THREE.ClampToEdgeWrapping,
           THREE.NearestFilter,
           THREE.NearestFilter,
           THREE.RGBAFormat
         ),
         transparent: true
       });
       material.map.needsUpdate = true;
       material_trans.map.needsUpdate = true;
       done_cb(material, material_trans);
     };
     skin_img.src = img_path;
   };
   // Player model.. cache geometries..
   var actor_geom = {init: false};
   var init_geometry = function() {
     actor_geom.init = true;
     // left leg
     actor_geom.leftleggeo = new THREE.CubeGeometry(4, 12, 4);
     for(var i=0; i < 8; i+=1) {
       actor_geom.leftleggeo.vertices[i].y -= 6;
     }
     uvmap(actor_geom.leftleggeo, 0, 8, 12, -4, 12);   // front
     uvmap(actor_geom.leftleggeo, 1, 16, 12, -4, 12);  // back
     uvmap(actor_geom.leftleggeo, 2, 4, 16, 4, 4, 3);  // top
     uvmap(actor_geom.leftleggeo, 3, 8, 12, 4, -4, 1); // bottom
     uvmap(actor_geom.leftleggeo, 4, 12, 12, -4, 12);  //left
     uvmap(actor_geom.leftleggeo, 5, 4, 12, -4, 12);   //right
     // right leg
     actor_geom.rightleggeo = new THREE.CubeGeometry(4, 12, 4);
     for(var i=0; i < 8; i+=1) {
       actor_geom.rightleggeo.vertices[i].y -= 6;
     }
     uvmap(actor_geom.rightleggeo, 0, 4, 12, 4, 12);
     uvmap(actor_geom.rightleggeo, 1, 12, 12, 4, 12);
     uvmap(actor_geom.rightleggeo, 2, 8, 16, -4, 4, 3);
     uvmap(actor_geom.rightleggeo, 3, 12, 12, -4, -4, 1);
     uvmap(actor_geom.rightleggeo, 4, 0, 12, 4, 12);
     uvmap(actor_geom.rightleggeo, 5, 8, 12, 4, 12);
     // Body
     actor_geom.bodygeo = new THREE.CubeGeometry(4, 12, 8);
     uvmap(actor_geom.bodygeo, 0, 20, 12, 8, 12);   // front
     uvmap(actor_geom.bodygeo, 1, 32, 12, 8, 12);   // back
     uvmap(actor_geom.bodygeo, 2, 20, 16, 8, 4, 1); // top
     uvmap(actor_geom.bodygeo, 3, 28, 16, 8, 4, 3); // bottom
     uvmap(actor_geom.bodygeo, 4, 16, 12, 4, 12);   // left
     uvmap(actor_geom.bodygeo, 5, 28, 12, 4, 12);   // right
     // Left arm
     actor_geom.leftarmgeo = new THREE.CubeGeometry(4, 12, 4);
     for(var i=0; i < 8; i+=1) {
       actor_geom.leftarmgeo.vertices[i].y -= 4;
     }
     uvmap(actor_geom.leftarmgeo, 0, 48, 12, -4, 12);
     uvmap(actor_geom.leftarmgeo, 1, 56, 12, -4, 12);
     uvmap(actor_geom.leftarmgeo, 2, 48, 16, -4, 4, 1);
     uvmap(actor_geom.leftarmgeo, 3, 52, 16, -4, 4, 3);
     uvmap(actor_geom.leftarmgeo, 4, 52, 12, -4, 12);
     uvmap(actor_geom.leftarmgeo, 5, 44, 12, -4, 12);
     // Right arm
     actor_geom.rightarmgeo = new THREE.CubeGeometry(4, 12, 4);
     for(var i=0; i < 8; i+=1) {
       
       actor_geom.rightarmgeo.vertices[i].y -= 4;
     }
     uvmap(actor_geom.rightarmgeo, 0, 44, 12, 4, 12);
     uvmap(actor_geom.rightarmgeo, 1, 52, 12, 4, 12);
     uvmap(actor_geom.rightarmgeo, 2, 44, 16, 4, 4, 1);
     uvmap(actor_geom.rightarmgeo, 3, 48, 16, 4, 4, 3);
     uvmap(actor_geom.rightarmgeo, 4, 40, 12, 4, 12);
     uvmap(actor_geom.rightarmgeo, 5, 48, 12, 4, 12);
     // Head
     actor_geom.headgeo = new THREE.CubeGeometry(8, 8, 8);
     uvmap(actor_geom.headgeo, 0, 8, 24, 8, 8); // front
     uvmap(actor_geom.headgeo, 1, 24, 24, 8, 8); // back
     uvmap(actor_geom.headgeo, 2, 8, 32, 8, 8); // top
     uvmap(actor_geom.headgeo, 3, 16, 32, 8, 8); // bottom
     uvmap(actor_geom.headgeo, 4, 0, 24, 8, 8); // left
     uvmap(actor_geom.headgeo, 5, 16, 24, 8, 8); // right
     // ears
     actor_geom.eargeo = new THREE.CubeGeometry(1, (9/8)*6, (9/8)*6);
   };
   var local_new_actor = function(actorMaterial, actorMaterialTrans) {
     // initialize and cache geometries if we haven't,
     // already..
     if(actor_geom.init === false) {
       init_geometry();
     }
     var headgroup = new THREE.Object3D();
     var upperbody = new THREE.Object3D();
     
     // Left leg
     var leftleg = new THREE.Mesh(actor_geom.leftleggeo, actorMaterial);
     leftleg.position.z = -2;
     leftleg.position.y = -6;
     // Right leg
     var rightleg =new THREE.Mesh(actor_geom.rightleggeo, actorMaterial);
     rightleg.position.z = 2;
     rightleg.position.y = -6;
     // Body
     var bodymesh = new THREE.Mesh(actor_geom.bodygeo, actorMaterial);
     upperbody.add(bodymesh);
     // Left arm
     var leftarm = new THREE.Mesh(actor_geom.leftarmgeo, actorMaterial);
     leftarm.position.z = -6;
     leftarm.position.y = 4;
     leftarm.rotation.x = Math.PI/32;
     upperbody.add(leftarm);
     // Right arm
     var rightarm = new THREE.Mesh(actor_geom.rightarmgeo, actorMaterial);
     rightarm.position.z = 6;
     rightarm.position.y = 4;
     rightarm.rotation.x = -Math.PI/32;
     upperbody.add(rightarm);
     // Head
     var headmesh = new THREE.Mesh(actor_geom.headgeo, actorMaterial);
     headmesh.position.y = 2;
     headgroup.add(headmesh);
     /*
     // Helmet - @TODO fix.. this leaks the geometries..
     var helmet = cubeFromPlanes(9, actorMaterialTrans);
     helmet.position.y = 2;
     uvmap(helmet.children[0].geometry, 0, 32+8, 8, 8, 8);
     uvmap(helmet.children[1].geometry, 0, 32+24, 8, 8, 8);
     uvmap(helmet.children[2].geometry, 0, 32+8, 0, 8, 8, 1);
     uvmap(helmet.children[3].geometry, 0, 32+16, 0, 8, 8, 3);
     uvmap(helmet.children[4].geometry, 0, 32+0, 8, 8, 8);
     uvmap(helmet.children[5].geometry, 0, 32+16, 8, 8, 8);
     headgroup.add(helmet);
     */
     var ears = new THREE.Object3D();
     var leftear = new THREE.Mesh(actor_geom.eargeo, actorMaterial);
     var rightear = new THREE.Mesh(actor_geom.eargeo, actorMaterial);
     leftear.position.y = 2+(9/8)*5;
     rightear.position.y = 2+(9/8)*5;
     leftear.position.z = -(9/8)*5;
     rightear.position.z = (9/8)*5;
     
     uvmap(actor_geom.eargeo, 0, 25, 1, 6, 6); // Front side
     uvmap(actor_geom.eargeo, 1, 32, 1, 6, 6); // Back side
     
     uvmap(actor_geom.eargeo, 2, 25, 0, 6, 1, 1); // Top edge
     uvmap(actor_geom.eargeo, 3, 31, 0, 6, 1, 1); // Bottom edge
     
     uvmap(actor_geom.eargeo, 4, 24, 1, 1, 6); // Left edge
     uvmap(actor_geom.eargeo, 5, 31, 1, 1, 6); // Right edge
     
     ears.add(leftear);
     ears.add(rightear);
     
     leftear.visible = rightear.visible = false;
     
     headgroup.add(ears);
     headgroup.position.y = 8;
     // Putting it all together
     var playerModel = new THREE.Object3D();
     
     playerModel.add(leftleg);
     playerModel.add(rightleg);
     
     playerModel.add(upperbody);
     playerModel.add(headgroup);
     
     var playerGroup = new THREE.Object3D();
     
     playerGroup.add(playerModel);
     
     playerGroup.scale.setLength(4);
     playerModel.position.y = 24;
     return playerGroup;
   };
   
   //headmesh.add(camera);
   sugs.namespace.set(this, 'ss0.map_view.gfx.actor', function(actor) {
     actor.create_actor = local_new_actor;
     actor.create_actor_material = create_actor_material;
   });
 }).call(this);
