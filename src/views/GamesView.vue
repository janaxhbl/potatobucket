<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { GameType } from "@/interfaces/GameType";
import type { Round } from "@/interfaces/Round";
import router from "@/router/router";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Select from "primevue/select";
import { onMounted, ref, type Ref } from "vue";

let gameTypes: Ref<GameType[]> = ref([]);
let games: Ref<Game[]> = ref([]);
let selectedGame: Ref<Game> = ref({} as Game);

let showCreateGamePopup: Ref<boolean> = ref(false);
let title: Ref<string> = ref("");
let selectedGameType: Ref<GameType> = ref({} as GameType);
let players: Ref<string[]> = ref([]);

let gameToDelete: Ref<Game> = ref({} as Game);
let showDeleteGamePopup: Ref<boolean> = ref(false);

function createTitle(): string {
  let _title: string = "";
  _title = selectedGameType.value.name;
  if (players.value.length > 0) {
    for (let i = 0; i < players.value.length; i++) {
      let playerShort = players.value[i].slice(0, 1).toUpperCase();
      _title = _title + " " + playerShort;
    }
  }
  return _title;
}

function createDefaultRound(): Round[] {
  let _rounds: Round[] = [];
  let _round: Round = { num: 1, points: [] };
  let _points: number[] = [];

  for (let i = 0; i < players.value.length; i++) {
    _points.push(selectedGameType.value.startValue as number);
  }

  _round.points = _points;
  _rounds.push(_round);

  return _rounds;
}

async function createGame() {
  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then(async (data) => {
    let ids: { game_id: number; doc_id: string }[] = data[0].data().ids;
    ids = ids == undefined ? [] : ids;
    let gameID = ids.length == 0 ? 0 : games.value[ids.length - 1].id + 1;

    let createGameData: Game = {
      id: gameID,
      // title: title.value,
      title: createTitle(),
      gameTypeId: selectedGameType.value.id as number,
      players: players.value,
      rounds: createDefaultRound(),
    };

    let doc_id: string = "";
    doc_id = await FirestoreDB.createDocument("partien", createGameData);

    ids.push({ game_id: gameID, doc_id: doc_id });
    await FirestoreDB.updateDocument("documents", "document_ids", { ids: ids });

    title.value = "";
    players.value = [];
    selectedGameType.value = {} as GameType;

    showCreateGamePopup.value = false;
    getGames();
  });
}

function openDeletePopup(
  event: { stopPropagation: () => void },
  game_id: number
) {
  event.stopPropagation();
  for (let i = 0; i < games.value.length; i++) {
    if (games.value[i].id == game_id) {
      gameToDelete.value = games.value[i];
    }
  }
  showDeleteGamePopup.value = true;
}

async function deleteGame() {
  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then(async (data) => {
    let ids: { game_id: number; doc_id: string }[] = data[0].data().ids;
    ids = ids == undefined ? [] : ids;
    let currDocID: string = "";
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].game_id == gameToDelete.value.id) {
        currDocID = ids[i].doc_id;
      }
    }

    let index_to_splice = ids.findIndex((obj) => obj.doc_id == currDocID);
    ids.splice(index_to_splice, 1);

    await FirestoreDB.updateDocument("documents", "document_ids", { ids: ids });
    await FirestoreDB.deleteDocument("partien", currDocID);

    showDeleteGamePopup.value = false;
    gameToDelete.value = {} as Game;
    getGames();
  });
}

function getGames() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    games.value = [];

    for (let i = 0; i < value.length; i++) {
      games.value.push(value[i].data() as Game);
    }

    games.value.sort((a, b) => a.id - b.id);
  });
}

function getGameTypes() {
  let data = FirestoreDB.getAllInCollection("game_types");
  data.then((value) => {
    gameTypes.value = value[0].data().game_types as GameType[];
  });
}

function selectionChange() {
  router.push("/game/" + selectedGame.value.id);
}

onMounted(() => {
  getGameTypes();
  getGames();
});
</script>

<template>
  <div id="main" class="h-full flex flex-col overflow-hidden">
    <div
      id="header"
      class="flex flex-row justify-between items-end mb-4 pb-2 border-b-[1px] border-[#bb9d3a]"
    >
      <h1 class="text-xl">Partien</h1>

      <Button
        raised
        size="small"
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
      empty-message="keine Partien vorhanden"
      @change="selectionChange"
    >
      <template #option="slotProps">
        <div class="flex flex-row justify-between items-center w-full">
          <div>{{ slotProps.option.title }}</div>
          <i
            class="pi pi-trash text-sm text-red-800"
            @click="openDeletePopup($event, slotProps.option.id)"
          ></i>
        </div>
      </template>
    </Listbox>

    <Dialog
      v-model:visible="showCreateGamePopup"
      modal
      header="Partie erstellen"
      :style="{ width: '80vw' }"
    >
      <div class="flex items-center gap-4 mb-4">
        <!-- <label for="title" class="font-semibold">Titel</label>
        <InputText
          id="title"
          v-model="title"
          fluid
          class="flex-auto"
          autocomplete="off"
        /> -->
        <Select
          v-model="selectedGameType"
          :options="gameTypes"
          option-label="name"
          placeholder="Spielart"
          class="w-full"
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
        <Button
          raised
          type="button"
          label="Erstellen"
          @click="createGame"
        ></Button>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showDeleteGamePopup"
      modal
      :closable="false"
      :header="
        'Soll Partie ' + gameToDelete.title + ' wirklich gelöscht werden?'
      "
      :style="{ width: '80vw' }"
    >
      <div class="flex justify-between gap-2">
        <Button
          type="button"
          label="Abbrechen"
          severity="secondary"
          @click="showDeleteGamePopup = false"
        ></Button>
        <Button
          raised
          severity="danger"
          type="button"
          label="Löschen"
          @click="deleteGame"
        ></Button>
      </div>
    </Dialog>
  </div>
</template>
