<script setup lang="ts">
import { reactive, onMounted, ref } from "vue";
import * as tf from '@tensorflow/tfjs';
import labels from "../composables/labels.json";
import { loadGraphModel } from '@tensorflow/tfjs';
import { start } from "repl";
import { isEmpty, isNull, isUndefined } from "lodash";


const UURL =( process.env.NODE_ENV === 'development'|| location.hostname==="envchk.20021123.xyz")? "pi.20021123.xyz":location.hostname;
const MURL = location.hostname;//"localhost:5173"
var animateid;
const WS_URL = (location.protocol === 'https:' ? "wss://" : "ws://") + UURL;
const WS_PORT = location.protocol === 'https:' ? 9000 : 8084;
var player;
var WSclient;

const classThreshold = 0.2;

const isVideoStreamReady = ref(false);
const isModelReady = ref(false);
const initFailMessage = ref('');
var model;
const videoRef = ref();
const canvasRef = ref();
const inputsource = ref(0);
const modelsource = ref(0);

const modelName = () => {
  return modelsource.value == 0 ? 'yolov5n' : 'fire';
}



const MODEL_URL = () => {
  return '//' + MURL + `/${modelName()}_web_model/model.json`;
}

const closeWebcam = () => {

  console.log("close webcam");
  const url = videoRef.value.src;
  videoRef.value.srcObject = null;// restore video source
  URL.revokeObjectURL(url); // revoke url
  isVideoStreamReady.value = false;
  navigator.mediaDevices.getUserMedia({
    audio: false, // don't capture audio
    video: { facingMode: 'environment' } // use the rear camera if there is
  }).then(stream => {
    stream.getTracks().forEach(function (track) {
      if (track.readyState == 'live') {
        track.stop();
      }
    });
  }
  );

  videoRef.value.value = ""; // reset input video
  //videoRef.value.style.display = "none"; // hide video
};
const closeRaspStream = () => {
  console.log("close rasp stream");
  var canvas = document.getElementById("videoCanvas");
  if (isNull(canvas)) return;
  canvas.style.display = "none"; // hide canvas
  WSclient.close();
}
var startbefore = false;

const restartframe=() =>{
  
  cancelAnimationFrame(animateid);
  detectObjects();
}
const changemodel = async () => {
  const ctx = canvasRef.value.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
  console.log("ctx=");
  console.log(ctx);
  loadCustomModel().then(()=>{
  restartframe();
  })
}

const changesource = () => {
  const ctx = canvasRef.value.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas
  console.log("ctx=");
  console.log(ctx);
  if (inputsource.value == 0) {
    if (!startbefore)
      startbefore = true;
    else
      closeWebcam();
    initRaspStream();
  } else {
    if (!startbefore)
      startbefore = true;
    else
      closeRaspStream();
    initWebcamStream();
  }
  restartframe();
}

onMounted(() => {
  loadModelAndDetection();
  changesource();
  tf.env().set("WEBGL_DELETE_TEXTURE_THRESHOLD", 256000000);
});

const initRaspStream = () => {

  console.log("init rasp stream");
  // Show loading notice
  var canvas = document.getElementById("videoCanvas");
  if (isNull(canvas)) return;
  canvas.style.display = ""; // show canvas
  // Setup the WebSocket connection and start the player
  WSclient = new WebSocket(WS_URL + ":" + WS_PORT);
  // @ts-ignore
  player = new jsmpeg(WSclient, { canvas: canvas });
  // console.log(player);
}
const initWebcamStream = () => {
  console.log("init webcam");
  videoRef.value.style.display = ""; // show video
  // if the browser supports mediaDevices.getUserMedia API
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({
      audio: false, // don't capture audio
      video: { facingMode: 'environment' } // use the rear camera if there is
    })
      .then(stream => {
        // set <video> source as the webcam input
        let video = videoRef.value;
        try {
          video.srcObject = stream
        } catch (error) {
          // support older browsers
          console.log('qwq webcam stream', error)
        }
        return new Promise<void>((resolve, reject) => {
          // when video is loaded
          video.onloadedmetadata = () => {
            console.log('webcam stream initialized');
            isVideoStreamReady.value = true
            resolve();
          }
        })
      })
      .catch(error => {
        console.log('failed to initialize webcam stream', error)
        throw (error)
      })
  } else {
    return Promise.reject(new Error('Your browser does not support mediaDevices.getUserMedia API'))
  };
}

const loadCustomModel = () => {
  isModelReady.value = false;
  console.log("load model [" + modelName()+"]");
  return loadGraphModel(MODEL_URL())
    .then(mmodel => {
      model = mmodel;
      isModelReady.value = true;
      console.log('Model loaded: ', model);
    })
    .catch(error => {
      console.log('Failed to load the model', error);
      throw error;
    });
};
/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xRatio, yRatio; // ratios for boxes
  const input = tf.tidy((): tf.Tensor<tf.Rank> => {
    const img = tf.browser.fromPixels(source);
    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio
    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0); // add batch
  });

  return [input, xRatio, yRatio];
};

