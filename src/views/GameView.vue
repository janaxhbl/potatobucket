<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { Round } from "@/interfaces/Round";
import { useStore } from "@/stores/counter";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputGroup from "primevue/inputgroup";
import InputNumber from "primevue/inputnumber";
import { onMounted, ref, type Ref } from "vue";
import { useRoute } from "vue-router";

let gameId: number = -1;

let game: Ref<Game> = ref({} as Game);
let title: Ref<string> = ref("");
let players_raw: Ref<string[]> = ref([]);
let rounds_raw: Ref<Round[]> = ref([]);

let players: Ref<{ field: string; header: string }[]> = ref([]);
let rounds: Ref<any[]> = ref([]); // bsp: [{papa: 7, jana: 7}, {papa: 6, jana: 7}]

let addRoundValues: Ref<number[]> = ref([]);

function getCurrentGame() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    game.value = value[gameId].data() as Game;

    title.value = game.value.title;
    players_raw.value = game.value.players;
    rounds_raw.value = game.value.rounds;

    // add as many nulls as there are players in the addRoundValues array
    for (let i = 0; i < players_raw.value.length; i++) {
      addRoundValues.value.push(null as unknown as number);
    }

    // format for datapanel
    players.value = [];
    for (let i = 0; i < players_raw.value.length; i++) {
      players.value.push({
        field: players_raw.value[i],
        header: players_raw.value[i],
      });
    }

    rounds.value = [];
    for (let i = 0; i < rounds_raw.value.length; i++) {
      let roundRaw = rounds_raw.value[i];
      let round: { [key: string]: number } = {};
      for (let j = 0; j < players_raw.value.length; j++) {
        round[players_raw.value[j]] = roundRaw.points[j];
      }
      rounds.value.push(round);
    }
  });
}

async function addRound(btnId: string) {
  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then(async (data) => {
    let ids: string[] = data[0].data().ids as string[];
    let currDocID = ids[gameId];

    let everyThingIsNull: boolean = true;
    for (let i = 0; i < addRoundValues.value.length; i++) {
      if (addRoundValues.value[i] == null) {
        addRoundValues.value[i] = 0;
      } else {
        everyThingIsNull = false;
      }
    }

    if (everyThingIsNull) {
      addRoundValues.value = [];
      return;
    }

    let newRoundNum: number = rounds_raw.value.length;
    newRoundNum++;
    let cumulativeRoundValues: number[] = [];

    if (btnId == "absolut") {
      for (let i = 0; i < addRoundValues.value.length; i++) {
        cumulativeRoundValues.push(addRoundValues.value[i]);
      }
    } else {
      let pointsOfLastRound: number[] =
        rounds_raw.value[rounds_raw.value.length - 1].points;

      if (btnId == "plus") {
        for (let i = 0; i < pointsOfLastRound.length; i++) {
          cumulativeRoundValues.push(
            pointsOfLastRound[i] + addRoundValues.value[i]
          );
        }
      } else if (btnId == "minus") {
        for (let i = 0; i < pointsOfLastRound.length; i++) {
          cumulativeRoundValues.push(
            pointsOfLastRound[i] - addRoundValues.value[i]
          );
        }
      }
    }

    let newRound: Round = { num: newRoundNum, points: cumulativeRoundValues };
    game.value.rounds.push(newRound);
    console.log(game.value);

    FirestoreDB.updateDocument("partien", currDocID, game.value);

    addRoundValues.value = [];

    getCurrentGame();
  });
}

onMounted(() => {
  gameId = Number(useRoute().params.id);
  getCurrentGame();
});
</script>

<template>
  <div id="main" class="h-full flex flex-col justify-between gap-4">
    <div class="flex flex-col overflow-hidden gap-4">
      <div id="header">
        <h1 class="text-xl border-b-[1px] border-[#bb9d3a]">{{ title }}</h1>
      </div>

      <div id="data" class="overflow-y-auto">
        <DataTable
          v-if="rounds && rounds.length > 0"
          :value="rounds"
          :striped-rows="true"
          :show-gridlines="false"
          class="rounded-lg overflow-hidden"
        >
          <Column
            v-for="p of players"
            :key="p.field"
            :field="p.field"
            :header="p.header"
          ></Column>
        </DataTable>
      </div>
    </div>

    <div id="buttons">
      <InputGroup class="mb-2">
        <InputNumber
          v-for="i in players_raw.length"
          :key="i - 1"
          v-model="addRoundValues[i - 1]"
          :placeholder="players_raw[i - 1]"
        />
      </InputGroup>

      <div class="flex gap-2 mb-2">
        <Button
          label="Speichern +"
          icon="pi pi-save"
          icon-pos="left"
          class="w-full"
          @click="addRound('plus')"
        />

        <Button
          label="Speichern -"
          icon="pi pi-save"
          icon-pos="left"
          class="w-full"
          @click="addRound('minus')"
        />
      </div>

      <Button
        label="Speichern (absolute Werte)"
        icon="pi pi-save"
        icon-pos="left"
        class="w-full"
        @click="addRound('absolut')"
      />
    </div>
  </div>
</template>
