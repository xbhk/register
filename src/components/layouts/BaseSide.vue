<template>
  <el-menu
    default-active="2"
    class="el-menu-vertical-demo"
    :collapse="isCollapse"
    @open="handleOpen"
    @close="handleClose"
  >

      <!--
    <el-sub-menu index="1">
      <template #title>
        <el-icon><location /></el-icon>
        <span>Navigator One</span>
      </template>

      <el-menu-item-group>
        <template #title><span>Group One</span></template>
        <el-menu-item index="1-1">item one</el-menu-item>
        <el-menu-item index="1-2">item two</el-menu-item>
      </el-menu-item-group>

      <el-menu-item-group title="Group Two">
        <el-menu-item index="1-3">item three</el-menu-item>
      </el-menu-item-group>
      <el-sub-menu index="1-4">
        <template #title><span>item four</span></template>
        <el-menu-item index="1-4-1">item one</el-menu-item>
      </el-sub-menu>
    </el-sub-menu>
      -->

  <router-link to="/digram">
    <el-menu-item index="2">
<el-icon><Odometer /></el-icon>
      <template #title>仪表盘</template>
    </el-menu-item></router-link>

    <router-link to="/detect">
    <el-menu-item index="3" >
<el-icon><Aim /></el-icon>
      <template #title>火焰检测</template>
    </el-menu-item></router-link>

  <router-link to="/Operation">
    <el-menu-item index="4" >
<el-icon><Operation /></el-icon>
      <template #title>传感器</template>
    </el-menu-item></router-link>

    <el-menu-item index="5" disabled>
      <el-icon><setting /></el-icon>
      <template #title>设置</template>
    </el-menu-item>


    <el-menu-item @click="toggleDark()">
      <button
        class="border-none w-full bg-transparent cursor-pointer"
        style="height: var(--ep-menu-item-height)"
      >
        <i inline-flex i="dark:ep-moon ep-sunny" />
      </button>
    </el-menu-item>

  </el-menu>


</template>

<script lang="ts" setup>
import { ref } from "vue";
import {
  Aim,
  Setting,
  Odometer,
  Operation
} from "@element-plus/icons-vue";

import { toggleDark } from "../../composables";
const isCollapse = ref(true);
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
</script>
