import * as THREE from 'three';

export function CreateFloor() {

    const geometry = new THREE.PlaneGeometry( 50, 50 );

    const texture = new THREE.TextureLoader().load('../textures/stone-full.jpg')
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(5,5)
    
    const material = new THREE.MeshPhongMaterial( {
        color: 0x8d8d8d, 
        side: THREE.DoubleSide, // znamená, že se budou vykreslovat obě strany
        map: texture
    } );
    const plane = new THREE.Mesh( geometry, material );

    plane.receiveShadow = true

    plane.position.y = 0
    plane.rotation.x = Math.PI / 2

    return plane
} 