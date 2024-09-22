<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import router from "@/router/router";
import { useStore } from "@/stores/counter";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import { computed, onMounted, ref, type Ref } from "vue";

let doc_id: string = "ttkRmtrt2Z5Lfw1rQYIF";
let data = ref({ test: "hello, world!" });

let games: Ref<Game[]> = ref([]);
let selectedGame: Ref<Game> = ref({} as Game);

async function createGame() {
  doc_id = await FirestoreDB.createDocument("partien", data.value);
  console.log(doc_id);
  useStore().games_ids.push(doc_id);
}

async function getvalues() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    games.value = [];

    for (let i = 0; i < value.length; i++) {
      games.value.push(value[i].data() as Game);
    }
  });
}

async function upddoc() {
  console.log(data.value);
  FirestoreDB.updateDocument("partien", doc_id, data.value);
}

function selectionChange() {
  const idx = computed(() => {
    return games.value.findIndex((obj: Game) => obj === selectedGame.value);
  });
  router.push("/game/" + idx.value);
}

onMounted(() => {
  getvalues();
});
</script>

<template>
  <div id="main">
    <div
      class="flex flex-row justify-end mb-4 pb-2 border-b-[1px] border-[#bb9d3a]"
    >
      <Button
        raised
        disabled
        label="neue Partie erstellen"
        icon="pi pi-plus"
        :click="createGame"
      ></Button>
    </div>

    <Listbox
      v-model="selectedGame"
      :options="games"
      option-label="title"
      @change="selectionChange"
    />
    <!-- 
    <Button raised label="pudatevalue" @click="upddoc"></Button>
    <br /><br />
    <FloatLabel>
      <InputText id="data" v-model="data.test" />
      <label for="data">data</label>
    </FloatLabel>
    <br /><br />
    {{ data }} -->
  </div>
</template>
