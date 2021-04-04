<template>
  <div>
    <q-list>
      <q-item-label header>Navigation</q-item-label>
      <q-item clickable :to="{name: 'startup'}">
        <q-item-section avatar>
          <q-icon name="school" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Startup</q-item-label>
          <!-- <q-item-label caption>quasar.dev</q-item-label> -->
        </q-item-section>
      </q-item>
      <q-item clickable :to="{name: 'dataset'}">
        <q-item-section avatar>
          <q-icon name="school" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Datasets</q-item-label>
          <!-- <q-item-label caption>quasar.dev</q-item-label> -->
        </q-item-section>
      </q-item>
      <q-item clickable :to="{name: 'model'}">
        <q-item-section avatar>
          <q-icon name="school" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Models</q-item-label>
          <!-- <q-item-label caption>quasar.dev</q-item-label> -->
        </q-item-section>
      </q-item>
      <q-item clickable tag="a" target="_blank" href="https://github.com/quasarframework/">
        <q-item-section avatar>
          <q-icon name="code" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Github</q-item-label>
          <q-item-label caption>github.com/quasarframework</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable tag="a" target="_blank" href="https://chat.quasar.dev">
        <q-item-section avatar>
          <q-icon name="chat" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Discord Chat Channel</q-item-label>
          <q-item-label caption>chat.quasar.dev</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable tag="a" target="_blank" href="https://forum.quasar.dev">
        <q-item-section avatar>
          <q-icon name="forum" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Forum</q-item-label>
          <q-item-label caption>forum.quasar.dev</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable tag="a" target="_blank" href="https://twitter.com/quasarframework">
        <q-item-section avatar>
          <q-icon name="rss_feed" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Twitter</q-item-label>
          <q-item-label caption>@quasarframework</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class AppDrawerComponent extends Vue {}
</script>