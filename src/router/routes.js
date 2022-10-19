import about from "./about";
import { NAMES } from "./names";
import nested from "./nested";
import single from "./single";

const NAME = "Home";

export default [
  {
    path: "/",
    name: NAME,
    component: () => import("../pages/Home.vue"),
  },
  ...about,
  ...nested,
  single,
  {
    path: "/chore",
    name: NAMES.CHORE_NAME,
    component: () => ({ render: (h) => h("router-view") }),
    children: [
      {
        path: "/chore/x",
        name: "CHORE_X",
        component: () => ({ render: (h) => h("router-view") }),
        children: [
          {
            path: "/chore/y",
            name: "CHORE_Y",
            component: () => import("../pages/Chore.vue"),
          },
        ],
      },
    ],
  },
];
