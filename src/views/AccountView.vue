<script setup lang="ts">
import { logout } from "@/firebase";
import Button from "primevue/button";
</script>

<template>
  <div class="h-full flex flex-col justify-end">
    <Button raised class="m-4" label="logout" @click="logout" />
  </div>
</template>
