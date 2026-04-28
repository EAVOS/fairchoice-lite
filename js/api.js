// Работа с API
window.FC_API = (function() {
    var utils = window.FC_UTILS;
    var config = window.FC_CONFIG;
    
    function createPoll(question, options, callback) {
        var params = new URLSearchParams({
            action: 'create',
            question: question,
            options: JSON.stringify(options),
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), callback);
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
        // Отправляем запрос в GAS, который через Bot API отправит виджет
        var params = new URLSearchParams({
            action: 'sendToChat',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), function(err, data) {
            if (err || !data) {
                utils.showError('Не удалось отправить в чат');
                if (callback) callback(err, null);
                return;
            }
            
            if (data.error) {
                utils.showError(data.error);
                if (callback) callback(new Error(data.error), null);
                return;
            }
            
            utils.showSuccess('✅ Виджет отправлен в чат!');
            if (callback) callback(null, data);
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
