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
        
        api.submitVote(poll.getCurrentPollId(), rankings, function(err, data) {
            if (err) {
                utils.showScreen('vote-screen');
                utils.showError('Ошибка сети. Попробуйте позже.');
                return;
            }
            
            if (data.error) {
                utils.showScreen('vote-screen');
                if (data.error === 'Вы уже голосовали') {
                    utils.showError('⚠️ Вы уже голосовали!');
                    // Показываем результаты
                    api.getPoll(poll.getCurrentPollId(), function(e, pollData) {
                        if (!e && pollData) {
                            FC_RESULTS.showResults(pollData);
                        }
                    });
                } else {
                    utils.showError(data.error);
                }
                return;
            }
            
            FC_RESULTS.showResults(data);
        });
    }
    
    return {
        shuffleOptions: shuffleOptions,
        moveUp: moveUp,
        moveDown: moveDown,
        submitVote: submitVote
    };
})();
