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
            currentPoll.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('\n') + '\n\n' +
            '👉 Голосовать: ' + voteUrl;
        
        var isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        
        if (isMobile) {
            var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
            var webApp = utils.getWebApp();
            if (webApp && webApp.openTelegramLink) {
                webApp.openTelegramLink(shareUrl);
            }
            utils.showSuccess('📤 Выберите чат для отправки');
        } else {
            copyToClipboard(shareText);
            utils.showSuccess('📋 Текст скопирован! Вставьте в чат (Ctrl+V)');
        }
    }
    
    function copyLink() {
        var pollId = poll.getCurrentPollId();
        var currentPoll = poll.getCurrentPoll();
        if (!pollId || !currentPoll) return;
        
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        var shareText = '📊 ' + currentPoll.question + '\n\n' +
            currentPoll.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('\n') + '\n\n' +
            '👉 Голосовать: ' + voteUrl;
        
        copyToClipboard(shareText);
        utils.showSuccess('📋 Ссылка скопирована!');
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
        
        copyToClipboard(shareText);
        
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText);
        var webApp = utils.getWebApp();
        if (webApp && webApp.openTelegramLink) {
            webApp.openTelegramLink(shareUrl);
        }
    }
    
    function publishToChannel() {
        var currentPoll = poll.getCurrentPoll();
        if (!currentPoll) return;
        
        var pollId = poll.getCurrentPollId();
        var voteUrl = config.WEBAPP_URL + '?poll=' + pollId;
        
        var sorted = Object.entries(currentPoll.scores || {}).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        var resultsText = sorted.map(function(entry, index) {
            return medals[index] + ' ' + currentPoll.options[parseInt(entry[0])] + ' — ' + entry[1] + ' очков';
        }).join('\n');
        
        // Пробуем получить username
        var username = 'анонимно';
        try {
            var webApp = utils.getWebApp();
            if (webApp.initDataUnsafe && webApp.initDataUnsafe.user && webApp.initDataUnsafe.user.username) {
                username = '@' + webApp.initDataUnsafe.user.username;
            }
        } catch(e) {}
        
        var shareText = '🏆 Результаты опроса\n\n' +
            '📊 ' + currentPoll.question + '\n\n' +
            resultsText + '\n\n' +
            '👥 Проголосовало: ' + (currentPoll.totalVoters || 0) + '\n' +
            '✍️ Автор: ' + username + '\n\n' +
            'Создай свой опрос: @FairChoiceBot';
        
        var shareUrl = 'https://t.me/share/url?text=' + encodeURIComponent(shareText) + 
            '&url=' + encodeURIComponent(voteUrl);
        
        try {
            utils.getWebApp().openTelegramLink(shareUrl);
        } catch(e) {
            try {
                utils.getWebApp().openLink(shareUrl);
            } catch(e2) {
                try {
                    navigator.clipboard.writeText(shareText);
                    utils.showSuccess('📋 Текст скопирован! Отправьте в @FairChoiceLab');
                } catch(e3) {}
            }
        }
    }
    
    function copyToClipboard(text) {
        try {
            navigator.clipboard.writeText(text);
        } catch(e) {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
    
    return {
        shareToChat: shareToChat,
        copyLink: copyLink,
        shareResults: shareResults,
        publishToChannel: publishToChannel
    };
})();
