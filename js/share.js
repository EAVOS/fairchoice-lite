// Шеринг
window.FC_SHARE = (function() {
    var utils = window.FC_UTILS;
    var config = window.FC_CONFIG;
    var poll = window.FC_POLL;
    
    function shareToChat() {
        var pollId = poll.getCurrentPollId();
        var currentPoll = poll.getCurrentPoll();
        
        if (!pollId || !currentPoll) {
            utils.showError('Опрос не создан');
            return;
        }
        
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        
        var shareText = '📊 ' + currentPoll.question + '\n\n' +
            currentPoll.options.map(function(o, i) { 
                return (i+1) + '. ' + o; 
            }).join('\n') + '\n\n' +
            '👉 Голосовать: ' + voteUrl;
        
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        
        // Копируем в буфер как fallback
        try {
            navigator.clipboard.writeText(shareText);
        } catch(e) {}
        
        // Закрываем WebApp перед открытием шаринга
        var webApp = utils.getWebApp();
        if (webApp && webApp.close) {
            webApp.close();
        }
        
        // Открываем шаринг
        setTimeout(function() {
            window.open(shareUrl, '_blank');
        }, 300);
    }
    
    function copyLink() {
        var pollId = poll.getCurrentPollId();
        if (!pollId) return;
        
        var link = config.WEBAPP_URL + '?poll=' + pollId;
        
        try {
            navigator.clipboard.writeText(link);
            utils.showSuccess('📋 Ссылка скопирована');
        } catch(e) {
            utils.showSuccess('Ссылка: ' + link);
        }
    }
    
    function shareResults() {
        var currentPoll = poll.getCurrentPoll();
        if (!currentPoll) return;
        
        var pollId = poll.getCurrentPollId();
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        
        var sorted = Object.entries(currentPoll.scores || {}).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var resultsText = sorted.map(function(entry, index) {
            return medals[index] + ' ' + currentPoll.options[parseInt(entry[0])] + ' — ' + entry[1] + ' очков';
        }).join('\n');
        
        var shareText = '🏆 ' + currentPoll.question + '\n\n' + resultsText + 
            '\n\n👥 ' + (currentPoll.totalVoters || 0) + ' участников\n\n👉 ' + voteUrl;
        
        try {
            navigator.clipboard.writeText(shareText);
        } catch(e) {}
        
        var webApp = utils.getWebApp();
        if (webApp && webApp.close) {
            webApp.close();
        }
        
        setTimeout(function() {
            window.open('https://t.me/share/url?text=' + encodeURIComponent(shareText), '_blank');
        }, 300);
    }
    
    return {
        shareToChat: shareToChat,
        copyLink: copyLink,
        shareResults: shareResults
    };
})();
