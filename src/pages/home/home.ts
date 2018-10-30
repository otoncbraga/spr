import { Component, ViewChild } from '@angular/core';
import { NavController, IonicPage } from 'ionic-angular';
import {
  CameraPreview,
  CameraPreviewOptions,
  CameraPreviewPictureOptions
} from '@ionic-native/camera-preview';
// import { Camera, CameraOptions } from '@ionic-native/camera';
import chartJs from 'chart.js';
// import cv from 'opencv.js';

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
    toBack: true,
    previewDrag: false,
  };

  cameraPictureOpts: CameraPreviewPictureOptions = {
    width: 50,
    height: 50,
    quality: 10
  };

  // options: CameraOptions = {
  //   quality: 100,
  //   destinationType: this.camera.DestinationType.FILE_URI,
  //   encodingType: this.camera.EncodingType.JPEG,
  //   mediaType: this.camera.MediaType.PICTURE
  // }

  constructor(private cameraPreview: CameraPreview) {}
  // constructor(private camera: Camera) { }

  // =================== funcoes inciais ================

  ngAfterViewInit(){
    this.lineChart = this.getLineChart();
    // this.takePicture();
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
    this.cameraPreview.startCamera(this.cameraOpts).then(
      (res) => {
        console.log(res)
        this.takePicture(); // tira foto assim que camera estiver pronto
      },
      (err) => {
        console.log(err)
      });
  }

  async takePicture() {
    this.cameraPreview.takePicture(this.cameraPictureOpts).then(
      (res) => {
        // await this.cameraPreview.stopCamera();
        this.picture = 'data:image/jpeg;base64,' + res; // convertendo a imagem em data string jpeg
        // console.log(this.picture);
        this.takePicture(); // chama recursivamente
        this.takePicture(); // tira foto assim que camera estiver pronto
      },
      (err) => {
        console.log(err)
      });
  }
}