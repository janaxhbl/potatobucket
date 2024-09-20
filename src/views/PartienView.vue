<script setup lang="ts">
import { FirestoreDB } from "@/database";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import { ref } from "vue";

let doc_id: string = "NaU2ssvrWZuoPUn9QVTn";
let data = ref({ test: "hello, world!" });

async function makedocument() {
  doc_id = await FirestoreDB.createDocument("partien", data);
  console.log(doc_id);
}

async function getvalues() {
  let data = FirestoreDB.getAllInCollection("partien");
  data.then((value) => {
    let real_data = value[0]._document.data.value.mapValue.fields;
    console.log(real_data);
  });
}

async function upddoc() {
  console.log(data.value);
  FirestoreDB.updateDocument("partien", doc_id, data.value);
}
</script>

<template>
  <h1>Partien</h1>
  <Button raised label="makedoc" @click="makedocument"></Button>
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
