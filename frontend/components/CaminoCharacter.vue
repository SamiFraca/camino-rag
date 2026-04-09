<template>
  <TresCanvas window-size :alpha="true">
    <TresPerspectiveCamera :position="[0, 1.2, 3]" :look-at="[0, 0.8, 0]" />
    <TresAmbientLight :intensity="1.5" />
    <TresDirectionalLight :position="[2, 4, 2]" :intensity="2" />

    <primitive
      v-if="gltf"
      :object="(gltf as any)?.scene"
      :scale="1"
      :position="[0, -1, 0]"
    />

    <TresMesh :position="[0, -1.02, 0]" :rotation="[-Math.PI / 2, 0, 0]">
      <TresCircleGeometry :args="[0.8, 32]" />
      <TresMeshStandardMaterial color="#f59e0b" :transparent="true" :opacity="0.15" />
    </TresMesh>

    <CaminoAnimator :mixer="mixer" :idle-action="idleAction" :talk-action="talkAction" :is-talking="isTalking" />
  </TresCanvas>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { ref, watch } from 'vue'
import { useLoader } from '@tresjs/core'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

const props = defineProps<{ isTalking: boolean }>()

const mixer = ref<THREE.AnimationMixer | null>(null)
const idleAction = ref<THREE.AnimationAction | null>(null)
const talkAction = ref<THREE.AnimationAction | null>(null)

const { state: gltf } = useLoader(GLTFLoader, '/avatar.glb')

watch(gltf, (loaded) => {
  if (!loaded) return
  const gltfData = loaded as unknown as GLTF
  mixer.value = new THREE.AnimationMixer(gltfData.scene)
  const anims = gltfData.animations
  const idle = anims.find(a => a.name.toLowerCase().includes('idle')) ?? anims[0]
  const talk = anims.find(a => a.name.toLowerCase().includes('talk') || a.name.toLowerCase().includes('wave')) ?? anims[1]
  if (idle) {
    idleAction.value = mixer.value.clipAction(idle)
    idleAction.value.play()
  }
  if (talk) {
    talkAction.value = mixer.value.clipAction(talk)
  }
}, { immediate: true })

</script>
