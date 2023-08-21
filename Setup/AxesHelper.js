import * as THREE from 'three'

export function AddAxesHelper() {
    const size = 3
    const axesHelper = new THREE.AxesHelper(size)

    const xAxisColor = 0xff0000 //červená
    const yAxisColor = 0x0013ff //modrá
    const zAxisColor = 0x17ff00 //zelená
    axesHelper.setColors(xAxisColor, yAxisColor, zAxisColor)

    return axesHelper
}