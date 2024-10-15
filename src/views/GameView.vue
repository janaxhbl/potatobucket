<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { GameType } from "@/interfaces/GameType";
import type { OldGame } from "@/interfaces/OldGame";
import type { Round } from "@/interfaces/Round";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputGroup from "primevue/inputgroup";
import InputNumber from "primevue/inputnumber";
import { onMounted, ref, type Ref } from "vue";
import { useRoute } from "vue-router";

let gameId: number = -1;
let docId: string = "";
let game: Ref<Game> = ref({} as Game);
let gameType: Ref<GameType> = ref({} as GameType);
let title: Ref<string> = ref("");
let players_raw: Ref<string[]> = ref([]);
let rounds_raw: Ref<Round[]> = ref([]);

let players: Ref<{ field: string; header: string }[]> = ref([]);
let rounds: Ref<any[]> = ref([]); // bsp: [{num: 1, papa: 7, jana: 7, ...}, {num: 2, papa: 6, jana: 7, ...}, ...]
let editingRounds: Ref<any[]> = ref([]);
let showEditColumn: Ref<boolean> = ref(false);

let addRoundValues: Ref<number[]> = ref([]);
let winner: Ref<string> = ref("");

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

      if (game.value.endValueReached) {
        let pointsOfLastRound =
          rounds_raw.value[rounds_raw.value.length - 1].points;
        let max_min_points: number = pointsOfLastRound[0];
        let player_id: number = 0;
        for (let i = 1; i < pointsOfLastRound.length; i++) {
          if (
            (gameType.value.countType == "plus" &&
              pointsOfLastRound[i] > max_min_points) ||
            (gameType.value.countType == "minus" &&
              pointsOfLastRound[i] < max_min_points)
          ) {
            max_min_points = pointsOfLastRound[i];
            player_id = i;
          }
        }
        winner.value = players_raw.value[player_id];
      }

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

      let documents = FirestoreDB.getAllInCollection("documents");
      documents.then(async (data3) => {
        let ids: { game_id: number; doc_id: string }[] = data3[0].data().ids;
        for (let i = 0; i < ids.length; i++) {
          if (ids[i].game_id == gameId) {
            docId = ids[i].doc_id;
          }
        }
      });
    });
  });
}

async function addRound() {
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

  let pointsOfLastRound: number[] =
    rounds_raw.value[rounds_raw.value.length - 1].points;

  if (gameType.value.countType == "plus") {
    for (let i = 0; i < pointsOfLastRound.length; i++) {
      cumulativeRoundValues.push(
        pointsOfLastRound[i] + addRoundValues.value[i]
      );
    }
  } else if (gameType.value.countType == "minus") {
    for (let i = 0; i < pointsOfLastRound.length; i++) {
      cumulativeRoundValues.push(
        pointsOfLastRound[i] - addRoundValues.value[i]
      );
    }
  }

  let newRound: Round = { num: newRoundNum, points: cumulativeRoundValues };
  game.value.rounds.push(newRound);

  game.value.roundDealer++;
  if (game.value.roundDealer >= players_raw.value.length) {
    game.value.roundDealer = 0;
  }

  if (gameType.value.endValue != null) {
    // kann eh ned null sein, aber gameType.value.endValue schreit sonst im unteren if-statement
    for (let i = 0; i < newRound.points.length; i++) {
      if (
        (gameType.value.countType == "plus" &&
          newRound.points[i] >= gameType.value.endValue) ||
        (gameType.value.countType == "minus" &&
          newRound.points[i] <= gameType.value.endValue)
      ) {
        game.value.endValueReached = true;
        game.value.gameDealer++;
        if (game.value.gameDealer >= players_raw.value.length) {
          game.value.gameDealer = 0;
        }
        game.value.roundDealer = game.value.gameDealer;
        break;
      }
    }
  }

  await FirestoreDB.updateDocument("partien", docId, game.value);

  addRoundValues.value = [];
  getCurrentGame();
}

