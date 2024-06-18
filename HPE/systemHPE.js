import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils
  } from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";

  const demosSection = document.getElementById("demos");


let poseLandmarker = undefined;
let runningMode = "VIDEO";
let enableWebcamButton;
let webcamRunning = false;
const videoHeight = "480px";
const videoWidth = "640px";

const createPoseLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numPoses: 1
    });
    demosSection.classList.remove("invisible");
  };
  createPoseLandmarker();

const video = document.getElementById("webcam");
const canvasElement = document.getElementById(
  "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

// Check if webcam access is supported.
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!poseLandmarker) {
    console.log("Wait! poseLandmaker not loaded yet.");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Продолжить обработку";
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Отключить обработку";
  }

  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

function calculate_distance(a, b){
  return (Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2)))
}

function calculate_angle(a, b, c) {
  var radians = Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(b.y - a.y, b.x - a.x);
  var angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}

function calculate_midpoint(a, b){
  const x_mid = (a.x + b.x) / 2;
  const y_mid = (a.y + b.y) / 2;
  return({x:x_mid, y:y_mid})
}


let advice = ''
let message = ''
let count1 = 0
let count2 = 0
let count3 = 0
let stage = 'Lower'
let toScore = false
let accept_dist = 0
let lPinky = [0, 0]
let rPinky = [0, 0]
let lElbow = [0, 0]
let rElbow = [0, 0]
let lShoulder = [0, 0]
let rShoulder = [0, 0]
let lBottom = [0, 0]
let rBottom = [0, 0]
let lWrist = [0, 0]
let rWrist = [0, 0]
let lIndex = [0, 0]
let rIndex = [0, 0]
let torsoDiagonal = 0
let centerShoulder = [0, 0]
let centerElbow = [0, 0]
let centerBottom = [0, 0]
let centerWrist = [0, 0]
let end;
let totalTime;
let fpsArray = []
let lastVideoTime = -1;

async function predictWebcam() {
  canvasElement.style.height = videoHeight;
  video.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  video.style.width = videoWidth;

   // Now let's start detecting the stream.
   if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }

  let startTimeMs = performance.now();
  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      for (const landmark of result.landmarks) {
        const radioButtons = document.querySelectorAll('input[name="my-radio"]');

        radioButtons.forEach(radioButton => {
          radioButton.addEventListener('change', () => {
            stage = "Lower";
            toScore = false;
          });
        // Проверка, выбран ли radiobutton
          if (radioButton.checked) {
              // Выбор функции на основе значения radiobutton
            switch (radioButton.value) {
              case "1":
                exercise1(landmark);
                break;
              case "2":
                exercise2(landmark);
                break;
              case "3":
                exercise3(landmark);
                break;
            }
          }
        });

        drawingUtils.drawLandmarks(landmark, {
          radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1), color: 'white', fillColor: 'red' 
        });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: 'purple' });
      }
      canvasCtx.restore();
    });
  }

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    /***end = performance.now();
    totalTime = (end - startTimeMs) / 1000;
    if (1/totalTime !== Infinity)   //Better to remove later
      //console.log(1/totalTime)
      fpsArray.push(1/totalTime)
    let fpsArraySum = 0
    if (fpsArray.length === 100){
        fpsArraySum = fpsArray.reduce((acc, num) => acc + num, 0)
        console.log(Math.round(fpsArraySum/100))
        fpsArray = []
    }***/
    window.requestAnimationFrame(predictWebcam);
  }
}

