// Работа с API
window.FC_API = (function() {
    var utils = window.FC_UTILS;
    var config = window.FC_CONFIG;
    
    // Пытаемся использовать CloudStorage если доступен
    var cloudStorage = null;
    try {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage) {
            cloudStorage = window.Telegram.WebApp.CloudStorage;
        }
    } catch(e) {}
    
    function createPoll(question, options, callback) {
        var webApp = utils.getWebApp();
        var userId = utils.getUserId();
        var chatId = '';
        var username = '';
        
        try {
            if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
                chatId = String(webApp.initDataUnsafe.user.id);
                username = webApp.initDataUnsafe.user.username || 
                          webApp.initDataUnsafe.user.first_name || 'unknown';
            }
        } catch(e) {}
        
        var params = new URLSearchParams({
            action: 'create',
            question: question,
            options: JSON.stringify(options),
            userId: userId,
            chatId: chatId,
            username: username
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), function(err, data) {
            if (!err && data && data.pollId) {
                // Сохраняем в CloudStorage если доступен
                if (cloudStorage) {
                    try {
                        cloudStorage.setItem('lastPollId', data.pollId);
                    } catch(e) {}
                }
            }
            callback(err, data);
        });
    }
    
    function submitVote(pollId, rankings, callback) {
        var params = new URLSearchParams({
            action: 'vote',
            pollId: pollId,
            userId: utils.getUserId(),
            rankings: JSON.stringify(rankings)
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), callback);
    }
    
    function getPoll(pollId, callback) {
        utils.jsonp(config.GAS_URL + '?action=getPoll&pollId=' + pollId, callback);
    }
    
    function sendToChat(pollId, callback) {
        // Отправляем запрос в GAS для отправки виджета через бота
        var params = new URLSearchParams({
            action: 'sendToChat',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), function(err, data) {
            if (callback) callback(err, data);
        });
    }
    
    function endPoll(pollId, callback) {
        var params = new URLSearchParams({
            action: 'endPoll',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), callback);
    }
    
    function copyPollLink(pollId) {
        var link = config.WEBAPP_URL + '?poll=' + pollId;
        copyToClipboard(link);
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                utils.showSuccess('📋 Скопировано!');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
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
            utils.showSuccess('📋 Скопировано!');
        } catch(e) {
            utils.showError('Не удалось скопировать');
        }
        document.body.removeChild(textarea);
    }
    
    return {
        createPoll: createPoll,
        submitVote: submitVote,
        getPoll: getPoll,
        sendToChat: sendToChat,
        endPoll: endPoll,
        copyPollLink: copyPollLink
    };
})();
