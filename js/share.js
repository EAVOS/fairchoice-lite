// Шеринг
window.FC_SHARE = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var config = window.FC_CONFIG;
    var poll = window.FC_POLL;
    
    function shareToChat() {
        var pollId = poll.getCurrentPollId();
        var currentPoll = poll.getCurrentPoll();
        
        if (!pollId || !currentPoll) {
            utils.showError('Ошибка: опрос не создан');
            return;
        }
        
        utils.showLoader();
        
        // Отправляем запрос в GAS для отправки виджета через бота
        var params = new URLSearchParams({
            action: 'sendToChat',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), function(err, data) {
            utils.showScreen('created-screen');
            
            if (err || !data || data.error) {
                // Если не удалось отправить — копируем для ручной вставки
                copyWidgetToClipboard(pollId, currentPoll);
            } else {
                utils.showSuccess('✅ Виджет отправлен вам в ЛС! Перешлите его в нужный чат.');
            }
        });
    }
    
    function copyWidgetToClipboard(pollId, currentPoll) {
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        var resultsUrl = config.WEBAPP_URL + '?poll=' + pollId + '&view=results';
        
        var messageText = '📊 ' + currentPoll.question + '\n\n' +
            '📝 Варианты:\n' + currentPoll.options.map(function(o, i) { 
                return (i+1) + '. ' + o; 
            }).join('\n') + '\n\n' +
            '👥 Проголосовало: 0\n\n' +
            '🗳️ Голосовать: ' + voteUrl + '\n' +
            '📊 Результаты: ' + resultsUrl + '\n\n' +
            '📱 Создать свой опрос: @FairChoiceBot';
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(messageText).then(function() {
                utils.showSuccess('📋 Виджет скопирован! Вставьте в чат.');
            }).catch(function() {
                fallbackCopy(messageText);
            });
        } else {
            fallbackCopy(messageText);
        }
    }
    
    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            utils.showSuccess('📋 Виджет скопирован! Вставьте в чат.');
        } catch(e) {
            utils.showError('Не удалось скопировать. Отправьте вручную.');
        }
        document.body.removeChild(textarea);
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
                fallbackCopy(shareText);
            }
        }
    }
    
    return {
        shareToChat: shareToChat,
        copyLink: copyLink,
        shareResults: shareResults
    };
})();