async function exercise1(landmark) {
  torsoDiagonal = calculate_distance(landmark[24], landmark[11])
  //console.log(torsoDiagonal)
  lShoulder = landmark[11]
  rShoulder = landmark[12]
  //console.log(landmark);
  //if (Math.abs(lShoulder.y - rShoulder.y) > 0.05) {
  if (Math.abs(lShoulder.y - rShoulder.y) > 0.15 * torsoDiagonal) {
    advice = 'Старайтесь держать плечи на одном уровне!'
  } else {
    advice = ''
  }

  lPinky = landmark[17]
  rPinky = landmark[18]
  lElbow = landmark[13]
  rElbow = landmark[14]
  if ((calculate_distance(lPinky, rElbow) >= 0.3 * torsoDiagonal) || (calculate_distance(rPinky, lElbow) >= 0.3 * torsoDiagonal)) {
  //if ((calculate_distance(lPinky, rElbow) < 0.05) && (calculate_distance(rPinky, lElbow) < 0.05) && (lPinky.z < rElbow.z) && (rPinky.z < lElbow.z)) {
    message = 'Скрестите руки и опустите их в исходное положение'
    //console.log('Скрестите руки и опустите их в исходное положение');
    stage = 'Lower'
    toScore = false
  } else {
    if (stage === 'Upper') {
      //lShoulder = landmark[11]
      //rShoulder = landmark[12]
      centerShoulder = calculate_midpoint(lShoulder, rShoulder)
      centerElbow = calculate_midpoint(lElbow, rElbow)
      if (calculate_distance(centerElbow, centerShoulder) <= 0.15 * torsoDiagonal) {
        //console.log('Опустите руки');
        message = 'Опустите скрещенные руки'
        stage = 'Lower'
        toScore = true
      }
    } else {
      //console.log(landmark[13].y);
      //console.log(lBottom.y);
      lBottom = { ...landmark[23] };
      rBottom = { ...landmark[24] };
      //bodyHeight = lBottom.y - lShoulder.y
      lBottom.y -= 0.25 * torsoDiagonal
      rBottom.y -= 0.25 * torsoDiagonal
      centerElbow = calculate_midpoint(lElbow, rElbow)
      centerBottom = calculate_midpoint(lBottom, rBottom)
      if (calculate_distance(centerElbow, centerBottom) <= 0.15 * torsoDiagonal) {
        //console.log('Поднимите скрещенные руки до уровня плеч');
        message = 'Поднимите скрещенные руки до уровня плеч';
        stage = 'Upper'
        if (toScore) {
          count1 += 1
        }
      }
    }
  }
  document.getElementById("count").innerHTML = count1.toString();
  document.getElementById("message").innerHTML = message;
  document.getElementById("advice").innerHTML = advice;
}

async function exercise2(landmark) {
  torsoDiagonal = calculate_distance(landmark[24], landmark[11])
  lShoulder = landmark[11]
  rShoulder = landmark[12]
  if (Math.abs(lShoulder.y - rShoulder.y) > 0.15 * torsoDiagonal) {
    advice = 'Старайтесь держать плечи на одном уровне!'
  } else {
    advice = ''
  }

  if ((stage === 'Upper') || ((stage === 'Lower') && (toScore === false))) {
    accept_dist = 0.3 * torsoDiagonal
  }
  else {
    accept_dist = 0.6 * torsoDiagonal
  }

  lPinky = landmark[17]
  rPinky = landmark[18]
  lElbow = landmark[13]
  rElbow = landmark[14]
  if ((calculate_distance(lPinky, rElbow) >= accept_dist) || (calculate_distance(rPinky, lElbow) >= accept_dist)) {
  //if ((calculate_distance(lPinky, rElbow) < 0.05) && (calculate_distance(rPinky, lElbow) < 0.05) && (lPinky.z < rElbow.z) && (rPinky.z < lElbow.z)) {
    message = 'Скрестите руки и опустите их в исходное положение'
    stage = 'Lower'
    toScore = false
  } else {
    if (stage === 'Upper') {
      centerShoulder = calculate_midpoint(lShoulder, rShoulder)
      centerElbow = calculate_midpoint(lElbow, rElbow)
      if (calculate_distance(centerElbow, centerShoulder) <= 0.15 * torsoDiagonal) {
        stage = 'Rotate'
        //первые 5 поворотов - в левую сторону
        if (count2 % 10 < 5) {
          message = 'Поверните туловище влево'
        }
        else {
          message = 'Поверните туловище вправо'
        }
      }
    } else if (stage === 'Rotate') {
      if (((count2 % 10 < 5) && (rElbow.x > lShoulder.x)) || ((count2 % 10 >= 5) && (lElbow.x < rShoulder.x))) {
        message = 'Опустите скрещенные руки в исходное положение'
        stage = 'Lower'
        toScore = true
      }
    } else {
      lBottom = { ...landmark[23] };
      rBottom = { ...landmark[24] };
      lBottom.y -= 0.25 * torsoDiagonal
      rBottom.y -= 0.25 * torsoDiagonal
      //console.log(landmark[13].y);
      //console.log(lBottom.y);
      centerElbow = calculate_midpoint(lElbow, rElbow)
      centerBottom = calculate_midpoint(lBottom, rBottom)
      if (calculate_distance(centerElbow, centerBottom) <= 0.15 * torsoDiagonal) {
        stage = 'Upper'
        message = 'Поднимите скрещенные руки до уровня плеч'
        if (toScore) {
          count2 += 1
        }
      }
    }
  }
  document.getElementById("count").innerHTML = count2.toString();
  document.getElementById("message").innerHTML = message;
  document.getElementById("advice").innerHTML = advice;
}

