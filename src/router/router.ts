import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import AccountView from "@/views/AccountView.vue";
import PartienView from "@/views/PartienView.vue";

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
      path: "/partien",
      name: "partien",
      component: PartienView
    }
  ]
});

export default router;
