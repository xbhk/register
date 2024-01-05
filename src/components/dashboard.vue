<script setup lang="ts">
import { provide, onMounted, ref , onBeforeUnmount} from "vue";

import { useDark } from "@vueuse/core";

import VChart, { THEME_KEY } from "vue-echarts";

import { ElButton, ElMessage } from "element-plus";
/*
   const count = ref(0);
   const input = ref("element-plus");

   const curDate = ref("");

   const toast = () => {
   ElMessage.success("Hello");
   };
 */

import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";

import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent, 
} from "echarts/components";

defineProps<{ msg: string }>();
use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  LineChart,
  CanvasRenderer,
]);


const URL =( process.env.NODE_ENV === 'development'|| location.hostname==="envchk.20021123.xyz")? "pi.20021123.xyz":location.hostname;

const WS_URL =  (location.protocol==='https:'?"wss://":"ws://") + URL;
const WS_PORT = location.protocol === 'https:'? 9000: 8084;
const DB_URL = URL;
const DB_PORT = location.protocol === 'https:'? 5002: 5001;
const DATA_NUM = 20;

onMounted(() => {
  // Show loading notice
  var canvas = document.getElementById("videoCanvas");

  // Setup the WebSocket connection and start the player
  var client = new WebSocket(WS_URL + ":" + WS_PORT);
  // @ts-ignore
  var player = new jsmpeg(client, { canvas: canvas });
  // console.log(player);
  getsensor(data_sensor1, "sensor1");
  getsensor(data_sensor2, "sensor2");
});

onBeforeUnmount(()=>{
  clearInterval(timer);

});


var theme = ref("light");
provide(THEME_KEY, theme);
var bgc = ref("rgba(0,0,0,0)");
useDark({
  onChanged(dark: boolean) {
    theme.value = dark ? "dark" : "";
    // update the dom, call the API or something
  },
});

//let data1 = ref([0.3, 0.4, 0.8]);
let data_sensor1 = ref([]);
let data_sensor2 = ref([]);

function getsensor(data, sensor: string): void {
  fetch("//" + DB_URL + ":" + DB_PORT + "/" + sensor)
    .then((res) => res.json())
    .then((out) => {
      let n = Math.min(DATA_NUM, out.length);
      out = out.slice(-n);
      for (let i = 0; i < n; i++)
        if (data.value.length < n || data.value[n - 1][0] < out[i][0] * 1000) {
          if (data.value.length == n) data.value.shift();
          data.value.push([out[i][0] * 1000, out[i][1], out[i][2]]);
          //console.log([out[i][0]*1000,out[i][1],out[i][2]]);
        }
    })
    .catch(function (e) {
      console.log("error: " + e.toString());
    });
}

/*
//let b=[0.3,0.4,0.8];
const change = () => {
  ElMessage.success("刷新成功");
  //var cur = Math.floor(Math.random()*(3-0)+0); console.log(cur);
  if (data1.value.length > 10) data1.value.shift();
  data1.value.push(Math.random());
  //data1.value.splice(0, data1.value.length, ...b);
  getsensor(data_sensor1, "sensor1");
  getsensor(data_sensor2, "sensor2");
};
*/

const timer=setInterval(function () {
  getsensor(data_sensor1, "sensor1");
  getsensor(data_sensor2, "sensor2");
}, 1000);

