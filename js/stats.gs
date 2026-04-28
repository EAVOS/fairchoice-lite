// ============== КОНФИГУРАЦИЯ ==============
var METRICS_PREFIX = 'metrics_';
var RETENTION_DAYS = 7;
var MAU_DAYS = 30;

// ============== ОБРАБОТЧИК СТАТИСТИКИ ==============
function handleStats(e, callback) {
  var stats = loadAllMetrics();
  return jsonResponse(callback, stats);
}

// ============== СОБЫТИЯ ==============
function trackPollCreated(userId, chatId) {
  var date = getToday();
  
  incrementMetric('polls_created_total');
  incrementMetric('polls_created_' + date);
  addToUniqueSet('active_chats_' + date, String(chatId || userId));
  addToUniqueSet('active_users_' + date, String(userId));
  addToUniqueSet('active_users_' + getPeriod(MAU_DAYS), String(userId));
}

function trackVote(userId) {
  var date = getToday();
  
  incrementMetric('votes_total');
  incrementMetric('votes_' + date);
  addToUniqueSet('voters_' + date, String(userId));
  addToUniqueSet('voters_' + getPeriod(MAU_DAYS), String(userId));
  trackFirstSeen(userId);
}

// ============== RETENTION ==============
function trackFirstSeen(userId) {
  var key = 'user_first_seen_' + userId;
  var existing = SCRIPT_PROP.getProperty(key);
  if (!existing) {
    SCRIPT_PROP.setProperty(key, getToday());
  }
}

function getRetention(days) {
  days = days || RETENTION_DAYS;
  var date = getDateDaysAgo(days);
  var allKeys = SCRIPT_PROP.getKeys();
  var total = 0;
  var returned = 0;
  
  allKeys.forEach(function(key) {
    if (key.startsWith('user_first_seen_')) {
      var firstSeen = SCRIPT_PROP.getProperty(key);
      if (firstSeen === date) {
        total++;
        var userId = key.replace('user_first_seen_', '');
        var votedAfter = false;
        
        allKeys.forEach(function(pollKey) {
          if (pollKey.startsWith('poll_')) {
            try {
              var poll = JSON.parse(SCRIPT_PROP.getProperty(pollKey));
              if (poll.votes[userId]) {
                votedAfter = true;
              }
            } catch(e) {}
          }
        });
        
        if (votedAfter) returned++;
      }
    }
  });
  
  return { total: total, returned: returned, rate: total > 0 ? Math.round(returned / total * 100) : 0 };
}

// ============== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==============
function getToday() {
  var d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function getPeriod(days) {
  var d = new Date();
  d.setDate(d.getDate() - days);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function getDateDaysAgo(days) {
  return getPeriod(days);
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

function incrementMetric(key) {
  var fullKey = METRICS_PREFIX + key;
  try {
    var val = parseInt(SCRIPT_PROP.getProperty(fullKey) || '0');
    SCRIPT_PROP.setProperty(fullKey, String(val + 1));
  } catch(e) {}
}

function addToUniqueSet(key, value) {
  var fullKey = METRICS_PREFIX + 'set_' + key;
  try {
    var data = SCRIPT_PROP.getProperty(fullKey) || '{}';
    var set = JSON.parse(data);
    set[value] = true;
    SCRIPT_PROP.setProperty(fullKey, JSON.stringify(set));
  } catch(e) {}
}

function getUniqueCount(key) {
  var fullKey = METRICS_PREFIX + 'set_' + key;
  try {
    var data = SCRIPT_PROP.getProperty(fullKey) || '{}';
    var set = JSON.parse(data);
    return Object.keys(set).length;
  } catch(e) { return 0; }
}

function loadAllMetrics() {
  return {
    polls_created_total: parseInt(SCRIPT_PROP.getProperty(METRICS_PREFIX + 'polls_created_total') || '0'),
    votes_total: parseInt(SCRIPT_PROP.getProperty(METRICS_PREFIX + 'votes_total') || '0'),
    today: {
      polls: parseInt(SCRIPT_PROP.getProperty(METRICS_PREFIX + 'polls_created_' + getToday()) || '0'),
      votes: parseInt(SCRIPT_PROP.getProperty(METRICS_PREFIX + 'votes_' + getToday()) || '0'),
      active_chats: getUniqueCount('active_chats_' + getToday()),
      voters: getUniqueCount('voters_' + getToday())
    },
    mau: getUniqueCount('active_users_' + getPeriod(MAU_DAYS)),
    retention_7d: getRetention(7)
  };
}

// Старые функции (для совместимости)
function loadStats() {
  return loadAllMetrics();
}

function incrementStats(key) {
  incrementMetric(key);
}

function testTracking() {
  trackPollCreated('8713643361', '8713643361');
  trackVote('8713643361');
  Logger.log(loadAllMetrics());
}
