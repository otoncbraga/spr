import { Component, ViewChild } from '@angular/core';
// import { NavController, IonicPage } from 'ionic-angular';
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions
} from '@ionic-native/camera-preview';
import chartJs from 'chart.js';
import cv from 'opencv.js';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})

export class HomePage {
  @ViewChild('lineCanvas') lineCanvas;
  
  picture: string; // imagem
  lineChart: any; // grafico

  cameraOpts: CameraPreviewOptions = {
    x: 0,
    y: 0,
    height: 100,
    width: 100,
    toBack: false,
    previewDrag: true,
  };

  cameraPictureOpts: CameraPreviewPictureOptions = {
    width: 50,
    height: 50,
    quality: 10
  };

  constructor(private cameraPreview: CameraPreview) {}

  // =================== funcoes inciais ================

  ngAfterViewInit(){
    this.lineChart = this.getLineChart();
  }

  ionViewDidLoad() {
    this.startCamera(); // incia junto com o app
    // this.lineChart.data
  }

  // =================== graficos ================
  
  getChart(context, chartType, data, options?) {
    return new chartJs(context, {
      data,
      options,
      type: chartType
    })
  }
  
  getLineChart(){
    const data = {
      labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril'],
      datasets: [{
        label: 'Curva SPR',
        fill: false,
        lineTension: 0.1,
        backgroundColor: 'rgb(0, 0, 255)',
        borderColor: 'rgb(255, 0, 0)',
        borderCapStyle: 'butt',
        borderJoinStyle: 'miter',
        pointRadius: 5,
        pointHitRadius: 10,
        data:[20, 15, 98, 4],
        scanGaps: false,
      }]
    }
    return this.getChart(this.lineCanvas.nativeElement, 'line', data)
  }

  // =================== camera ================

  async startCamera() { // inicia a camera
    this.picture = null;
    const result = await this.cameraPreview.startCamera(this.cameraOpts).then(
      (res) => {
        console.log("certo");
        console.log(res)
      },
      (err) => {
        console.log("erro");
        console.log(err)
      });
    console.log(result);
  }

  switchCamera() {
    this.cameraPreview.switchCamera();
  }

  async takePicture() {
    const result = await this.cameraPreview.takePicture(this.cameraPictureOpts);
    // await this.cameraPreview.stopCamera();
    // this.picture = result;
    this.picture = 'data:image/jpeg;base64,' + result; // convertendo a imagem em data string jpeg
    // console.log(this.picture);
    this.imageConvert();
  }

  imageConvert(){ // 
    console.log('chegou aqui');
    // let mat = cv.imdecode(this.picture, 0);
    // let mat = cv.data(this.picture, 0);
    let mat = cv.imdecode(this.picture,1); // tem algum demonio operando aqui
    console.log('mas nao passa daqui');
    let dst = new cv.Mat();
    let dst2 = new cv.Mat();
    let rect = new cv.Rect(0, 0, mat.rows , mat.cols/4);
    
    cv.cvtColor(mat, dst, cv.COLOR_RGBA2GRAY, 0);
    dst2 = dst.roi(rect);
    let m = [[]]
    for ( let i = 0; i < dst2.rows; i++){
        for ( let j = 0; j < dst2.cols; j++){
          m[i][j] = dst2.ucharPtr(i,j) // matriz aqui
        }
    }
    console.log(m);

    mat.delete();
    dst.delete();
    rect.delete();
    dst2.delete();
  }

  transform(m){ // devera, num futuro distante, aplicar o fft
    let src = cv.imread('canvasInput');
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);

    // get optimal size of DFT
    let optimalRows = cv.getOptimalDFTSize(src.rows);
    let optimalCols = cv.getOptimalDFTSize(src.cols);
    let s0 = cv.Scalar.all(0);
    let padded = new cv.Mat();
    cv.copyMakeBorder(src, padded, 0, optimalRows - src.rows, 0,
                      optimalCols - src.cols, cv.BORDER_CONSTANT, s0);

    // use cv.MatVector to distribute space for real part and imaginary part
    let plane0 = new cv.Mat();
    padded.convertTo(plane0, cv.CV_32F);
    let planes = new cv.MatVector();
    let complexI = new cv.Mat();
    let plane1 = new cv.Mat.zeros(padded.rows, padded.cols, cv.CV_32F);
    planes.push_back(plane0);
    planes.push_back(plane1);
    cv.merge(planes, complexI);

    // in-place dft transform
    cv.dft(complexI, complexI);

    // compute log(1 + sqrt(Re(DFT(img))**2 + Im(DFT(img))**2))
    cv.split(complexI, planes);
    cv.magnitude(planes.get(0), planes.get(1), planes.get(0));
    let mag = planes.get(0);
    let m1 = new cv.Mat.ones(mag.rows, mag.cols, mag.type());
    cv.add(mag, m1, mag);
    cv.log(mag, mag);

    // crop the spectrum, if it has an odd number of rows or columns
    let rect = new cv.Rect(0, 0, mag.cols & -2, mag.rows & -2);
    mag = mag.roi(rect);

    // rearrange the quadrants of Fourier image
    // so that the origin is at the image center
    let cx = mag.cols / 2;
    let cy = mag.rows / 2;
    let tmp = new cv.Mat();

    let rect0 = new cv.Rect(0, 0, cx, cy);
    let rect1 = new cv.Rect(cx, 0, cx, cy);
    let rect2 = new cv.Rect(0, cy, cx, cy);
    let rect3 = new cv.Rect(cx, cy, cx, cy);

    let q0 = mag.roi(rect0);
    let q1 = mag.roi(rect1);
    let q2 = mag.roi(rect2);
    let q3 = mag.roi(rect3);

    // exchange 1 and 4 quadrants
    q0.copyTo(tmp);
    q3.copyTo(q0);
    tmp.copyTo(q3);

    // exchange 2 and 3 quadrants
    q1.copyTo(tmp);
    q2.copyTo(q1);
    tmp.copyTo(q2);

    // The pixel value of cv.CV_32S type image ranges from 0 to 1.
    cv.normalize(mag, mag, 0, 1, cv.NORM_MINMAX);

    cv.imshow('canvasOutput', mag);
    src.delete(); padded.delete(); planes.delete(); complexI.delete(); m1.delete(); tmp.delete();
  }
}
