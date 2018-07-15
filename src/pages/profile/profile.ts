import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';

/**
 * Generated class for the ProfilePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage {
  vibration_status:boolean = true;
  history_scores:Array<any> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,private storage:Storage,private events:Events) {
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

  changeEvent():void {
    this.storage.set('vibration_status',this.vibration_status).then(()=>{
      this.events.publish('vibration_status:refresh');
    });
  }
}
