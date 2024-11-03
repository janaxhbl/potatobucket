<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { GameType } from "@/interfaces/GameType";
import router from "@/router/router";
import Accordion from "primevue/accordion";
import AccordionContent from "primevue/accordioncontent";
import AccordionHeader from "primevue/accordionheader";
import AccordionPanel from "primevue/accordionpanel";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import SelectButton from "primevue/selectbutton";
import { onMounted, ref, type Ref } from "vue";

let gameTypes: Ref<GameType[]> = ref([]);

let newGameTypeListOption = ref([{ name: "neue Spielart hinzufügen" }]);
let showCreateGameTypePopup: Ref<boolean> = ref(false);
let newGameType: Ref<GameType> = ref({} as GameType);
let endValueReachedWinLoseOptions = ref(["gewonnen", "verloren"]);
let endValueReachedBummerlOptions = ref(["Gewinner", "Verlierer"]);
let newGameTypeEndValueReachedBummerlDummy: Ref<string> = ref("");

let showEditGameTypePopup: Ref<boolean> = ref(false);
let selectedGameType: Ref<GameType> = ref({} as GameType);
let selectedGameTypeEndValueReachedBummerlDummy: Ref<string> = ref("");

let showDeleteGameTypePopup: Ref<boolean> = ref(false);
let gameTypeToDelete: Ref<GameType> = ref({} as GameType);

let finishedGames: Ref<Game[]> = ref([]);
let selectedFinishedGame: Ref<Game> = ref({} as Game);

let showDeleteGamePopup: Ref<boolean> = ref(false);
let gameToDelete: Ref<Game> = ref({} as Game);

async function createNewGameType() {
  if (
    newGameType.value.name == null ||
    newGameType.value.startValue == null ||
    newGameType.value.endValue == null ||
    newGameType.value.endValueReachedWinLose == null ||
    newGameTypeEndValueReachedBummerlDummy.value == null
  ) {
    return;
  }

  // games_counter auch für gametype ids verwenden
  let game_counter = await FirestoreDB.getAllInCollection("games_counter");
  let gameID: number = game_counter[0].data().games_counter;

  newGameType.value.id = gameID;

  await FirestoreDB.updateDocument("games_counter", "games_counter", {
    games_counter: ++gameID,
  });

  if (newGameType.value.startValue < newGameType.value.endValue) {
    newGameType.value.countType = "plus";
  } else if (newGameType.value.startValue > newGameType.value.endValue) {
    newGameType.value.countType = "minus";
  } else {
    alert("denk nochmal drüber nach! *facepalm*");
    return;
  }

  // bummerlsettings übersetzen
  if (newGameType.value.endValueReachedWinLose == "gewonnen") {
    if (newGameTypeEndValueReachedBummerlDummy.value == "Verlierer") {
      newGameType.value.endValueReachedBummerl = false;
      newGameType.value.bummerlGood = false;
    } else if (newGameTypeEndValueReachedBummerlDummy.value == "Gewinner") {
      newGameType.value.endValueReachedBummerl = true;
      newGameType.value.bummerlGood = true;
    }
  } else if (newGameType.value.endValueReachedWinLose == "verloren") {
    if (newGameTypeEndValueReachedBummerlDummy.value == "Verlierer") {
      newGameType.value.endValueReachedBummerl = true;
      newGameType.value.bummerlGood = false;
    } else if (newGameTypeEndValueReachedBummerlDummy.value == "Gewinner") {
      newGameType.value.endValueReachedBummerl = false;
      newGameType.value.bummerlGood = true;
    }
  }

  gameTypes.value.push(newGameType.value);

  await FirestoreDB.updateDocument("game_types", "game_types", {
    game_types: gameTypes.value,
  });

  newGameType.value = {
    id: null,
    name: "",
    startValue: null,
    endValue: null,
    countType: "",
    endValueReachedWinLose: "gewonnen",
    endValueReachedBummerl: false,
    bummerlGood: false,
  };
  showCreateGameTypePopup.value = false;
  getGameTypes();
}

async function editGameType() {
  let index_to_splice = gameTypes.value.findIndex(
    (obj) => obj.id == selectedGameType.value.id
  );
  gameTypes.value.splice(index_to_splice, 1, selectedGameType.value);

  await FirestoreDB.updateDocument("game_types", "game_types", {
    game_types: gameTypes.value,
  });

  showEditGameTypePopup.value = false;
  selectedGameType.value = {} as GameType;
}

