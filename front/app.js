$( document ).ready(() => {
    // API requests
    fetch('https://sourscar.herokuapp.com/admin', {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => response.text())
    .then(function(data){
      if(data != 'Login'){
        window.location.href = 'index.html';
      }
    });
    // Socket io
    const socket = io();
    const timeLabel = $("#timer-label");
    const timeLeft = $("#time-left");
    const timeIn = $("#time-in");
    const breakLength = $("#break-length");
    const sessionLength = $("#session-length");
    const beep = $("#beep");
    const counterStartBeep = $("#counter-start-beep");
    const counter60Beep = $("#counter-60-beep");
    const counter30Beep = $("#counter-30-beep");
    const counter15Beep = $("#counter-15-beep");
    const counter5Beep = $("#counter-5-beep");
    
    const btnStop = $("#stop");
    const btnStartPause = $("#start_stop");
    const btnReset = $("#reset");
  
    const btnBreakIncrement = $("#break-increment");
    const btnBreakDecrement = $("#break-decrement");
    const btnSessionIncrement = $("#session-increment");
    const btnSessionDecrement = $("#session-decrement");
  
    const SETTING_MODE = {
      INCREMENT: "INCREMENT",
      DECREMENT: "DECREMENT"
    }
  
    const MODE = {
      BREAK:"Break Time",
      SESSION:"Session Time"
    }
  
    let currentMode = MODE.SESSION;
    let countDownInterval = null;
  
    // Break Length Setting
    btnBreakIncrement.click(() => {
      setTimeLength(breakLength, SETTING_MODE.INCREMENT);
    })
  
    btnBreakDecrement.click(() => {
      setTimeLength(breakLength, SETTING_MODE.DECREMENT);
    })
  
    // Session Length Setting
    btnSessionIncrement.click(() => {
      setTimeLength(sessionLength, SETTING_MODE.INCREMENT);
  
      if (isClockRunning()) {
        return;
      }
      setTimer(sessionLength.text(), 0);
    })
  
    btnSessionDecrement.click(() => {
      setTimeLength(sessionLength, SETTING_MODE.DECREMENT);
  
      if (isClockRunning()) {
        return;
      }
      setTimer(sessionLength.text(), 0);
    })
  
    // Button Reset
    btnReset.click(() => {
      if (isClockRunning()) {
        btnStartPause.removeClass("active");
        clearInterval(countDownInterval);
      }
  
      beep.trigger("pause");
      beep.prop("currentTime",0);
  
      currentMode = MODE.SESSION;
      timeLabel.text(MODE.SESSION);
      breakLength.text(5);
      sessionLength.text(62);
      setTimer(62, 0);
    });
  
    // Button Stop
    btnStop.click(() => {
      socket.emit('stop');
      if (isClockRunning()) {
        btnStartPause.removeClass("active");
        clearInterval(countDownInterval);
      }
  
      beep.trigger("pause");
      beep.prop("currentTime",0);
  
      if (currentMode === MODE.BREAK) {
        setTimer(breakLength.text(), 0);
      } else {
        setTimer(sessionLength.text(), 0);
      }
    });

    // Button Start/Pause
    btnStartPause.click(() => {
      if (isClockRunning()) {
        socket.emit('paused');
        clearInterval(countDownInterval);
        btnStartPause.removeClass("active");
        return;
      } else {
        socket.emit('clicked');
        btnStartPause.addClass("active");
      }
      
      countDownInterval = setInterval(() => {
        const time = timeLeft.text().split(":")
        let min = parseInt(time[0]);
        let sec = parseInt(time[1]);
        
        // Counter Start Beep
        if (sec === 4 && min === 60) {
            counter60Beep.trigger("play");
        }
        if (sec === 59 && min === 61) {
            counterStartBeep.trigger("play");
        }
        if (sec === 2 && min === 30) {
            counter30Beep.trigger("play");
        }
        if (sec === 3 && min === 15) {
            counter15Beep.trigger("play");
        }
        if (sec === 6 && min === 5) {
            counter5Beep.trigger("play");
        }
        if (sec === 5 && min === 0) {
            beep.trigger("play");
        }

        if (sec === 0) {
          if (min <= 0) {
            currentMode = MODE.SESSION;
            timeLeft.hide();
            timeIn.show();
            return
          } else {
            sec = 59;
            min--
          }
        } else {
          sec--;
        }
  
        setTimer(min, sec);
        if(min >= 60){
          $("#time-left").css("color", "#3C7A7A");
        }else{
          $("#time-left").css("color", "red");
          if(min == 0 && sec == 0){
          }
        }
        if(min <= 0 && sec <= 0){
          localStorage.setItem("timer", 00+'-'+00)
          socket.emit('timer', 00+'-'+00);
        }else{
          localStorage.setItem("timer", min+'-'+sec)
          socket.emit('timer', min+'-'+sec);
        }
      }, 1000);
    });
    const setTimeLength = (element, mode) => {
      const currentValue = parseInt(element.text());
  
      if (isClockRunning()) {
        return;
      }
  
      if (mode === SETTING_MODE.INCREMENT && currentValue < 65) {
        element.text(currentValue + 1);
      } else if (mode === SETTING_MODE.DECREMENT && currentValue > 1) {
        element.text(currentValue - 1);
      }
    }
  
    const isClockRunning = () => {
      return btnStartPause.hasClass("active");
    }
  
    const addLeadingZero = (value) => {
      const newValue = value.toString();
      return newValue.length === 1? `0${newValue}` : newValue; 
    }
  
    const setTimer = (min, sec) => {
      const newMin = addLeadingZero(min);
      const newSec = addLeadingZero(sec);
      timeLeft.text(`${newMin}:${newSec}`);
    }
  
    // Initialize Value
    if(localStorage.length != 0){
      const time = localStorage.getItem("timer").split("-")
      if(time[0] >= 60){
        $("#time-left").css("color", "#3C7A7A");
      }else{
        $("#time-left").css("color", "red");
        if(min == 0 && sec == 0){
        }
      }
      setTimer(time[0], time[1]);
    }else{
      $("#time-left").css("color", "#3C7A7A");
      setTimer(62, 0);
    }
    breakLength.text('5');
    sessionLength.text('62');
    timeLeft.show();
    timeIn.hide();
});
