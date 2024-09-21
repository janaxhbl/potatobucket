import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import AccountView from "@/views/AccountView.vue";
import GamesView from "@/views/GamesView.vue";
import GameView from "@/views/GameView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "",
      redirect: "/login"
    },
    {
      path: "/login",
      name: "login",
      component: LoginView
    },
    {
      path: "/home",
      name: "home",
      component: HomeView
    },
    {
      path: "/account",
      name: "account",
      component: AccountView
    },
    {
      path: "/games",
      name: "games",
      component: GamesView
    },
    {
      path: "/game/:id",
      name: "game",
      component: GameView,
      props: true
    }
  ]
});

export default router;
