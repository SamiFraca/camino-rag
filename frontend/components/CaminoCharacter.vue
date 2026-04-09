<template>
  <TresCanvas window-size :alpha="true">
    <TresPerspectiveCamera :position="[0, 1.2, 3]" :look-at="[0, 0.8, 0]" />
    <TresAmbientLight :intensity="1.5" />
    <TresDirectionalLight :position="[2, 4, 2]" :intensity="2" />

    <Suspense>
      <GLTFModel
        v-if="modelUrl"
        :path="modelUrl"
        :scale="1"
        :position="[0, -1, 0]"
        @loaded="onModelLoaded"
      />
    </Suspense>

    <TresMesh :position="[0, -1.02, 0]" :rotation="[-Math.PI / 2, 0, 0]">
      <TresCircleGeometry :args="[0.8, 32]" />
      <TresMeshStandardMaterial color="#f59e0b" :transparent="true" :opacity="0.15" />
    </TresMesh>
  </TresCanvas>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { watch } from 'vue';
import { useRenderLoop } from '@tresjs/core';

const props = defineProps<{ isTalking: boolean }>()

const modelUrl = '/avatar.glb'

let mixer: THREE.AnimationMixer | null = null
let idleAction: THREE.AnimationAction | null = null
let talkAction: THREE.AnimationAction | null = null

function onModelLoaded({ model, animations }: { model: THREE.Group, animations: THREE.AnimationClip[] }) {
  mixer = new THREE.AnimationMixer(model)

  const idle = animations.find(a => a.name.toLowerCase().includes('idle')) ?? animations[0]
  const talk = animations.find(a => a.name.toLowerCase().includes('talk') || a.name.toLowerCase().includes('wave')) ?? animations[1]

  if (idle) {
    idleAction = mixer.clipAction(idle)
    idleAction.play()
  }
  if (talk) {
    talkAction = mixer.clipAction(talk)
  }
}

const clock = new THREE.Clock()

useRenderLoop().onLoop(() => {
  mixer?.update(clock.getDelta())
})

watch(() => props.isTalking, (talking) => {
  if (!mixer || !idleAction || !talkAction) return
  if (talking) {
    idleAction.fadeOut(0.3)
    talkAction.reset().fadeIn(0.3).play()
  } else {
    talkAction.fadeOut(0.3)
    idleAction.reset().fadeIn(0.3).play()
  }
})
</script>
