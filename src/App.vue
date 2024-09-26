<script setup lang="ts">
import Menubar from "primevue/menubar";
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import { useStore } from "./stores/counter";

const router = useRouter();

const items = ref([
  {
    label: "Partien",
    icon: "pi pi-list",
    command: () => {
      router.push("/games");
    },
  },
  {
    label: "Home",
    icon: "pi pi-home",
    command: () => {
      router.push("/home");
    },
  },
  {
    label: "Account",
    icon: "pi pi-user",
    command: () => {
      router.push("/account");
    },
  },
]);
const breakpoint = ref("200px");
</script>

<template>
  <div id="main" class="w-screen h-[calc(100dvh)] bg-[#EBE0BD] flex flex-col">
    <div id="routerview" class="h-full p-4 overflow-auto">
      <RouterView />
    </div>
    <Menubar
      v-if="useStore().user != null"
      id="menubar"
      :model="items"
      :breakpoint="breakpoint"
      :pt="{
        rootList: {
          class: 'flex justify-around w-full',
        },
      }"
    />
  </div>
</template>
