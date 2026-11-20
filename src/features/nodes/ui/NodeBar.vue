<script setup lang="ts">
import { doc } from "../../../shared/document";
import {
  deleteState,
  requestDelete,
  confirmDelete,
  cancelDelete,
} from "../model/delete";
import { canBreak, breakAtSelection } from "../model/break";
import { canJoin, joinSelected } from "../model/join";
</script>
<template>
  <div class="nodebar" v-if="doc.tool === 'nodes'">
    <template v-if="!deleteState.active">
      <span class="hint">Click a segment to insert a node</span>
      <button
        data-testid="break-node"
        :disabled="!canBreak()"
        @click="breakAtSelection"
      >
        ✂ Break
      </button>
      <button
        data-testid="delete-node"
        :disabled="!doc.nodeSel.length"
        @click="requestDelete"
      >
        ⌫ Delete
      </button>
      <button data-testid="join-node" :disabled="!canJoin()" @click="joinSelected">
        ⋈ Join
      </button>
      <span class="hint" v-if="canJoin()"
        >Join keeps the topmost path's style &amp; layer</span
      >
    </template>
    <template v-else>
      <b
        >Delete
        {{ deleteState.targets.reduce((n, t) => n + t.indices.length, 0) }}
        node(s)</b
      >
      <label
        ><input type="radio" value="curve" v-model="deleteState.mode" /> Fit
        original curve</label
      >
      <label
        ><input type="radio" value="tangent" v-model="deleteState.mode" /> Keep
        neighbor tangents</label
      >
      <span class="hint">Dashed: current outline · Pink: result</span>
      <span class="error" v-if="deleteState.error">{{ deleteState.error }}</span>
      <button
        class="primary"
        data-testid="confirm-delete"
        :disabled="!deleteState.targets.length"
        @click="confirmDelete"
      >
        Apply
      </button>
      <button data-testid="cancel-delete" @click="cancelDelete">Cancel</button>
    </template>
  </div>
</template>
