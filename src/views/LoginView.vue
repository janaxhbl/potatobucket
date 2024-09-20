<script setup lang="ts">
import { login } from "@/firebase";
import Button from "primevue/button";
import Panel from "primevue/panel";
</script>

<template>
  <div class="flex justify-center items-center h-full">
    <Panel class="w-full lg:w-1/4 mx-8">
      <div class="flex flex-col items-end px-4">
        <img src="@/assets/img/potatobucket.webp" class="rounded-md" />
        <Button raised class="w-full my-2" label="login" @click="login" />
      </div>
    </Panel>
  </div>
</template>
