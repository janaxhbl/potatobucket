<script setup lang="ts">
import { logout } from "@/firebase";
import Button from "primevue/button";
</script>

<template>
  <div id="main" class="h-full flex flex-col justify-between">
    <div id="header">
      <h1 class="text-xl border-b-[1px] border-[#bb9d3a]">Account</h1>
    </div>
    <Button raised label="logout" @click="logout" />
  </div>
</template>