async function exercise3(landmark) {
  torsoDiagonal = calculate_distance(landmark[24], landmark[11])
  lShoulder = landmark[11]
  rShoulder = landmark[12]
  if (Math.abs(lShoulder.y - rShoulder.y) > 0.15 * torsoDiagonal) {
    advice = 'Старайтесь держать плечи на одном уровне!'
  } else {
    advice = ''
  }

  lElbow = landmark[13]
  rElbow = landmark[14]
  lWrist = landmark[15]
  rWrist = landmark[16]
  lIndex = landmark[19]
  rIndex = landmark[20]


  //повороты влево
  if (count3 % 10 < 5) {
      let rElbowAngle = calculate_angle(rShoulder, rElbow, rWrist).toFixed(2)
      if (calculate_distance(lIndex, rWrist) >= 0.3 * torsoDiagonal)  {
          message = 'Обхватите кистью левой руки запястье правой и опустите их вниз'
          stage = 'Lower'
          toScore = false
      } else {
          if (stage === 'Upper') {
              if ((Math.abs(lShoulder.y - rElbow.y) <= 0.15 * torsoDiagonal) && (rWrist.x > lShoulder.x)) {
                  if (rElbowAngle >= 160) {
                      message = 'Опустите руки в исходное положение'
                      stage = 'Lower'
                      toScore = true
                  } else {
                      message = 'Выпрямите правую руку'
                  }
              }
          } else {
              lBottom = { ...landmark[23] };
              rBottom = { ...landmark[24] };
              lBottom.y += 0.18 * torsoDiagonal
              rBottom.y += 0.18 * torsoDiagonal
              centerWrist = calculate_midpoint(lIndex, rWrist)
              centerBottom = calculate_midpoint(lBottom, rBottom)
              if (calculate_distance(centerWrist, centerBottom) <= 0.15 * torsoDiagonal) {
                stage = 'Upper'
                if (toScore) {
                  count3 += 1
                }
                message = 'Поднимите руки в таком положении до уровня плеч c поворотом влево';
              }
          }
      }
      canvasCtx.fillStyle = 'white';
      canvasCtx.font = '44px Arial';
      canvasCtx.strokeStyle = 'black';
      canvasCtx.lineWidth = 2;
      const rElbowX = rElbow.x * canvasElement.width;
      const rElbowY = rElbow.y * canvasElement.height;
      canvasCtx.fillText(rElbowAngle.toString(), rElbowX, rElbowY);
      canvasCtx.strokeText(rElbowAngle.toString(), rElbowX, rElbowY);
  } else { //повороты вправо
      let lElbowAngle = calculate_angle(lShoulder, lElbow, lWrist).toFixed(2)
      if (calculate_distance(rIndex, lWrist) >= 0.3 * torsoDiagonal)  {
          message = 'Обхватите кистью правой руки запястье левой и опустите их вниз'
          stage = 'Lower'
          toScore = false
      } else {
          if (stage === 'Upper') {
              if ((Math.abs(rShoulder.y - lElbow.y) <= 0.15 * torsoDiagonal) && (lWrist.x < rShoulder.x)) {
                  if (lElbowAngle >= 160) {
                      message = 'Опустите руки в исходное положение'
                      stage = 'Lower'
                      toScore = true
                  } else {
                      message = 'Выпрямите левую руку'
                  }
              }
          } else {
              lBottom = { ...landmark[23] };
              rBottom = { ...landmark[24] };
              bodyHeight = lBottom.y - lShoulder.y
              lBottom.y += 0.18 * torsoDiagonal
              rBottom.y += 0.18 * torsoDiagonal
              centerWrist = calculate_midpoint(rIndex, lWrist)
              centerBottom = calculate_midpoint(lBottom, rBottom)
              if (calculate_distance(centerWrist, centerBottom) <= 0.15 * torsoDiagonal) {
                stage = 'Upper'
                if (toScore) {
                  count3 += 1
                }
                message = 'Поднимите руки в таком положении до уровня плеч c поворотом вправо';
              }
          }
      }
      canvasCtx.fillStyle = 'white';
      canvasCtx.font = '44px Arial';
      canvasCtx.strokeStyle = 'black';
      canvasCtx.lineWidth = 2;
      const lElbowX = lElbow.x * canvasElement.width;
      const lElbowY = lElbow.y * canvasElement.height;
      canvasCtx.fillText(lElbowAngle.toString(), lElbowX, lElbowY);
      canvasCtx.strokeText(lElbowAngle.toString(), lElbowX, lElbowY);
  }
  document.getElementById("count").innerHTML = count3.toString();
  document.getElementById("message").innerHTML = message;
  document.getElementById("advice").innerHTML = advice;
}