import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  vibration_status:boolean = true;
  history_scores:Array<any> = [];

  constructor(public navCtrl: NavController,private storage:Storage,private events:Events) {
    this.events.subscribe('historyRefresh',()=>{
      this.storage.get('history_scores').then(data=>{
        this.history_scores = data || [];
      });
    });
  }

  ionViewDidLoad() {
    this.storage.get('vibration_status').then(data=>{
      if(data!=null) {
        this.vibration_status = data;
      }
    });
    this.storage.get('history_scores').then(data=>{
      this.history_scores = data || [];
    });
  }

  openPage():void {
    this.navCtrl.push('GamePage');
  }

  changeEvent():void {
    this.storage.set('vibration_status',this.vibration_status);
  }

  
}
