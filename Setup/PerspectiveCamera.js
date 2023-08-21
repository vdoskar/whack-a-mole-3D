import * as THREE from 'three';

export function PerspectiveCamera() {
    const camera = new THREE.PerspectiveCamera(
        70, // Pozorovací úhel pohledu
        window.innerWidth / window.innerHeight, // rozměry kamery
        0.1, //nejbližší bod
        1000 //nejvzdálenější bod
      )
    return camera
}