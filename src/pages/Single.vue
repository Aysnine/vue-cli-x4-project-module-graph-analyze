<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<script>
import { fetchShopInfo, fetchShopName } from "../api/shop";
import { fetchUserInfo } from "../api/user";

export default {
  mounted() {
    fetchUserInfo();
    fetchShopInfo();
    fetchShopName();
  },
};
</script>
