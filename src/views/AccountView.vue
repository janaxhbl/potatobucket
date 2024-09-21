<script setup lang="ts">
import { logout } from "@/firebase";
import Button from "primevue/button";
</script>

<template>
  <div id="main" class="h-full flex flex-col justify-end">
    <Button raised label="logout" @click="logout" />
  </div>
</template>
