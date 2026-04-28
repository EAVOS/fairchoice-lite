(function() {
    'use strict';
    
    var webApp;
    try {
        webApp = window.Telegram.WebApp;
        webApp.ready();
        webApp.expand();
    } catch(e) {
        webApp = null;
    }
    
    // Главный экран
    document.getElementById('create-btn').addEventListener('click', function() {
        window.FC_POLL.createPoll();
    });
    
    document.getElementById('my-polls-btn').addEventListener('click', function() {
        window.FC_POLL.loadMyPolls();
    });
    
    // Проверка админа и кнопка статистики
    var isAdmin = (window.FC_UTILS.getUserId() === '8713643361');
    var adminBtn = document.getElementById('admin-stats-btn');
    if (adminBtn && isAdmin) {
        adminBtn.style.display = 'block';
        adminBtn.addEventListener('click', function() {
            window.FC_POLL.loadAdminStats();
        });
    }
    
    // Экран голосования
    document.getElementById('shuffle-btn').addEventListener('click', function() {
        window.FC_VOTE.shuffleOptions();
    });
    
    document.getElementById('vote-btn').addEventListener('click', function() {
        window.FC_VOTE.submitVote();
    });
    
    document.getElementById('view-results-btn').addEventListener('click', function() {
        window.FC_RESULTS.showResults();
    });
    
    document.getElementById('end-poll-btn-vote').addEventListener('click', function() {
        window.FC_RESULTS.endPoll();
    });
    
    document.getElementById('back-to-list-btn').addEventListener('click', function() {
        window.FC_POLL.loadMyPolls();
    });
    
    // Экран созданного опроса
    document.getElementById('share-to-chat-btn').addEventListener('click', function() {
        window.FC_SHARE.shareToChat();
    });
    
    document.getElementById('copy-link-btn').addEventListener('click', function() {
        window.FC_SHARE.copyLink();
    });
    
    document.getElementById('end-poll-btn').addEventListener('click', function() {
        window.FC_RESULTS.endPoll();
    });
    
    document.getElementById('vote-now-btn').addEventListener('click', function() {
        var p = window.FC_POLL.getCurrentPoll();
        if (!p) return;
        document.getElementById('question-display').textContent = p.question;
        window.FC_POLL.setCurrentOptions(p.options.slice());
        window.FC_UI.renderRankings(p.options);
        window.FC_UTILS.showScreen('vote-screen');
    });
    
    document.getElementById('back-home-btn').addEventListener('click', function() {
        window.FC_UTILS.showScreen('home-screen');
    });
    
    // Экран результатов
    document.getElementById('share-results-btn').addEventListener('click', function() {
        window.FC_SHARE.shareResults();
    });
    
    document.getElementById('refresh-results-btn').addEventListener('click', function() {
        window.FC_RESULTS.refreshResults();
    });
    
    document.getElementById('end-poll-btn-results').addEventListener('click', function() {
        window.FC_RESULTS.endPoll();
    });
    
    document.getElementById('back-to-vote-btn').addEventListener('click', function() {
        var p = window.FC_POLL.getCurrentPoll();
        if (!p) return;
        document.getElementById('question-display').textContent = p.question;
        window.FC_POLL.setCurrentOptions(p.options.slice());
        window.FC_UI.renderRankings(p.options);
        window.FC_UTILS.showScreen('vote-screen');
    });
    
    document.getElementById('back-to-list-btn-results').addEventListener('click', function() {
        window.FC_POLL.loadMyPolls();
    });
    
    document.getElementById('new-poll-btn').addEventListener('click', function() {
        window.location.href = window.location.pathname;
    });
    
    // Проверка параметров URL
    window.FC_POLL.checkUrlParams();
})();
