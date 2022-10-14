<template>
  <div style="text-align: left; border: 1px solid gray">
    <pre>
      hello
    </pre>
  </div>
</template>

<script>
export default {
  mounted() {
    console.log(this.$router.options.routes);
  },
};
</script>
