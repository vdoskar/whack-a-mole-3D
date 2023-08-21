import * as THREE from 'three'

export function AmbientLight() {
    const light = new THREE.AmbientLight()
    return light
}

export function MainPointLight() {
    const light = new THREE.PointLight()
    light.castShadow = true
    light.position.y = 10
    light.position.z = 0
    light.position.x = 0
    light.intensity = 0.5
    light.shadow.camera.near = 25
    light.shadow.camera.far = 50
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.bias = -0.003;
    return light
}

export function DirLight() {
    const light = new THREE.DirectionalLight()
    light.position.set(8, 8, 8)
    light.intensity = 0.5
    light.castShadow = true
    light.scale.x = 5;
    light.scale.y = 5;
    light.scale.z = 5;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0
    light.shadow.bias = 0.003;
    return light
}