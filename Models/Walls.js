import * as THREE from 'three';

export function CreateWalls() {

    const walls = []

    const wallHeight = 10
    const wallLength = 30

    const texture = new THREE.TextureLoader().load('../textures/bricks-full.jpg')
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4,4)

    for (let i = 1; i <= 4; i++) {
        const geometry = new THREE.PlaneGeometry(wallLength, wallHeight);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4d4d4d,
            side: THREE.DoubleSide,
            map: texture
        });
        const wall = new THREE.Mesh(geometry, material);

        wall.receiveShadow = true
        wall.castShadow = true

        wall.position.y = wallHeight / 2

        wall.geometry.computeBoundingBox();

        // z1 = 25, z2 = 0, z3 = -25, z4 = 0


        switch (i) {
            case 1:
                wall.position.z = (wallLength / 2)
                wall.rotation.y = Math.PI
                break
            case 2:
                wall.position.z = 0
                wall.position.x = -(wallLength / 2)
                wall.rotation.y = Math.PI / 2
                break
            case 3:
                wall.position.z = -(wallLength / 2)
                wall.rotation.y = Math.PI
                break
            case 4:
                wall.position.z = 0
                wall.position.x = wallLength / 2
                wall.rotation.y = Math.PI / 2
                break
        }

        const wallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3())
        wallBB.setFromObject(wall)
        walls.push(wall)
    }



    return walls
} 