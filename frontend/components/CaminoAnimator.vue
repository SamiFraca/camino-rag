<script setup lang="ts">
import * as THREE from 'three'
import { watch } from 'vue'
import { useLoop } from '@tresjs/core'

const props = defineProps<{
  mixer: THREE.AnimationMixer | null
  idleAction: THREE.AnimationAction | null
  talkAction: THREE.AnimationAction | null
  isTalking: boolean
}>()

const clock = new THREE.Clock()

useLoop().onBeforeRender(() => {
  props.mixer?.update(clock.getDelta())
})

watch(() => props.isTalking, (talking) => {
  if (!props.mixer || !props.idleAction || !props.talkAction) return
  if (talking) {
    props.idleAction.fadeOut(0.3)
    props.talkAction.reset().fadeIn(0.3).play()
  } else {
    props.talkAction.fadeOut(0.3)
    props.idleAction.reset().fadeIn(0.3).play()
  }
})
</script>

<template><slot /></template>
