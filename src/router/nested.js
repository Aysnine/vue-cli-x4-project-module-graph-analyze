export default [
  {
    path: "/nested",
    name: "Nested",
    component: () => ({ render: (h) => h("router-view") }),
    children: [
      {
        path: "foo",
        name: "Foo",
        component: () => import("../pages/nested/PageFoo.vue"),
      },
      {
        path: "bar",
        name: "Bar",
        component: () => import("../pages/nested/PageBar.vue"),
      },
    ],
  },
  {
    path: "/nestedx",
    name: "Nestedx",
    component: () => ({ render: (h) => h("router-view") }),
  },
];
