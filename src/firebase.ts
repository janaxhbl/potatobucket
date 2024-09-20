// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User
} from "firebase/auth";
import { useStore } from "./stores/counter";
import router from "./router/router";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCI8Wd3jangrpDonMeVFK3AsFdCp_OJB1Y",
  authDomain: "potatobucket-be931.firebaseapp.com",
  projectId: "potatobucket-be931",
  storageBucket: "potatobucket-be931.appspot.com",
  messagingSenderId: "414664070164",
  appId: "1:414664070164:web:a14aa6c57a1dd0e8590301"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

onAuthStateChanged(getAuth(), async (_: User | null) => {
  useStore().user = getAuth().currentUser;
  console.log(useStore().user);
  if (useStore().user != null) {
    router.push("/home");
  } else {
    router.push("/login");
  }
});

export async function login() {
  await signInWithPopup(getAuth(), new GoogleAuthProvider());
}

export async function logout() {
  await signOut(getAuth());
}
