<script setup lang="ts">
import { logout } from "@/firebase";
import Button from "primevue/button";
</script>

<template>
  <Button raised class="font-bold" label="logout" @click="logout" />
</template>
