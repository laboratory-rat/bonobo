<template>
  <div>
    Startup
    <router-view />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
@Component
export default class StartupView extends Vue {}
</script>
