<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import router from "@/router/router";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import { computed, onMounted, ref, type Ref } from "vue";

let games: Ref<Game[]> = ref([]);
let selectedGame: Ref<Game> = ref({} as Game);

let showCreateGamePopup: Ref<boolean> = ref(false);
let title: Ref<string> = ref("");
let players: Ref<string[]> = ref([]);

async function createGame() {
  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then(async (data) => {
    console.log(data[0].data().ids);
    let ids: string[] = data[0].data().ids as string[];
    ids = ids == undefined ? [] : ids;
    let gameID = ids == undefined ? 0 : ids.length;

    let doc_id: string = "";
    let createGameData: Game = {
      id: gameID,
      title: title.value,
      players: players.value,
      rounds: [],
    };
    console.log(createGameData);

    doc_id = await FirestoreDB.createDocument("partien", createGameData);
    console.log(doc_id);

    ids.push(doc_id);
    await FirestoreDB.updateDocument("documents", "document_ids", { ids });

    title.value = "";
    players.value = [];

    showCreateGamePopup.value = false;
    getGames();
  });
}

async function getGames() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    games.value = [];

    for (let i = 0; i < value.length; i++) {
      games.value.push(value[i].data() as Game);
    }

    games.value.sort((a, b) => a.id - b.id);
  });
}

function selectionChange() {
  router.push("/game/" + selectedGame.value.id);
}

onMounted(() => {
  getGames();
});
</script>

<template>
  <div id="main" class="h-full flex flex-col overflow-hidden">
    <div
      class="flex flex-row justify-end mb-4 pb-2 border-b-[1px] border-[#bb9d3a]"
    >
      <Button
        raised
        label="neue Partie erstellen"
        icon="pi pi-plus"
        @click="showCreateGamePopup = true"
      ></Button>
    </div>

    <Listbox
      v-model="selectedGame"
      :options="games"
      option-label="title"
      class="overflow-y-hidden py-1"
      :scroll-height="'100%'"
      :striped="true"
      @change="selectionChange"
    />

    <Dialog
      v-model:visible="showCreateGamePopup"
      modal
      header="Partie erstellen"
      :style="{ width: '80vw' }"
    >
      <div class="flex items-center gap-4 mb-4">
        <label for="title" class="font-semibold">Titel</label>
        <InputText
          id="title"
          v-model="title"
          fluid
          class="flex-auto"
          autocomplete="off"
        />
      </div>
      <div
        v-for="i in players.length + 1"
        :key="i - 1"
        class="flex items-center gap-4 mb-8"
      >
        <label
          :for="(players.length + 1).toString()"
          class="font-semibold w-1/2"
        >
          Spieler {{ i }}
        </label>
        <InputText
          :id="(players.length + 1).toString()"
          v-model="players[i - 1]"
          fluid
          class="flex-auto"
          autocomplete="off"
        />
      </div>
      <div class="flex justify-between gap-2">
        <Button
          type="button"
          label="Abbrechen"
          severity="secondary"
          @click="showCreateGamePopup = false"
        ></Button>
        <Button type="button" label="Erstellen" @click="createGame"></Button>
      </div>
    </Dialog>
  </div>
</template>
