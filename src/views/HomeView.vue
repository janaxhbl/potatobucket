<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { GameType } from "@/interfaces/GameType";
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

let showEditGameTypePopup: Ref<boolean> = ref(false);
let selectedGameType: Ref<GameType> = ref({} as GameType);

async function createNewGameType() {
  if (
    newGameType.value.name == null ||
    newGameType.value.startValue == null ||
    newGameType.value.endValue == null ||
    newGameType.value.countType == null
  ) {
    return;
  }

  newGameType.value.id = gameTypes.value.length;

  if (newGameType.value.countType == "Runter") {
    newGameType.value.countType = "minus";
  } else if (newGameType.value.countType == "Rauf") {
    newGameType.value.countType = "plus";
  } else {
    return;
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
  };
  showCreateGameTypePopup.value = false;
  getGameTypes();
}

function openEditGameTypePopup() {
  showEditGameTypePopup.value = true;
  selectedGameType.value.countType =
    selectedGameType.value.countType == "plus" ? "Rauf" : "Runter";
}

async function editGameType() {
  selectedGameType.value.countType =
    selectedGameType.value.countType == "Rauf" ? "plus" : "minus";

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

async function getGameTypes() {
  let data = FirestoreDB.getAllInCollection("game_types");
  data.then((value) => {
    gameTypes.value = [];
    gameTypes.value = value[0].data().game_types as GameType[];

    // gameTypes.value.sort((a, b) => a.name.localeCompare(b.name));
  });
}

onMounted(() => {
  getGameTypes();
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
                @change="openEditGameTypePopup"
              />
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

        <div class="flex flex-row">
          <SelectButton
            v-model="newGameType.countType"
            :options="['Rauf', 'Runter']"
            class="mb-4 flex w-full"
          />
        </div>
        <div class="flex justify-between gap-2">
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
      header="Spielart bearbeiten"
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
            />
            <InputNumber
              id="endValue"
              v-model="selectedGameType.endValue"
              fluid
              input-class="w-2/3"
              autocomplete="off"
            />
          </div>
        </div>

        <div class="flex flex-row">
          <SelectButton
            v-model="selectedGameType.countType"
            :options="['Rauf', 'Runter']"
            class="mb-4 flex w-full"
          />
        </div>
        <div class="flex justify-between gap-2">
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
  </div>
</template>

<style>
.p-togglebutton.p-component {
  width: 50%;
}
</style>
