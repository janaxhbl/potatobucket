import type { User } from "firebase/auth";
import { defineStore } from "pinia";

export const useStore = defineStore("potatobucket", {
  state: () => ({
    user: null as User | null,
    games_ids: ["F9lZqEtTCLWl63KI2nc0", "NUnFKwgot25VUU5tcUfK"] as string[]
  })
});
