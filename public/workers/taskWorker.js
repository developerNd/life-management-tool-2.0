self.onmessage = function(e) {
  const { type, data } = e.data;
  switch (type) {
    // ... (existing cases)
    case 'SYNC_TIMER':
      // Sync the worker's state with the component's state
      syncTimer(data);
      break;
  }
};

function syncTimer(data) {
  // Update the worker's internal state based on the data
  // Then immediately send an update back to the component
  self.postMessage({
    type: 'TIMER_UPDATE',
    data: {
      taskId: data.taskId,
      isUsingPomodoro: data.isUsingPomodoro,
      remainingTime: calculateRemainingTime(data),
      currentSittingTime: calculateCurrentSittingTime(data),
      isBreak: data.pomodoroSettings.isBreak,
    },
  });
}

// Helper functions to calculate remaining time and current sitting time
function calculateRemainingTime(data) {
  // Implement this based on your timer logic
}

function calculateCurrentSittingTime(data) {
  // Implement this based on your timer logic
}

// ... (rest of the worker code)