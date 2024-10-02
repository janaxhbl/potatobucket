<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { GameType } from "@/interfaces/GameType";
import type { Round } from "@/interfaces/Round";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputGroup from "primevue/inputgroup";
import InputNumber from "primevue/inputnumber";
import { onMounted, ref, type Ref } from "vue";
import { useRoute } from "vue-router";

let gameId: number = -1;
let game: Ref<Game> = ref({} as Game);
let gameType: Ref<GameType> = ref({} as GameType);
let title: Ref<string> = ref("");
let players_raw: Ref<string[]> = ref([]);
let rounds_raw: Ref<Round[]> = ref([]);

let players: Ref<{ field: string; header: string }[]> = ref([]);
let rounds: Ref<any[]> = ref([]); // bsp: [{papa: 7, jana: 7}, {papa: 6, jana: 7}]
let editingRounds = ref([]);
let showEditColumn: Ref<boolean> = ref(false);

let addRoundValues: Ref<number[]> = ref([]);

function getCurrentGame() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    let games: Game[] = [];
    for (let i = 0; i < value.length; i++) {
      games.push(value[i].data() as Game);
    }
    games.sort((a, b) => a.id - b.id);
    for (let i = 0; i < games.length; i++) {
      if (games[i].id == gameId) {
        game.value = games[i];
      }
    }

    let gameTypeId = game.value.gameTypeId;
    let data2 = FirestoreDB.getAllInCollection("game_types");
    data2.then((value) => {
      let gameTypes = value[0].data().game_types;
      for (let i = 0; i < gameTypes.length; i++) {
        if (gameTypes[i].id == gameTypeId) {
          gameType.value = gameTypes[i];
        }
      }

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
        let round: { [key: string]: number } = { num: roundRaw.num };
        for (let j = 0; j < players_raw.value.length; j++) {
          round[players_raw.value[j]] = roundRaw.points[j];
        }
        rounds.value.push(round);
      }
    });
  });
}

async function addRound(btnId: string) {
  let documents = FirestoreDB.getAllInCollection("documents");
  documents.then(async (data) => {
    let ids: { game_id: number; doc_id: string }[] = data[0].data().ids;
    let currDocID: string = "";
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].game_id == gameId) {
        currDocID = ids[i].doc_id;
      }
    }

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

    FirestoreDB.updateDocument("partien", currDocID, game.value);

    addRoundValues.value = [];

    getCurrentGame();
  });
}

const onRowEditSave = (event: { newData: any; index: any }) => {
  let { newData, index } = event;

  rounds.value[index] = newData;

  let data = FirestoreDB.getAllInCollection("documents");
  data.then((value) => {
    let ids: { game_id: number; doc_id: string }[] = value[0].data().ids;
    let currDocID: string = "";
    for (let i = 0; i < ids.length; i++) {
      if (ids[i].game_id == gameId) {
        currDocID = ids[i].doc_id;
      }
    }
    let round = rounds.value[index];
    let round_num = round["num"];
    let points: number[] = [];
    let round_raw: Round = {} as Round;

    delete round["num"];

    for (let i = 0; i < players_raw.value.length; i++) {
      points.push(round[players_raw.value[i]]);
    }

    let index_to_splice = rounds_raw.value.findIndex(
      (obj) => obj.num == round_num
    );
    round_raw.num = round_num;
    round_raw.points = points;
    rounds_raw.value.splice(index_to_splice, 1, round_raw);

    game.value.rounds = rounds_raw.value;

    FirestoreDB.updateDocument("partien", currDocID, game.value);

    showEditColumn.value = false;
  });
};

onMounted(() => {
  gameId = Number(useRoute().params.id);
  getCurrentGame();
});
</script>

<template>
  <div id="main" class="h-full flex flex-col justify-between gap-4">
    <div class="flex flex-col overflow-hidden">
      <div
        id="header"
        class="flex flex-row justify-between items-end mb-4 pb-2 border-b-[1px] border-[#bb9d3a]"
      >
        <h1 class="text-xl">{{ title }}</h1>
        <Button
          raised
          size="small"
          icon="pi pi-pencil"
          @click="showEditColumn = !showEditColumn"
        ></Button>
      </div>

      <div id="data" class="overflow-y-auto">
        <DataTable
          v-if="rounds && rounds.length > 0"
          v-model:editing-rows="editingRounds"
          edit-mode="row"
          :value="rounds"
          :striped-rows="true"
          :show-gridlines="false"
          class="rounded-lg overflow-hidden"
          data-key="num"
          @row-edit-save="onRowEditSave"
        >
          <Column
            v-for="p of players"
            :key="p.field"
            :field="p.field"
            :header="p.header"
          >
            <template #editor="{ data, field }">
              <InputNumber v-model="data[field]" fluid />
            </template>
          </Column>
          <Column
            v-if="showEditColumn"
            :row-editor="true"
            body-style="padding: 0 !important; text-align: right;"
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

      <div class="flex gap-2">
        <Button
          v-if="gameType.countType == 'plus'"
          label="Speichern"
          icon="pi pi-save"
          icon-pos="left"
          class="w-full"
          @click="addRound('plus')"
        />

        <Button
          v-if="gameType.countType == 'minus'"
          label="Speichern"
          icon="pi pi-save"
          icon-pos="left"
          class="w-full"
          @click="addRound('minus')"
        />
      </div>

      <!-- <Button
        label="Speichern (absolute Werte)"
        icon="pi pi-save"
        icon-pos="left"
        class="w-full"
        @click="addRound('absolut')"
      /> -->
    </div>
  </div>
</template>
