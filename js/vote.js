// Голосование
window.FC_VOTE = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var ui = window.FC_UI;
    
    function shuffleOptions() {
        var poll = window.FC_POLL;
        var options = poll.getCurrentOptions();
        options = options.sort(function() { return Math.random() - 0.5; });
        poll.setCurrentOptions(options);
        ui.renderRankings(options);
    }
    
    function moveUp(index) {
        var poll = window.FC_POLL;
        var options = poll.getCurrentOptions();
        if (index === 0) return;
        var temp = options[index];
        options[index] = options[index - 1];
        options[index - 1] = temp;
        poll.setCurrentOptions(options);
        ui.renderRankings(options);
    }
    
    function moveDown(index) {
        var poll = window.FC_POLL;
        var options = poll.getCurrentOptions();
        if (index === options.length - 1) return;
        var temp = options[index];
        options[index] = options[index + 1];
        options[index + 1] = temp;
        poll.setCurrentOptions(options);
        ui.renderRankings(options);
    }
    
    function submitVote() {
        var poll = window.FC_POLL;
        var currentPoll = poll.getCurrentPoll();
        var options = poll.getCurrentOptions();
        
        var rankings = {};
        options.forEach(function(option, sortedIndex) {
            var originalIndex = currentPoll.options.indexOf(option);
            if (originalIndex === -1) originalIndex = sortedIndex;
            if (sortedIndex === 0) rankings.first = originalIndex;
            if (sortedIndex === 1) rankings.second = originalIndex;
            if (sortedIndex === 2) rankings.third = originalIndex;
        });
        
        utils.showLoader();
        
        function doVote(retryCount) {
            retryCount = retryCount || 0;
            
            api.submitVote(poll.getCurrentPollId(), rankings, function(err, data) {
                if (err || !data || !data.scores) {
                    if (retryCount < FC_CONFIG.MAX_RETRIES) {
                        setTimeout(function() { doVote(retryCount + 1); }, FC_CONFIG.RETRY_DELAY);
                    } else {
                        utils.showScreen('vote-screen');
                        utils.showError('Сервер недоступен');
                    }
                    return;
                }
                
                FC_RESULTS.showResults(data);
            });
        }
        
        doVote(0);
    }
    
    return {
        shuffleOptions: shuffleOptions,
        moveUp: moveUp,
        moveDown: moveDown,
        submitVote: submitVote
    };
})();
