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
    
    // Мои опросы
    document.getElementById('my-polls-btn').addEventListener('click', function() {
        window.FC_POLL.loadMyPolls();
    });
    
    // Голосование
    document.getElementById('shuffle-btn').addEventListener('click', function() {
        window.FC_VOTE.shuffleOptions();
    });
    
    document.getElementById('vote-btn').addEventListener('click', function() {
        window.FC_VOTE.submitVote();
    });
    
    document.getElementById('view-results-btn').addEventListener('click', function() {
        window.FC_RESULTS.showResults();
    });
    
    // Назад к списку
    var backBtn = document.getElementById('back-to-list-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.FC_POLL.loadMyPolls();
        });
    }
    
    var backBtnResults = document.getElementById('back-to-list-btn-results');
    if (backBtnResults) {
        backBtnResults.addEventListener('click', function() {
            window.FC_POLL.loadMyPolls();
        });
    }
    
    // Созданный опрос
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
        var poll = window.FC_POLL.getCurrentPoll();
        if (!poll) return;
        document.getElementById('question-display').textContent = poll.question;
        window.FC_POLL.setCurrentOptions(poll.options.slice());
        window.FC_UI.renderRankings(poll.options);
        window.FC_UTILS.showScreen('vote-screen');
    });
    
    document.getElementById('back-home-btn').addEventListener('click', function() {
        window.FC_UTILS.showScreen('home-screen');
    });
    
    // Результаты
    document.getElementById('share-results-btn').addEventListener('click', function() {
        window.FC_SHARE.shareResults();
    });
    
    document.getElementById('refresh-results-btn').addEventListener('click', function() {
        window.FC_RESULTS.refreshResults();
    });
    
    document.getElementById('new-poll-btn').addEventListener('click', function() {
        window.location.href = window.location.pathname;
    });
    
    window.FC_POLL.checkUrlParams();
})();