var option = ref({
  title: {
    text: "ENS210",
    subtext: "温湿度传感器",
    left: "center",
  },
  backgroundColor: bgc,
  legend: {
    orient: "vertical",
    left: "100",
    data: ["温度", "湿度"],
  },

  dataset: {
    source: data_sensor1,
    dimensions: ["timestamp", "temp", "humi"],
  },
  xAxis: {
    type: "time",
    //data: categories,
    axisLabel: {
      interval: 0,
      rotate: 45,
    },
  },
  yAxis: [
    {
      type: "value",
      scale: true,
      name: "°C",
    },
    {
      type: "value",
      scale: true,
      name: "%rh",
    },
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#283b56",
      },
    },
  },
  series: [
    {
      name: "温度",
      type: "line",
      smooth: true,
      yAxisIndex: 0,
      encode: {
        x: "timestamp",
        y: "temp",
      },
    },
    {
      name: "湿度",
      type: "line",
      smooth: true,
      yAxisIndex: 1,
      encode: {
        x: "timestamp",
        y: "humi",
      },
    },
  ],
});
/*
var option1=ref({
title:{
text: "ENS160",
subtext: "空气质量传感器",
left: "center"
},
backgroundColor: bgc,
legend: {
orient: "vertical",
left: "100",
data: ['TVOC', 'eCO2', 'AQI']
},
xAxis: {
type: time,
axisLabel:{
interval: 0,
rotate: 45, 
}
},
yAxis: [
{
type: 'value',
      scale: true,
},
{
type: 'value',
      scale: true,
}
],
  tooltip: {
trigger: 'axis',
         axisPointer: {
type: 'cross',
      label: {
backgroundColor: '#283b56'
      }
         }
  },
series: [
{
name: "TVOC",
      type: 'line',
      smooth: true,
      yAxisIndex: 0,
      encode:{
x:    'timestamp',
      y:'temp'
      }
},
{
name: "AQI",
      data: data2,
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
},
{
name: "eCO2",
      data: data3,
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
}
]
});
*/
var option2 = ref({
  title: {
    text: "LTR390UV",
    subtext: "光照传感器",
    left: "center",
  },
  notMerge: true,
  backgroundColor: bgc,
  legend: {
    orient: "vertical",
    left: "100",
    data: ["ALS", "Lux"],
  },
  dataset: {
    source: data_sensor2,
    dimensions: ["timestamp", "als", "lux"],
  },
  xAxis: {
    type: "time",
    axisLabel: {
      interval: 0,
      rotate: 45,
    },
  },
  yAxis: [
    {
      type: "value",
      scale: true,
    },
    {
      type: "value",
      scale: true,
    },
  ],
  tooltip: {
    trigger: "axis",
    axisPointer: {
      type: "cross",
      label: {
        backgroundColor: "#283b56",
      },
    },
  },
  series: [
    {
      name: "ALS",
      type: "line",
      smooth: true,
      yAxisIndex: 0,
      encode: {
        x: "timestamp",
        y: "als",
      },
    },
    {
      name: "Lux",
      type: "line",
      smooth: true,
      yAxisIndex: 1,
      encode: {
        x: "timestamp",
        y: "lux",
      },
    },
  ],
});
</script>

<template>
  
  <h1 color="$ep-color-primary">{{ msg }}</h1>

  <!--
<p>
See
<a href="https://element-plus.org" target="_blank">element-plus</a> for more
information.
</p>

<div class="mb-4">
<el-button size="large" @click="toast">El Message</el-button>
</div>

<div class="my-2 text-center flex flex-wrap justify-center items-center">
<el-button @click="count++">count is: {{ count }}</el-button>
<el-button type="primary" @click="count++">count is: {{ count }}</el-button>
<el-button type="success" @click="count++">count is: {{ count }}</el-button>
<el-button type="warning" @click="count++">count is: {{ count }}</el-button>
<el-button type="danger" @click="count++">count is: {{ count }}</el-button>
<el-button type="info" @click="count++">count is: {{ count }}</el-button>
</div>

<div>
<el-tag type="success" class="m-1">Tag 1</el-tag>
<el-tag type="warning" class="m-1">Tag 1</el-tag>
<el-tag type="danger" class="m-1">Tag 1</el-tag>
<el-tag type="info" class="m-1">Tag 1</el-tag>
</div>

<div class="my-2">
<el-input class="m-2" v-model="input" style="width: 200px" />
<el-date-picker
class="m-2"
v-model="curDate"
type="date"
placeholder="Pick a day"
></el-date-picker>
</div>

<p>For example, we can custom primary color to 'green'.</p>

<p>
Edit
<code>components/Odometer.vue</code> to test components.
</p>
<p>
Edit
<code>styles/element/var.scss</code> to test scss variables.
</p>

<p>
Full Example:
<a
href="https://github.com/element-plus/element-plus-vite-starter"
target="_blank"
>element-plus-vite-starter</a
>
| On demand Example:
<a
href="https://github.com/element-plus/unplugin-element-plus"
target="_blank"
>unplugin-element-plus/examples/vite</a
>
</p>
-->


  <el-row>
  <canvas id="videoCanvas" width="640" height="480"> </canvas>
  </el-row>

  <br />
  <br />
  <br />

  <el-row>

  <el-space wrap style="min-height: 1px">
    <v-chart class="chart" :option="option" />
    <v-chart class="chart" :option="option2" />
  </el-space>
  </el-row>
  <!--<el-button @click="change">refresh</el-button>-->
</template>

<style scoped lang="scss">
.ep-row {
  justify-content: center;
}

.chart {
  width: 640px;
  height: 370px;
}

</style>