const renderBoxes = (
  canvasRef,
  classThreshold,
  boxes_data,
  scores_data,
  classes_data,
  ratios
) => {
  const ctx = canvasRef.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // clean canvas

  const colors = new Colors();

  // font configs
  const font = `${Math.max(
    Math.round(Math.max(ctx.canvas.width, ctx.canvas.height) / 40),
    14
  )}px Arial`;
  ctx.font = font;
  ctx.textBaseline = "top";
  for (let i = 0; i < scores_data.length; ++i) {
    // filter based on class threshold
    if (scores_data[i] > classThreshold) {
      const klass = labels[modelsource.value][classes_data[i]];
      const color = colors.get(classes_data[i]);
      const score = (scores_data[i] * 100).toFixed(1);
      /*
            console.log("i=",i);
            console.log(classes_data[i]);
            console.log(color);
            console.log(score);
            console.log(boxes_data.slice(i*4,(i+1)*4));*/

      let [x1, y1, x2, y2] = boxes_data.slice(i * 4, (i + 1) * 4);

      x1 *= canvasRef.width * ratios[0];
      x2 *= canvasRef.width * ratios[0];
      y1 *= canvasRef.height * ratios[1];
      y2 *= canvasRef.height * ratios[1];

      const width = x2 - x1;
      const height = y2 - y1;

      // draw box.
      ctx.fillStyle = Colors.hexToRgba(color, 0.2);
      ctx.fillRect(x1, y1, width, height);
      // draw border box.
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 200, 2.5);
      ctx.strokeRect(x1, y1, width, height);

      // Draw the label background.
      ctx.fillStyle = color;
      const textWidth = ctx.measureText(klass + " - " + score + "%").width;
      const textHeight = parseInt(font, 10); // base 10
      const yText = y1 - (textHeight + ctx.lineWidth);
      ctx.fillRect(
        x1 - 1,
        yText < 0 ? 0 : yText, // handle overflow label box
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth
      );

      // Draw labels
      ctx.fillStyle = "#ffffff";
      ctx.fillText(klass + " - " + score + "%", x1 - 1, yText < 0 ? 0 : yText);
    }
  }
};

class Colors {
  palette: String[];
  n: number;
  // ultralytics color palette https://ultralytics.com/
  constructor() {
    this.palette = [
      "#FF3838",
      "#FF9D97",
      "#FF701F",
      "#FFB21D",
      "#CFD231",
      "#48F90A",
      "#92CC17",
      "#3DDB86",
      "#1A9334",
      "#00D4BB",
      "#2C99A8",
      "#00C2FF",
      "#344593",
      "#6473FF",
      "#0018EC",
      "#8438FF",
      "#520085",
      "#CB38FF",
      "#FF95C8",
      "#FF37C7",
    ];
    this.n = this.palette.length;
  }

  get = (i) => this.palette[Math.floor(i) % this.n];

  static hexToRgba = (hex, alpha) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `rgba(${[parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(
        ", "
      )}, ${alpha})`
      : null;
  };
}
const warmup = async () => {

  const dummyInput = tf.ones(model.inputs[0].shape);
  const warmupResult = await model.executeAsync(dummyInput);
  tf.dispose(warmupResult); // cleanup memory
  tf.dispose(dummyInput); // cleanup memory
}
const detectObjects = async () => {
  if (!isModelReady.value){
    return;
  }
  if(inputsource.value == 1 && !isVideoStreamReady.value) {
    /*
    console.log("start gg");
    console.log(isModelReady.value);
    console.log(inputsource.value);
    console.log(isVideoStreamReady.value);
    */
    
    requestAnimationFrame(detectObjects); 
    return;
// get another frame

  }

  var inputShape = model.inputs[0].shape;
  const [modelWidth, modelHeight] = inputShape.slice(1, 3);

 // tf.engine().startScope(); // start scoping tf engine
  //console.log(videoRef.value);
  const [input, xRatio, yRatio] = preprocess(inputsource.value == 0 ? player.canvas : videoRef.value, modelWidth, modelHeight);
try{
  await model.executeAsync(input).then((res) => {
    const [boxes, scores, classes] = res.slice(0, 3);
    const boxes_data = boxes.dataSync();
    const scores_data = scores.dataSync();
    const classes_data = classes.dataSync();
    renderBoxes(canvasRef.value, classThreshold, boxes_data, scores_data, classes_data, [
      xRatio,
      yRatio,
    ]); // render boxes

    tf.dispose(res); // clear memory
  }) .catch(error => {
      console.log('Run detect failed ', error); 
      throw (error);
    });
  }catch(error){  
      console.log('Run detect failed 2', error);
      throw (error);
  }
  animateid=requestAnimationFrame(detectObjects); // get another frame
 // tf.engine().endScope(); // end of scoping


};

const loadModelAndDetection = () => {
  loadCustomModel()
    .then(() => {
      warmup();
      detectObjects();
    })
    .catch(error => {
      console.log('Failed to init stream and/or model: ', error);
      initFailMessage.value = error;
      return;
    });
};

</script>

<template>
  <h3 v-if="!isModelReady && !initFailMessage">loading model ...</h3>
  <h3 v-if="initFailMessage">Failed to init stream and/or model - {{ initFailMessage }}</h3>

  <div class="resultFrame">

    <canvas id="videoCanvas" width="640" height="480"> </canvas>
    <video ref="videoRef" autoplay></video>
    <canvas ref="canvasRef" width="640" height="480"></canvas>
  </div>


  <br />
  <br />
  <br />
  <div class="butdiv">
    <el-radio-group v-model="inputsource" @change="changesource" class="ml-4">
      <el-radio-button label="0" size="large">树莓派</el-radio-button>
      <el-radio-button label="1" size="large">webcam</el-radio-button>
    </el-radio-group>

    <el-radio-group v-model="modelsource" @change="changemodel" class="ml-4">
      <el-radio-button label="0" size="large">yolov5n</el-radio-button>
      <el-radio-button label="1" size="large">fire_detect</el-radio-button>
    </el-radio-group>
  </div>
</template>

<style scoped lang="scss">
.butdiv{
  text-align: center;
  width: 90vw;
}
.resultFrame {
  position: relative;
  top: 50px;
  width: 600px;
  height: 480px;
}

.resultFrame>canvas {
  position: absolute;
}

.resultFrame>video {
  position: absolute;
}
</style>
