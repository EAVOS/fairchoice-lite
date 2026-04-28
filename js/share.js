// Шеринг
window.FC_SHARE = (function() {
    var utils = window.FC_UTILS;
    var config = window.FC_CONFIG;
    var poll = window.FC_POLL;
    
    function shareToChat() {
        var pollId = poll.getCurrentPollId();
        var currentPoll = poll.getCurrentPoll();
        
        if (!pollId || !currentPoll) {
            utils.showError('Ошибка: опрос не создан');
            return;
        }
        
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        
        var shareText = '📊 ' + currentPoll.question + '\n\n' +
            '📝 Варианты:\n' + currentPoll.options.map(function(o, i) { 
                return (i+1) + '. ' + o; 
            }).join('\n') + '\n\n' +
            'Голосуй: ' + voteUrl;
        
        // Открываем Telegram Share
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        
        try {
            utils.getWebApp().openTelegramLink(shareUrl);
            utils.showSuccess('📤 Выберите чат для отправки');
        } catch(e) {
            try {
                utils.getWebApp().openLink(shareUrl);
            } catch(e2) {
                copyText(shareText);
            }
        }
    }
    
    function copyLink() {
        var pollId = poll.getCurrentPollId();
        if (!pollId) return;
        copyText(config.WEBAPP_URL + '?poll=' + pollId);
    }
    
    function shareResults() {
        var currentPoll = poll.getCurrentPoll();
        if (!currentPoll) return;
        
        var pollId = poll.getCurrentPollId();
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        
        var sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var resultsText = sorted.map(function(entry, index) {
            return medals[index] + ' ' + currentPoll.options[parseInt(entry[0])] + ' — ' + entry[1] + ' очков';
        }).join('\n');
        
        var shareText = '🏆 ' + currentPoll.question + '\n\n' + resultsText + 
            '\n\n👥 ' + (currentPoll.totalVoters || 0) + ' участников\n\nГолосовать: ' + voteUrl;
        
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        
        try {
            utils.getWebApp().openTelegramLink(shareUrl);
        } catch(e) {
            try {
                utils.getWebApp().openLink(shareUrl);
            } catch(e2) {
                copyText(shareText);
            }
        }
    }
    
    function copyText(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    utils.showSuccess('📋 Текст скопирован! Отправьте в чат.');
                });
            } else {
                fallbackCopy(text);
            }
        } catch(e) {
            fallbackCopy(text);
        }
    }
    
    function fallbackCopy(text) {
        utils.showSuccess('📋 Ссылка: ' + config.WEBAPP_URL + '?poll=' + poll.getCurrentPollId());
    }
    
    return {
        shareToChat: shareToChat,
        copyLink: copyLink,
        shareResults: shareResults
    };
})();