function viewGame() {
  router.push("/game/" + selectedFinishedGame.value.id);
}

async function unfinishGame(
  event: { stopPropagation: () => void },
  game_id: number
) {
  event.stopPropagation();

  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then((data) => {
    let ids: { game_id: number; doc_id: string }[] = data[0].data().ids;
    ids = ids == undefined ? [] : ids;
    let currDocID: string = "";
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].game_id == game_id) {
        currDocID = ids[i].doc_id;
      }
    }

    let games = FirestoreDB.getAllInCollection("partien");
    games.then(async (data2) => {
      let game: Game = {} as Game;
      let games: Game[] = [];
      for (let i = 0; i < data2.length; i++) {
        games.push(data2[i].data() as Game);
      }
      games.sort((a, b) => a.id - b.id);
      for (let i = 0; i < games.length; i++) {
        if (games[i].id == game_id) {
          game = games[i];
        }
      }
      game.finished = false;

      await FirestoreDB.updateDocument("partien", currDocID, game);

      getGames();
    });
  });
}

function openGameDeletePopup(
  event: { stopPropagation: () => void },
  game_id: number
) {
  event.stopPropagation();
  for (let i = 0; i < finishedGames.value.length; i++) {
    if (finishedGames.value[i].id == game_id) {
      gameToDelete.value = finishedGames.value[i];
    }
  }
  showDeleteGamePopup.value = true;
}

function openGameTypeDeletePopup(
  event: { stopPropagation: () => void },
  gameType_id: number
) {
  event.stopPropagation();
  for (let i = 0; i < gameTypes.value.length; i++) {
    if (gameTypes.value[i].id == gameType_id) {
      gameTypeToDelete.value = gameTypes.value[i];
    }
  }
  showDeleteGameTypePopup.value = true;
}

function openGameTypeEditPopup() {
  // bummerlsettings übersetzen
  if (selectedGameType.value.endValueReachedWinLose == "gewonnen") {
    if (selectedGameType.value.endValueReachedBummerl == false) {
      selectedGameTypeEndValueReachedBummerlDummy.value = "Verlierer";
    } else if (selectedGameType.value.endValueReachedBummerl == true) {
      selectedGameTypeEndValueReachedBummerlDummy.value = "Gewinner";
    }
  } else if (selectedGameType.value.endValueReachedWinLose == "verloren") {
    if (selectedGameType.value.endValueReachedBummerl == false) {
      selectedGameTypeEndValueReachedBummerlDummy.value == "Gewinner";
    } else if (selectedGameType.value.endValueReachedBummerl == true) {
      selectedGameTypeEndValueReachedBummerlDummy.value == "Verlierer";
    }
  }

  showEditGameTypePopup.value = true;
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

async function deleteGameType() {
  let gameType_index_to_splice = gameTypes.value.findIndex(
    (obj) => obj.id == gameTypeToDelete.value.id
  );
  gameTypes.value.splice(gameType_index_to_splice, 1);
  await FirestoreDB.updateDocument("game_types", "game_types", {
    game_types: gameTypes.value,
  });

  let games = FirestoreDB.getAllInCollection("partien");
  games.then((data) => {
    let allGames: Game[] = [];

    for (let i = 0; i < data.length; i++) {
      allGames.push(data[i].data() as Game);
    }

    allGames.sort((a, b) => a.id - b.id);

    let documents = FirestoreDB.getAllInCollection("documents");
    documents.then(async (data2) => {
      let ids: { game_id: number; doc_id: string }[] = data2[0].data().ids;
      ids = ids == undefined ? [] : ids;

      for (let i = 0; i < allGames.length; i++) {
        if (allGames[i].gameTypeId == gameTypeToDelete.value.id) {
          let ids_index_to_splice = ids.findIndex(
            (obj) => obj.game_id == allGames[i].id
          );
          let doc_id: string = ids[ids_index_to_splice].doc_id;
          ids.splice(ids_index_to_splice, 1);
          await FirestoreDB.deleteDocument("partien", doc_id);
        }
      }
      await FirestoreDB.updateDocument("documents", "document_ids", {
        ids: ids,
      });
      showDeleteGameTypePopup.value = false;
      gameTypeToDelete.value = {} as GameType;
      getGameTypes();
      getGames();
    });
  });
}

async function getGameTypes() {
  let data = FirestoreDB.getAllInCollection("game_types");
  data.then((value) => {
    gameTypes.value = [];
    gameTypes.value = value[0].data().game_types as GameType[];

    // gameTypes.value.sort((a, b) => a.name.localeCompare(b.name));
  });
}

function getGames() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    finishedGames.value = [];

    for (let i = 0; i < value.length; i++) {
      if (value[i].data().finished == true)
        finishedGames.value.push(value[i].data() as Game);
    }

    finishedGames.value.sort((a, b) => a.id - b.id);
  });
}

