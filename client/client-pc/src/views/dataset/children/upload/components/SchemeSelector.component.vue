<template>
  <div v-if="!!metadataList">
    <q-chip
      v-for="m in metadataList"
      :key="m.id"
      clickable
      :outline="isSelected(m.id)"
      @click="emitSelectedUpdate(m.id)"
      v-text="m.name"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Emit, Prop } from 'vue-property-decorator';
import { AppDatasetMetadata } from '@/infrastructure/dataset';
import Component from 'vue-class-component';

@Component
export default class SchemeSelectorComponent extends Vue {
  @Prop({ required: true, default: () => [] })
  metadataList!: AppDatasetMetadata[];

  @Prop({ required: true })
  selectedMetadataList!: string[];

  get isVisible(): boolean {
    return !!this.metadataList;
  }

  @Emit('selected:update')
  emitSelectedUpdate(id: string) {
    return id;
  }

  isSelected(id: string): boolean {
    return this.selectedMetadataList.indexOf(id) !== -1;
  }
}
</script>

<style scoped></style>
