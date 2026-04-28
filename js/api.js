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
        var webApp = utils.getWebApp();
        
        // Используем switchInlineQuery для выбора чата
        try {
            webApp.switchInlineQuery('poll_' + pollId, ['groups', 'channels', 'users']);
            if (callback) callback(null, { ok: true });
        } catch(e) {
            // Fallback: копируем ссылку
            var link = config.WEBAPP_URL + '?poll=' + pollId;
            copyToClipboard(link);
            if (callback) callback(e, null);
        }
    }
    
    function endPoll(pollId, callback) {
        var params = new URLSearchParams({
            action: 'endPoll',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(config.GAS_URL + '?' + params.toString(), callback);
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                utils.showSuccess('📋 Ссылка скопирована!');
            });
        } else {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            utils.showSuccess('📋 Ссылка скопирована!');
        }
    }
    
    return {
        createPoll: createPoll,
        submitVote: submitVote,
        getPoll: getPoll,
        sendToChat: sendToChat,
        endPoll: endPoll
    };
})();
