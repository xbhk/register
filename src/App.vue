
<template>
  <el-config-provider namespace="ep">
    <BaseHeader />
    <div class="flex main-container">
      <BaseSide v-if="showSidebar" />
      <div>
        <router-view />
      </div>
    </div>
  </el-config-provider>
</template>

<script>
export default {
  computed: {
    showSidebar() {
      // 如果当前路由的元信息中 requiresAuth 为 true，则显示侧边栏
      return this.$route.meta.requiresAuth;
    }
  }
};
</script>

<style>

#app {
  text-align: center;
  color: var(--ep-text-color-primary);
}

.main-container {
  display: flex; /* 定义flex布局 */
  height: calc(100vh - var(--ep-menu-item-height) - 3px);
}

.main-container > div {
  flex-grow: 1; /* 使主内容区域填充剩余空间 */
  display: flex; /* 也定义为flex布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
}

</style>
