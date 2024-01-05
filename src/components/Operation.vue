<script setup lang="ts">
  import { provide, onMounted, ref } from "vue";

import { useDark } from "@vueuse/core";

import VChart, { THEME_KEY } from "vue-echarts";

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

const DB_URL = URL;
const DB_PORT = location.protocol === 'https:'? 5002: 5001;
const DATA_NUM = 200;

onMounted(() => {
  // Show loading notice
  getsensor(data_sensor1, "sensor1");
  getsensor(data_sensor2, "sensor2");
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
        }
    })
    .catch(function (e) {
      console.log("error: " + e.toString());
    });
}

function getsensorft(data, sensor: string, timerange): void {
              if( !timerange||!timerange[0]){
              getsensor(data, sensor);
              return;
              }
              console.log(timerange);
//console.log(timerange);
  fetch("//" + DB_URL + ":" + DB_PORT + "/" + sensor + "?start="+parseInt(timerange[0].getTime()/1000) + "&end=" + parseInt(timerange[1].getTime()/1000))
    .then((res) => res.json())
    .then((out) => {
      let n = out.length;
      data.value.splice(0, data.value.length);
      out = out.slice(-n);
      for (let i = 0; i < n; i++)
        if (data.value.length < n || data.value[n - 1][0] < out[i][0] * 1000) {
          if (data.value.length == n) data.value.shift();
          data.value.push([out[i][0] * 1000, out[i][1], out[i][2]]);
        }
    })
    .catch(function (e) {
      console.log("error: " + e.toString());
    });
}

var option0 = {
  title: {
    text: "ENS210",
    subtext: "温湿度传感器",
    left: "center",
    top: 10,
  },
  backgroundColor: bgc,
  legend: {
    orient: "vertical",
    left: "150",
    data: ["温度", "湿度"],
    top: 10,
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
};
var option2 = {
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
};

var option=ref(option0);

var sensor=ref(0);
const changetime = () =>{
console.log("time changed");


if(sensor.value==0){
 getsensorft(data_sensor1, "sensor1",timerange.value); 
}else{
 getsensorft(data_sensor2, "sensor2",timerange.value); 
}
}
const changechart = ()=> {
console.log("chart changed");
if(sensor.value==0){
option.value=option0;
 getsensorft(data_sensor1, "sensor1",timerange.value); 

}else{
option.value=option2;
 getsensorft(data_sensor2, "sensor2",timerange.value); 
}
};
const timerange = ref<[Date, Date]>([
])

const shortcuts = [
  {
    text: 'Last minute',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 60 * 1000 )
      return [start, end]
    },
  },
  {
    text: 'Last hour',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 )
      return [start, end]
    },
  },
  {
    text: 'Last day',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 )
      return [start, end]
    },
  },
  {
    text: 'Last week',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  }
]
</script>

<template>
  <el-space wrap style="min-height: 1px">
    <v-chart class="chart" :option="option" />
  </el-space>


  <el-row>
 <el-col :span="8">
    <el-radio-group v-model="sensor" @change="changechart" class="ml-4">
      <el-radio-button label="0" size="large">ENS210</el-radio-button>
      <el-radio-button label="1" disabled size="large">ENS160</el-radio-button>
      <el-radio-button label="2" size="large">LTR390UV</el-radio-button>
    </el-radio-group>
</el-col>

 <el-col :span="8">
    <el-date-picker
      class = "datepick"
      v-model="timerange"
      type="datetimerange"
      range-separator="To"
      :shortcuts="shortcuts"
      @change="changetime"
      start-placeholder="Start date"
      end-placeholder="End date"
    />
</el-col>
  </el-row>

</template>

<style scoped lang="scss">
.ep-row {
  justify-content: center;
}

.datepick{
  max-width: 50vw;
}

.chart {
  min-width: 90vw;
  min-height: 570px;
}

</style>
