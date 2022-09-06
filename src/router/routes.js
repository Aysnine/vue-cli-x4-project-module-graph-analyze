import about from "./about";

export default [
  {
    path: "/",
    name: "Home",
    component: () => import("../pages/Home.vue"),
  },
  ...about,
];
