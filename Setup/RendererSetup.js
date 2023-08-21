import * as THREE from 'three';

export function RendererSetup() {
    const appContainer = document.getElementById("app")
    const renderer = new THREE.WebGLRenderer(
        { appContainer }
    )

    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.BasicShadowMap
    renderer.outputEncoding = THREE.sRGBEncoding

    renderer.setSize(appContainer.innerWidth, appContainer.innerHeight)
    appContainer.appendChild(renderer.domElement)

    return renderer
}