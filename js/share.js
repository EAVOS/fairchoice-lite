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
        
        var webApp = utils.getWebApp();
        
        // Открываем выбор чата через Telegram
        try {
            // Используем switchInlineQuery для выбора чата
            webApp.switchInlineQuery('send_poll_' + pollId, ['users', 'groups', 'channels']);
            
            utils.showSuccess('📤 Выберите чат для отправки виджета');
            
            // Ждём возврата (пользователь выбрал чат)
            // Результат придёт через sendData
        } catch(e) {
            utils.showError('Не удалось открыть выбор чата');
        }
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
        
        var sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var resultsText = sorted.map(function(entry, index) {
            return medals[index] + ' ' + currentPoll.options[parseInt(entry[0])] + ' — ' + entry[1] + ' очков';
        }).join('\n');
        
        var shareText = '🏆 ' + currentPoll.question + '\n\n' + resultsText + 
            '\n\n👥 ' + (currentPoll.totalVoters || 0) + ' участников';
        
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        
        try {
            utils.getWebApp().openTelegramLink(shareUrl);
        } catch(e) {
            try {
                utils.getWebApp().openLink(shareUrl);
            } catch(e2) {
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
