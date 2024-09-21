<script setup lang="ts">
import { FirestoreDB } from "@/database";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import { ref } from "vue";

let doc_id: string = "vztSjmXy8Xjt2oPa0s7Y";
let data = ref({ test: "hello, world!" });

async function createGame() {
  doc_id = await FirestoreDB.createDocument("partien", data.value);
  console.log(doc_id);
}

async function getvalues() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    let real_data = value[0].data();

    console.log(real_data);
  });
}

async function upddoc() {
  console.log(data.value);
  FirestoreDB.updateDocument("partien", doc_id, data.value);
}
</script>

<template>
  <div class="flex flex-row justify-end">
    <Button raised label="neue Partie erstellen" @click="createGame"></Button>
  </div>

  <Button raised label="getvalues" @click="getvalues"></Button>
  <Button raised label="pudatevalue" @click="upddoc"></Button>
  <br /><br />
  <FloatLabel>
    <InputText id="data" v-model="data.test" />
    <label for="data">data</label>
  </FloatLabel>
  <br /><br />
  {{ data }}
</template>