async function createNewDefaultRound() {
  let oldGameNum: number =
    game.value.oldGames.length == undefined
      ? 1
      : game.value.oldGames.length + 1;
  let oldGameToAdd: OldGame = { num: oldGameNum, rounds: game.value.rounds };
  game.value.oldGames.push(oldGameToAdd);
  game.value.rounds = [];

  let newPoints: number[] = [];
  for (let i = 0; i < players_raw.value.length; i++) {
    newPoints.push(gameType.value.startValue as number);
  }
  let newRound: Round = { num: 1, points: newPoints };
  game.value.rounds.push(newRound);
  game.value.endValueReached = false;

  await FirestoreDB.updateDocument("partien", docId, game.value);
  getCurrentGame();
}

const onRowEditCancel = () => {
  if (editingRounds.value.length == 0) {
    showEditColumn.value = false;
  }
};

const onRowEditSave = (event: { newData: any; index: any }) => {
  let { newData, index } = event;

  rounds.value[index] = newData;

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

  FirestoreDB.updateDocument("partien", docId, game.value);

  if (editingRounds.value.length == 0) {
    showEditColumn.value = false;
  }
};

function showEditColumns() {
  if (showEditColumn.value == true) {
    editingRounds.value.splice(0, editingRounds.value.length);
    showEditColumn.value = false;
  } else {
    showEditColumn.value = true;
    let lastRound = rounds.value[rounds.value.length - 1];
    editingRounds.value.push(lastRound);
  }
}

async function finishGame() {
  game.value.finished = true;

  await FirestoreDB.updateDocument("partien", docId, game.value);

  getCurrentGame();
}

function getHeaderClass(p: any) {
  if (
    p.header == players_raw.value[game.value.roundDealer] &&
    !game.value.endValueReached
  ) {
    return "!text-green-500";
  }
  return "";
}

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
          v-if="game.finished == false"
          raised
          size="small"
          label="abschließen"
          icon="pi pi-check"
          @click="finishGame"
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
          @row-edit-cancel="onRowEditCancel"
        >
          <Column
            v-for="p of players"
            :key="p.field"
            :field="p.field"
            :header="p.header"
            :header-class="getHeaderClass(p)"
          >
            <template #editor="{ data, field }">
              <InputNumber
                v-model="data[field]"
                class="editRowInputNumber"
                fluid
              />
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

    <div>
      <div
        v-if="
          !showEditColumn &&
          game.finished == false &&
          game.endValueReached == true
        "
      >
        <h1
          class="text-5xl font-semibold text-center pb-4"
          style="
            background: rgba(34, 197, 94, 1);
            background: linear-gradient(
              127deg,
              rgba(249, 115, 22, 1) 24%,
              rgba(34, 197, 94, 1) 59%,
              rgba(255, 34, 0, 1) 73%
            );
            -webkit-text-fill-color: transparent;
            -webkit-background-clip: text;
          "
        >
          {{ winner }} hat gewonnen!
        </h1>
        <Button
          raised
          label="Neue Runde starten"
          icon="pi pi-plus"
          icon-pos="left"
          class="w-full"
          @click="createNewDefaultRound"
        />
      </div>
      <div
        v-if="
          !showEditColumn &&
          game.finished == false &&
          game.endValueReached == false
        "
        id="buttons"
      >
        <h1 class="ml-0.5">aktueller Schrieb:</h1>
        <div class="overflow-auto">
          <InputGroup class="mb-2">
            <InputNumber
              v-for="i in players_raw.length"
              :key="i - 1"
              v-model="addRoundValues[i - 1]"
              :placeholder="players_raw[i - 1]"
              class="min-w-12"
            />
          </InputGroup>
        </div>

        <div class="flex gap-2">
          <Button
            raised
            label="Speichern"
            icon="pi pi-save"
            icon-pos="left"
            class="w-full"
            @click="addRound"
          />

          <Button
            severity="secondary"
            size="small"
            icon="pi pi-pencil"
            @click="showEditColumns"
          ></Button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
td:has(> span.editRowInputNumber) {
  padding-left: 0.25rem !important;
  padding-right: 0.25rem !important;
}
</style>
