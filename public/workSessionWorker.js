let timer = null;
let startTime = null;
let taskId = null;
let sessionId = null;
let isUsingPomodoro = false;
let pomodoroSettings = null;
let pomodoroTime = 0;
let isBreak = false;

self.onmessage = function(e) {
  console.log('Worker received message:', e.data);
  const { type, data } = e.data;

  switch (type) {
    case 'START':
    case 'START_POMODORO':
      startTimer(data);
      break;
    case 'STOP':
      stopTimer();
      break;
  }
};

function startTimer(data) {
  console.log('Starting timer with data:', data);
  taskId = data.taskId;
  sessionId = data.sessionId;
  startTime = data.startTime;
  isUsingPomodoro = data.isUsingPomodoro;
  pomodoroSettings = data.pomodoroSettings;
  pomodoroTime = data.workTime || 0;
  isBreak = data.isBreak;

  if (timer) {
    clearInterval(timer);
  }

  function updateTimer() {
    const currentTime = Date.now() - startTime;
    
    if (isUsingPomodoro) {
      if (pomodoroTime <= 0) {
        clearInterval(timer);
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        console.log('Pomodoro complete, sending message');
        self.postMessage({ 
          type: 'POMODORO_COMPLETE', 
          data: { 
            isBreak, 
            startTime, 
            endTime,
            duration
          } 
        });
        return;
      }
      pomodoroTime--;
    }

    // Send updates every second
    self.postMessage({ 
      type: 'UPDATE', 
      data: { 
        currentTime: Math.floor(currentTime / 1000), 
        pomodoroTime,
        isBreak
      } 
    });
  }

  updateTimer(); // Call immediately to start the timer
  timer = setInterval(updateTimer, 1000);
}

function stopTimer() {
  console.log('Stopping timer');
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}