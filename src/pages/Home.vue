<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <X msg="Welcome to Your Vue.js App" />
    <Wow msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
import HelloWorld from "@/components/HelloWorld.vue";
import Wow from "@/components/Wow.vue";
import X from "@/components/X.vue";

export default {
  name: "Home",
  components: {
    HelloWorld,
    Wow,
    X,
  },
};
</script>
