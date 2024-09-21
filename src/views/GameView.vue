<script setup lang="ts">
import { FirestoreDB } from "@/database";
import type { Game } from "@/interfaces/Game";
import type { Round } from "@/interfaces/Round";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { onMounted, ref, type Ref } from "vue";
import { useRoute } from "vue-router";

let game: Ref<Game> = ref({} as Game);
let title: Ref<String> = ref("");
let players_raw: Ref<String[]> = ref([]);
let rounds_raw: Ref<Round[]> = ref([]);

let players: any[] = [];
let rounds: Ref<any[]> = ref([]);

function getCurrentGame() {
  const game_id = Number(useRoute().params.id);

  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    game.value = value[game_id].data() as Game;

    //console.log(game.value);
    title.value = game.value.title;
    players_raw.value = game.value.players;
    rounds_raw.value = game.value.rounds;

    // format for datapanel
    for (let i = 0; i < players_raw.value.length; i++) {
      players.push({
        field: players_raw.value[i],
        header: players_raw.value[i],
      });
    }
    console.log(players);

    // Loop through each key in the rounds object
    for (const roundKey in rounds_raw.value) {
      if (Object.prototype.hasOwnProperty.call(rounds_raw.value, roundKey)) {
        const values: any = rounds_raw.value[roundKey]; // Get the values (e.g., [7, 7] for round 1)

        const result: any = {}; // Create an empty object to store the field-value pairs

        // Loop through the players array and match the field with the values from the round
        for (let i = 0; i < players.length; i++) {
          const playerField = players[i].field; // Get the field (e.g., 'x' or 'y')
          result[playerField] = values[i]; // Assign the corresponding value from the round
        }

        rounds.value.push(result); // Add the result object to the transformed data array
      }
    }

    console.log(rounds.value);
  });
}

onMounted(() => {
  getCurrentGame();
  null;
});
</script>

<template>
  <div id="main">
    <h1 class="text-xl border-b-[1px] border-[#bb9d3a] mb-4">{{ title }}</h1>

    <DataTable
      v-if="rounds && rounds.length > 0"
      :value="rounds"
      :striped-rows="true"
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
</template>