onMounted(() => {
  getGameTypes();
  getGames();
});
</script>

<template>
  <div id="main" class="h-full flex flex-col">
    <div id="header">
      <h1 class="text-xl mb-4 border-b-[1px] border-[#bb9d3a]">Home</h1>
    </div>
    <div id="content">
      <Accordion>
        <AccordionPanel value="0">
          <AccordionHeader>Spielarten</AccordionHeader>
          <AccordionContent>
            <div class="pt-4">
              <Listbox
                :options="newGameTypeListOption"
                option-label="name"
                class="overflow-y-hidden py-1"
                :scroll-height="'100%'"
                :striped="true"
                @change="showCreateGameTypePopup = true"
              />
              <Listbox
                v-model="selectedGameType"
                :options="gameTypes"
                option-label="name"
                class="overflow-y-hidden py-1"
                :scroll-height="'100%'"
                :striped="true"
                empty-message="keine Spielarten vorhanden"
                @change="openGameTypeEditPopup"
              >
                <template #option="slotProps">
                  <div
                    class="flex flex-row justify-between items-center w-full"
                  >
                    <div>
                      {{ slotProps.option.name }}
                    </div>
                    <div>
                      <i
                        class="pi pi-trash text-sm text-red-800 ml-2"
                        @click="
                          openGameTypeDeletePopup($event, slotProps.option.id)
                        "
                      ></i>
                    </div>
                  </div>
                </template>
              </Listbox>
            </div>
          </AccordionContent>
        </AccordionPanel>
        <AccordionPanel value="1">
          <AccordionHeader>Abgeschlossene Partien</AccordionHeader>
          <AccordionContent>
            <div class="pt-4">
              <Listbox
                v-model="selectedFinishedGame"
                :options="finishedGames"
                option-label="title"
                class="overflow-y-hidden py-1"
                :scroll-height="'100%'"
                :striped="true"
                empty-message="keine abgeschlossenen Partien vorhanden"
                @change="viewGame"
              >
                <template #option="slotProps">
                  <div
                    class="flex flex-row justify-between items-center w-full"
                  >
                    <div>
                      {{ slotProps.option.title }}
                    </div>
                    <div>
                      <i
                        class="pi pi-refresh text-sm text-blue-700"
                        style="
                          -webkit-transform: scaleX(-1);
                          transform: scaleX(-1);
                        "
                        @click="unfinishGame($event, slotProps.option.id)"
                      ></i>
                      <i
                        class="pi pi-trash text-sm text-red-800 ml-2"
                        @click="
                          openGameDeletePopup($event, slotProps.option.id)
                        "
                      ></i>
                    </div>
                  </div>
                </template>
              </Listbox>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>

    <Dialog
      v-model:visible="showCreateGameTypePopup"
      modal
      header="neue Spielart"
      :style="{ width: '80vw' }"
    >
      <div class="flex flex-col">
        <div class="flex flex-row mb-4">
          <div id="links" class="flex flex-col justify-between py-2 w-1/3">
            <label for="name" class="font-semibold">Name</label>
            <label for="startValue" class="font-semibold">Startwert</label>
            <label for="endValue" class="font-semibold">Endwert</label>
          </div>
          <div id="rechts" class="flex flex-col w-2/3 gap-4">
            <InputText
              id="name"
              v-model="newGameType.name"
              fluid
              class="w-2/3"
              autocomplete="off"
            />
            <InputNumber
              id="startValue"
              v-model="newGameType.startValue"
              fluid
              input-class="w-2/3"
              autocomplete="off"
            />
            <InputNumber
              id="endValue"
              v-model="newGameType.endValue"
              fluid
              input-class="w-2/3"
              autocomplete="off"
            />
          </div>
        </div>
        <div id="bummerlSettings" class="flex flex-col gap-2 mb-4">
          <label for="endValueReachedWinLose" class="font-semibold"
            >Endwert erreicht:</label
          >
          <SelectButton
            id="endValueReachedWinLose"
            v-model="newGameType.endValueReachedWinLose"
            :options="endValueReachedWinLoseOptions"
            :allow-empty="false"
          />
          <label for="endValueReachedBummerl" class="font-semibold"
            >Bummerl bekommt:</label
          >
          <SelectButton
            id="endValueReachedBummerl"
            v-model="newGameTypeEndValueReachedBummerlDummy"
            :options="endValueReachedBummerlOptions"
            :allow-empty="false"
          />
        </div>
        <div id="createButtons" class="flex justify-between gap-2">
          <Button
            type="button"
            label="Abbrechen"
            severity="secondary"
            @click="showCreateGameTypePopup = false"
          ></Button>
          <Button
            raised
            type="button"
            label="Erstellen"
            @click="createNewGameType"
          ></Button>
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showEditGameTypePopup"
      modal
      header="Spielart Details"
      :style="{ width: '80vw' }"
    >
      <div class="flex flex-col">
        <div class="flex flex-row mb-4">
          <div id="editLinks" class="flex flex-col justify-between py-2 w-1/3">
            <label for="name" class="font-semibold">Name</label>
            <label for="startValue" class="font-semibold">Startwert</label>
            <label for="endValue" class="font-semibold">Endwert</label>
          </div>
          <div id="editRechts" class="flex flex-col w-2/3 gap-4">
            <InputText
              id="name"
              v-model="selectedGameType.name"
              fluid
              class="w-2/3"
              autocomplete="off"
            />
            <InputNumber
              id="startValue"
              v-model="selectedGameType.startValue"
              fluid
              input-class="w-2/3"
              autocomplete="off"
              disabled
            />
            <InputNumber
              id="endValue"
              v-model="selectedGameType.endValue"
              fluid
              input-class="w-2/3"
              autocomplete="off"
              disabled
            />
          </div>
        </div>
        <div id="editBummerlSettings" class="flex flex-col gap-2 mb-4">
          <label for="endValueReachedWinLose" class="font-semibold"
            >Endwert erreicht:</label
          >
          <SelectButton
            id="endValueReachedWinLose"
            v-model="selectedGameType.endValueReachedWinLose"
            :options="endValueReachedWinLoseOptions"
            :allow-empty="false"
            disabled
          />
          <label for="endValueReachedBummerl" class="font-semibold"
            >Bummerl bekommt:</label
          >
          <SelectButton
            id="endValueReachedBummerl"
            v-model="selectedGameTypeEndValueReachedBummerlDummy"
            :options="endValueReachedBummerlOptions"
            :allow-empty="false"
            disabled
          />
        </div>
        <div id="editButtons" class="flex justify-between gap-2">
          <Button
            type="button"
            label="Abbrechen"
            severity="secondary"
            @click="showEditGameTypePopup = false"
          ></Button>
          <Button
            raised
            type="button"
            label="Speichern"
            @click="editGameType"
          ></Button>
        </div>
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

    <Dialog
      v-model:visible="showDeleteGameTypePopup"
      modal
      :closable="false"
      :header="
        'Soll Spielart ' + gameTypeToDelete.name + ' wirklich gelöscht werden?'
      "
      :style="{ width: '80vw' }"
    >
      <div class="pb-4">
        <p>Partien mit dieser Spielart werden auch gelöscht!</p>
      </div>
      <div class="flex justify-between gap-2">
        <Button
          type="button"
          label="Abbrechen"
          severity="secondary"
          @click="showDeleteGameTypePopup = false"
        ></Button>
        <Button
          raised
          severity="danger"
          type="button"
          label="Löschen"
          @click="deleteGameType"
        ></Button>
      </div>
    </Dialog>
  </div>
</template>

<style>
.p-togglebutton.p-component {
  width: 50%;
}
</style>
