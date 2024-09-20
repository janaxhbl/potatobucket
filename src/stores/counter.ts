import type { User } from "firebase/auth";
import { defineStore } from "pinia";

export const useStore = defineStore("potatobucket", {
  state: () => ({ user: null as User | null })
});
