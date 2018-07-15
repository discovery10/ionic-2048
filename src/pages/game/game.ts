import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { Vibration } from '@ionic-native/vibration';

/**
 * Generated class for the GamePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-game',
  templateUrl: 'game.html',
})
export class GamePage {
  @ViewChild("gameCanvas") gameCanvas:ElementRef;
  @ViewChild("gameContainer") gameContainer:ElementRef;
  @ViewChild("tip") tip:ElementRef;
  box_size:number = 100;
  box_space:number = 10;
  box_radius:number = 5;
  box_font_size:number = 55;
  box_font_size_min:number = 40;
	num_array = [];
	lock_array = [];
	zoom_box = [];
	zoom_flag;
	move_box = [];
	show_array = [];
	move_flag;
  game_status:boolean = true;
  gameCtx:any;
  startx:number = 0;
  starty:number = 0;

  endx:number = 0;
  endy:number = 0;
  score:number = 0;
  maxScore:number = 0;
  tipStr:string = '';
  target_score:number = 2048;
  vibration_status:boolean = true;

  constructor(public navCtrl: NavController, public navParams: NavParams, private renderer:Renderer2, private storage:Storage,
    private vibration: Vibration, private alertCtrl:AlertController, private events:Events) {
  }

  ionViewDidLoad() {
    //console.log('width:'+window.screen.width+'\theight:'+window.screen.height);
    if(window.screen.width<360) {
      this.box_size = 70;
      this.box_space = 5;
    } else if(window.screen.width>=360 && window.screen.width<430) {
      this.box_size = 80;
      this.box_space = 5;
    }
    if(window.screen.width<430) {
      this.box_font_size = 35;
		  this.box_font_size_min = 25;
    }
    this.gameCtx = this.gameCanvas.nativeElement.getContext('2d');
    this.init();
    this.game_status = true;
    this.storage.get('vibration_status').then(data=>{
      if(data!=null) {
        this.vibration_status = data;
      }
    });
    this.storage.get('num_data').then(data => {
      if(data) {
        this.num_array = data['num_array'] || [];
        this.score = data['score'] || 0;
        this.target_score = data['target_score'] || 2048;
        this.drawGamePanel();
      } else {
        this.startGame();
      }
    });
  }

  saveNumData():void {
    this.storage.set('num_data',{
      'num_array' : this.num_array,
      'score' : this.score,
      'target_score' : this.target_score
    });
  }

  init():void {
    this.renderer.setStyle(this.gameContainer.nativeElement,'width',(this.box_size*4+this.box_space*3)+'px');
    this.renderer.setAttribute(this.gameCanvas.nativeElement,'width',(this.box_size*4+this.box_space*3)+'');
    this.renderer.setAttribute(this.gameCanvas.nativeElement,'height',(this.box_size*4+this.box_space*3)+'');
	  this.drawGameBaseBox();
  }

  startGame():void {
    this.game_status = true;
    this.initNumArray();
    this.drawGamePanel();
    this.genNum();
    this.genNum();
    this.zoomBox();
  }

  drawGameBaseBox():void {
    this.gameCtx.fillStyle = '#ccc0b3';
    for(let row=0;row<4;row++) {
      for(let col=0;col<4;col++) {
        this.gameCtx.beginPath();
        this.drawPathRadius(col*(this.box_size+this.box_space),row*(this.box_size+this.box_space),this.box_size,this.box_size,this.box_radius);
        this.gameCtx.closePath();
			  this.gameCtx.fill();
      }
    }
  }

  drawPathRadius(x,y,width,height,radius):void {
    this.gameCtx.moveTo(x+radius,y);
	  this.gameCtx.lineTo(x+width-radius,y);
	  this.gameCtx.arcTo(x+width,y,x+width,y+radius,radius);
	  this.gameCtx.lineTo(x+width,y+height-radius);
	  this.gameCtx.arcTo(x+width,y+height,x+width-radius,y+height,radius);
	  this.gameCtx.lineTo(x+radius,y+height);
	  this.gameCtx.arcTo(x,y+height,x,y+height-radius,radius);
	  this.gameCtx.lineTo(x,y+radius);
	  this.gameCtx.arcTo(x,y,x+radius,y,radius);
  }

  drawGamePanel():void {
    this.gameCtx.clearRect(0,0,this.gameCanvas.nativeElement.width,this.gameCanvas.nativeElement.height);
	  this.drawGameBaseBox();
    for(let row=0;row<4;row++) {
      for(let col=0;col<4;col++) {
        if(this.num_array[row][col]>0) {
          this.drawGameBox(this.num_array[row][col],col*(this.box_size+this.box_space),row*(this.box_size+this.box_space));
        }
      }
    }
  }

  drawGameBox(num,x,y):void {
    this.gameCtx.fillStyle = this.getColor(num);
    this.gameCtx.beginPath();
    this.drawPathRadius(x,y,this.box_size,this.box_size,this.box_radius);
    this.gameCtx.closePath();
    this.gameCtx.fill();
    this.gameCtx.fillStyle = '#776e65';
    this.gameCtx.font = (num<1024 ? this.box_font_size : this.box_font_size_min)+'px Arial';
    this.gameCtx.textAlign = 'center';
    this.gameCtx.textBaseline = 'middle';
    this.gameCtx.fillText(num,x+this.box_size/2,y+this.box_size/2);
  }

  drawShowArray():void {
    this.gameCtx.clearRect(0,0,this.gameCanvas.nativeElement.width,this.gameCanvas.nativeElement.height);
    this.drawGameBaseBox();
    for(let row=0;row<4;row++) {
      for(let col=0;col<4;col++) {
        if(this.show_array[row][col]>0) {
          this.drawGameBox(this.show_array[row][col],col*(this.box_size+this.box_space),row*(this.box_size+this.box_space));
        }
      }
    }
  }

  getColor(num):string {
    switch(num){
      case 2:return"#eee4da";
      case 4:return"#ede0c8";
      case 8:return"#f2b179";
      case 16:return"#f59563";
      case 32:return"#f67e5f";
      case 64:return"#f65e3b";
      case 128:return"#edcf72";
      case 256:return"#edcc61";
      case 512:return"#9c0";
      case 1024:return"#33b5e5";
      case 2048:return"#09c";
      case 4096:return"#eec22e";
      case 8192:return"#93c";
      case 16384:return"#99ccff";
      case 32768:return"#008B45";
      case 65536:return"#1E90FF";
    }
    return "black";
  }

  initNumArray():void {
    for(let row=0;row<4;row++) {
      this.num_array[row] = [];
      for(let col=0;col<4;col++) {
        this.num_array[row][col] = 0;
      }
    }
  }

  initLockArray():void {
    for(let row=0;row<4;row++) {
      this.lock_array[row] = [];
      for(let col=0;col<4;col++) {
        this.lock_array[row][col] = 0;
      }
    }
  }

  copyShowArray():void {
    for(let row=0;row<4;row++) {
      this.show_array[row] = [];
      for(let col=0;col<4;col++) {
        this.show_array[row][col] = this.num_array[row][col];
      }
    }
  }

  genNum():void {
    var row = -1;
    var col = -1;
    var cnt = 0;
    do {
      if((++cnt)>20) {
        var r = false;
        for(var m=0;m<4;m++) {
          for(var n=0;n<4;n++) {
            if(this.num_array[m][n]==0) {
              row = m;
              col = n;
              r = true;
              break;
            }
          }
          if(r) {
            break;
          }
        }
        break;
      }
      var index = Math.floor(Math.random()*16);
      row = Math.floor(index/4);
      col = index%4;
    } while(this.num_array[row][col]>0);
    var num = Math.random()<0.9 ? 2 : 4;
    this.num_array[row][col] = num;
    this.saveNumData();
    this.zoom_box.push({
      complete : 0,
      size : 10,
      color : this.getColor(num),
      x : col*(this.box_size+this.box_space),
      y : row*(this.box_size+this.box_space)
    });
  }

  zoomBox():void {
    var zoomBox_animate = () => {
      var complete_cnt = 0;
      for(var i=0;i<this.zoom_box.length;i++) {
        var box = this.zoom_box[i];
        if(box.complete==0) {
          if(box.size<this.box_size) {
            box.size+=10;
            var x = box.x+(this.box_size/2-box.size/2);
            var y = box.y+(this.box_size/2-box.size/2);
            this.gameCtx.fillStyle = box.color;
            this.gameCtx.beginPath();
            this.drawPathRadius(x,y,box.size,box.size,this.box_radius);
            this.gameCtx.closePath();
            this.gameCtx.fill();
          } else {
            box.complete = 1;
          }
        } else {
          complete_cnt++;
        }
      }
      if(complete_cnt==this.zoom_box.length) {
        cancelAnimationFrame(this.zoom_flag);
        this.zoom_box = [];
        this.drawGamePanel();
      } else {
        this.zoom_flag = requestAnimationFrame(zoomBox_animate);
      }
    }
    if(this.zoom_box.length>0) {
      zoomBox_animate();
    }
  }

  moveBox():void {
    var moveBox_animate = () => {
      var complete_cnt = 0;
      var arr = [];
      for(let i=0;i<this.move_box.length;i++) {
        var box = this.move_box[i];
        if(box.complete==0) {
          if(box.direction=='left') {
            if(box.current_x>box.target_x) {
              box.current_x-=box.speed;
              arr.push({num:box.num,x:box.current_x,y:box.current_y});
            } else {
              box.complete = 1;
            }
          } else if(box.direction=='top') {
            if(box.current_y>box.target_y) {
              box.current_y-=box.speed;
              arr.push({num:box.num,x:box.current_x,y:box.current_y});
            } else {
              box.complete = 1;
            }
          } else if(box.direction=='right') {
            if(box.current_x<box.target_x) {
              box.current_x+=box.speed;
              arr.push({num:box.num,x:box.current_x,y:box.current_y});
            } else {
              box.complete = 1;
            }
          } else if(box.direction=='bottom') {
            if(box.current_y<box.target_y) {
              box.current_y+=box.speed;
              arr.push({num:box.num,x:box.current_x,y:box.current_y});
            } else {
              box.complete = 1;
            }
          }
        } else {
          complete_cnt++;
        }
      }
      if(arr.length>0) {
        this.drawShowArray();
        for(let i=0;i<arr.length;i++) {
          this.drawGameBox(arr[i].num,arr[i].x,arr[i].y);
        }
      }
      if(complete_cnt==this.move_box.length) {
        cancelAnimationFrame(this.move_flag);
        this.move_box = [];
        this.gameCtx.clearRect(0,0,this.gameCanvas.nativeElement.width,this.gameCanvas.nativeElement.height);
        this.drawGameBaseBox();
        this.drawGamePanel();
        this.genNum();
        this.zoomBox();
      } else {
        this.move_flag = requestAnimationFrame(moveBox_animate);
      }
    }
    if(this.move_box.length>0) {
      moveBox_animate();
    }
  }

  isMoveLeft():boolean {
    var is_move = false;
    for(var row=0;row<4;row++) {
      for(var col=1;col<4;col++) {
        if(this.num_array[row][col]>0) {
          for(var index=col-1;index>=0;index--) {
            if(this.num_array[row][index]==0) {
              is_move = true;
              break;
            } else if(this.num_array[row][col]==this.num_array[row][index]) {
              is_move = true;
              break;
            } else {
              break;
            }
          }
        }
        if(is_move) {
          break;
        }
      }
      if(is_move) {
        break;
      }
    }
    return is_move;
  }

  isMoveTop():boolean {
    var is_move = false;
    for(var col=0;col<4;col++) {
      for(var row=1;row<4;row++) {
        if(this.num_array[row][col]>0) {
          for(var index=row-1;index>=0;index--) {
            if(this.num_array[index][col]==0) {
              is_move = true;
              break;
            } else if(this.num_array[row][col]==this.num_array[index][col]) {
              is_move = true;
              break;
            } else {
              break;
            }
          }
        }
        if(is_move) {
          break;
        }
      }
      if(is_move) {
        break;
      }
    }
    return is_move;
  }

  isMoveRight():boolean {
    var is_move = false;
    for(var row=0;row<4;row++) {
      for(var col=2;col>=0;col--) {
        if(this.num_array[row][col]>0) {
          for(var index=col+1;index<4;index++) {
            if(this.num_array[row][index]==0) {
              is_move = true;
              break;
            } else if(this.num_array[row][col]==this.num_array[row][index]) {
              is_move = true;
              break;
            } else {
              break;
            }
          }
        }
        if(is_move) {
          break;
        }
      }
      if(is_move) {
        break;
      }
    }
    return is_move;
  }

  isMoveBottom():boolean {
    var is_move = false;
    for(var col=0;col<4;col++) {
      for(var row=2;row>=0;row--) {
        if(this.num_array[row][col]>0) {
          for(var index=row+1;index<4;index++) {
            if(this.num_array[index][col]==0) {
              is_move = true;
              break;
            } else if(this.num_array[row][col]==this.num_array[index][col]) {
              is_move = true;
              break;
            } else {
              break;
            }
          }
        }
        if(is_move) {
          break;
        }
      }
      if(is_move) {
        break;
      }
    }
    return is_move;
  }

  moveLeft():void {
    this.initLockArray();
    var add_score = 0;
    this.copyShowArray();
    this.move_box = [];
    for(var row=0;row<4;row++) {
      for(var col=1;col<4;col++) {
        if(this.num_array[row][col]>0) {
          var move_step = 0;
          for(var index=col-1;index>=0;index--) {
            if(this.lock_array[row][index]==1) {
              break;
            }
            if(this.num_array[row][index]==0) {
              move_step++;
            } else if(this.num_array[row][col]==this.num_array[row][index]) {
              move_step++;
              this.lock_array[row][index] = 1;
              break;
            } else {
              break;
            }
          }
          if(move_step>0) {
            var row_target = row;
            var col_target = col-move_step;
            this.show_array[row][col] = 0;
            if(this.num_array[row_target][col_target]>0) {
              add_score+=this.num_array[row_target][col_target];
            }
            this.moveNum(row,col,row_target,col_target,'left');
          }		
        }
      }
    }
    if(this.move_box.length>0) {
      this.moveBox();
    }
    this.updateScore(add_score);
  }

  moveTop():void {
    this.initLockArray();
    var add_score = 0;
    this.copyShowArray();
    this.move_box = [];
    for(var col=0;col<4;col++) {
      for(var row=1;row<4;row++) {
        if(this.num_array[row][col]>0) {
          var move_step = 0;
          for(var index=row-1;index>=0;index--) {
            if(this.lock_array[index][col]==1) {
              break;
            }
            if(this.num_array[index][col]==0) {
              move_step++;
            } else if(this.num_array[row][col]==this.num_array[index][col]) {
              move_step++;
              this.lock_array[index][col] = 1;
              break;
            } else {
              break;
            }
          }
          if(move_step>0) {
            var row_target = row-move_step;
            var col_target = col;
            this.show_array[row][col] = 0;
            if(this.num_array[row_target][col_target]>0) {
              add_score+=this.num_array[row_target][col_target];
            }
            this.moveNum(row,col,row_target,col_target,'top');
          }	
        }
      }
    }
    if(this.move_box.length>0) {
      this.moveBox();
    }
    this.updateScore(add_score);
  }

  moveRight():void {
    this.initLockArray();
    var add_score = 0;
    this.copyShowArray();
    this.move_box = [];
    for(var row=0;row<4;row++) {
      for(var col=2;col>=0;col--) {
        if(this.num_array[row][col]>0) {
          var move_step = 0;
          for(var index=col+1;index<4;index++) {
            if(this.lock_array[row][index]==1) {
              break;
            }
            if(this.num_array[row][index]==0) {
              move_step++;
            } else if(this.num_array[row][col]==this.num_array[row][index]) {
              move_step++;
              this.lock_array[row][index] = 1;
              break;
            } else {
              break;
            }
          }
          if(move_step>0) {
            var row_target = row;
            var col_target = col+move_step;
            this.show_array[row][col] = 0;
            if(this.num_array[row_target][col_target]>0) {
              add_score+=this.num_array[row_target][col_target];
            }
            this.moveNum(row,col,row_target,col_target,'right');
          }
        }
      }
    }
    if(this.move_box.length>0) {
      this.moveBox();
    }
    this.updateScore(add_score);
  }

  moveBottom():void {
    this.initLockArray();
    var add_score = 0;
    this.copyShowArray();
    this.move_box = [];
    for(var col=0;col<4;col++) {
      for(var row=2;row>=0;row--) {
        if(this.num_array[row][col]>0) {
          var move_step = 0;
          for(var index=row+1;index<4;index++) {
            if(this.lock_array[index][col]==1) {
              break;
            }
            if(this.num_array[index][col]==0) {
              move_step++;
            } else if(this.num_array[row][col]==this.num_array[index][col]) {
              move_step++;
              this.lock_array[index][col] = 1;
              break;
            } else {
              break;
            }
          }
          if(move_step>0) {
            var row_target = row+move_step;
            var col_target = col;
            this.show_array[row][col] = 0;
            if(this.num_array[row_target][col_target]>0) {
              add_score+=this.num_array[row_target][col_target];
            }
            this.moveNum(row,col,row_target,col_target,'bottom');
          }	
        }
      }
    }
    if(this.move_box.length>0) {
      this.moveBox();
    }
    this.updateScore(add_score);
  }

  moveNum(row,col,row_target,col_target,direction):void {
    var origion = this.num_array[row][col];
    var num_target = this.num_array[row_target][col_target];
    var num = num_target+origion;
    this.num_array[row_target][col_target] = num;
    this.num_array[row][col] = 0;
    this.saveNumData();
    var speed = Math.abs((col_target*(this.box_size+this.box_space)-col*(this.box_size+this.box_space)))/4;
    if(direction=='top' || direction=='bottom') {
      speed = Math.abs((row_target*(this.box_size+this.box_space)-row*(this.box_size+this.box_space)))/4;
    }
    //console.log(speed);
    this.move_box.push({
      direction : direction,
      current_x : col*(this.box_size+this.box_space),
      current_y : row*(this.box_size+this.box_space),
      target_x : col_target*(this.box_size+this.box_space),
      target_y : row_target*(this.box_size+this.box_space),
      complete : 0,
      num : origion,
      speed : speed
    });
  }

  updateScore(num):void {
    //console.log(num);
    if(num>0) {
      this.score+=num;
      this.saveNumData();
      this.tipStr = '+'+num;
      if(this.score>this.maxScore) {
        this.maxScore = this.score;
      }
      this.renderer.setStyle(this.tip.nativeElement,'top','-50px');
      this.renderer.setStyle(this.tip.nativeElement,'opacity','0');
      setTimeout(()=>{
        this.tipStr = '';
        this.renderer.setStyle(this.tip.nativeElement,'top','0');
        this.renderer.setStyle(this.tip.nativeElement,'opacity','0.7');
      },310);
    }
  }

  touchstartEvent(e):void {
    //e.preventDefault();
    this.startx = e.touches[0].pageX;
		this.starty = e.touches[0].pageY;
  }

  touchendEvent(e):void {
    //e.preventDefault();
    this.endx = e.changedTouches[0].pageX;
    this.endy = e.changedTouches[0].pageY;

    var deltax=this.endx-this.startx;
    var deltay=this.endy-this.starty;
    var _width = 100;//window.screen.width;
    if(Math.abs(deltax)<(0.1*_width) && Math.abs(deltay)<(0.1*_width)){
      return ;
    }
    if(!this.game_status) {
      return ;
    }
    if(Math.abs(deltax)>Math.abs(deltay)) {
      if(deltax>0) {
        if(this.isMoveRight()) {
          this.moveRight();
          this.gameNextStep();
        } else {
          if(this.vibration_status) {
            this.vibration.vibrate(100);
          }
        }
      } else {
        if(this.isMoveLeft()) {
          this.moveLeft();
          this.gameNextStep();
        } else {
          if(this.vibration_status) {
            this.vibration.vibrate(100);
          }
        }
      }
    } else {
      if(deltay>0) {
        if(this.isMoveBottom()) {
          this.moveBottom();
          this.gameNextStep();
        } else {
          if(this.vibration_status) {
            this.vibration.vibrate(100);
          }
        }
      } else {
        if(this.isMoveTop()) {
          this.moveTop();
          this.gameNextStep();
        } else {
          if(this.vibration_status) {
            this.vibration.vibrate(100);
          }
        }
      }
    }
  }

  gameNextStep():void {
    setTimeout(() => {
      if(!(this.isMoveLeft() || this.isMoveTop() || this.isMoveRight() || this.isMoveBottom())) {
        this.game_status = false;
        this.score = 0;
        this.num_array = [];
        this.target_score = 2048;
        this.saveNumData();
        this.alertCtrl.create({
          title : '消息',
          subTitle : '游戏结束',
          buttons : [{
            text : '确定',
            role : 'cancel',
            handler : ()=>{
              this.startGame();
            }
          }]
        }).present();
      } else {
        var win = false;
        for(let i=0;i<4;i++) {
          for(let j=0;j<4;j++) {
            if(this.num_array[i][j]==this.target_score) {
              win = true;
              break;
            }
          }
          if(win) {
            break;
          }
        }
        if(win) {
          var history_score = this.target_score;
          this.target_score = this.target_score*2;
          this.saveNumData();
          this.storage.get('history_scores').then(data=>{
            if(data) {
              var numObj = data.find(n=>n['num']==history_score);
              if(numObj) {
                numObj['cnt'] = numObj['cnt'] + 1;
              } else {
                data.push({'num':history_score,'cnt':1});
              }
            } else {
             data = [{'num':history_score,'cnt':1}]; 
            }
            this.storage.set('history_scores',data).then(()=>this.events.publish('historyRefresh'));
          });
          this.alertCtrl.create({
            title : '消息',
            subTitle : '你赢了!您将进入'+this.target_score,
            buttons : [{
              text : '确定',
              role : 'cancel'
            }]
          }).present();
        }
      }	
    },350);
  }

  newGame():void {
    this.alertCtrl.create({
      title : '提示',
      subTitle : '您是否要重新开始游戏?',
      buttons : [{
        text : '否',
        role : 'cancel'
      },{
        text : '是',
        handler : ()=>{
          this.score = 0;
          this.num_array = [];
          this.target_score = 2048;
          this.saveNumData();
          this.startGame();
        }
      }]
    }).present();
  }

}
