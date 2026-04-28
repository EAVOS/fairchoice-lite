// Шеринг
window.FC_SHARE = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var config = window.FC_CONFIG;
    var poll = window.FC_POLL;
    
    function shareToChat() {
        var pollId = poll.getCurrentPollId();
        if (!pollId) {
            utils.showError('Ошибка: опрос не создан');
            return;
        }
        
        utils.showLoader();
        
        api.sendToChat(pollId, function(err, data) {
            utils.showScreen('created-screen');
            
            if (err) {
                // Fallback: копируем ссылку
                api.copyPollLink(pollId);
            } else {
                utils.showSuccess('✅ Виджет отправлен в выбранный чат!');
            }
        });
    }
    
    function copyLink() {
        var pollId = poll.getCurrentPollId();
        if (!pollId) {
            utils.showError('Ошибка: опрос не создан');
            return;
        }
        api.copyPollLink(pollId);
    }
    
    function shareResults() {
        var currentPoll = poll.getCurrentPoll();
        if (!currentPoll) return;
        
        var pollId = poll.getCurrentPollId();
        var link = config.WEBAPP_URL + '?poll=' + pollId;
        
        var sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var resultsText = sorted.map(function(entry, index) {
            return medals[index] + ' ' + currentPoll.options[parseInt(entry[0])] + ' — ' + entry[1] + ' очков';
        }).join('\n');
        
        var shareText = '🏆 ' + currentPoll.question + '\n\n' + resultsText + 
            '\n\n👥 ' + (currentPoll.totalVoters || 0) + ' участников';
        
        // Пробуем поделиться результатами через Telegram
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        
        try {
            utils.getWebApp().openTelegramLink(shareUrl);
        } catch(e) {
            try {
                utils.getWebApp().openLink(shareUrl);
            } catch(e2) {
                // Копируем текст
                api.copyPollLink(pollId);
            }
        }
    }
    
    return {
        shareToChat: shareToChat,
        copyLink: copyLink,
        shareResults: shareResults
    };
})();
