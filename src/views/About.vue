<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script>
import { fetchUserInfo } from "../api/user";

export default {
  mounted() {
    fetchUserInfo();
  },
};
</script>
