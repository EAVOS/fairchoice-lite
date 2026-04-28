// Результаты
window.FC_RESULTS = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var ui = window.FC_UI;
    var poll = window.FC_POLL;
    
    function showResults(data) {
        ui.renderResults(data || poll.getCurrentPoll());
        utils.showScreen('results-screen');
    }
    
    function refreshResults() {
        utils.showLoader();
        
        api.getPoll(poll.getCurrentPollId(), function(err, data) {
            if (err || !data) {
                utils.showError('Не удалось обновить');
                utils.showScreen('results-screen');
                return;
            }
            ui.renderResults(data);
            utils.showScreen('results-screen');
        });
    }
    
    function endPoll() {
        if (!confirm('Завершить опрос? Результаты станут финальными.')) return;
        
        utils.showLoader();
        
        api.endPoll(poll.getCurrentPollId(), function(err, data) {
            if (err || !data) {
                utils.showError('Не удалось завершить опрос');
                utils.showScreen('created-screen');
                return;
            }
            
            ui.renderResults(data.poll);
            utils.showScreen('results-screen');
            utils.showSuccess('Опрос завершён!');
        });
    }
    
    return {
        showResults: showResults,
        refreshResults: refreshResults,
        endPoll: endPoll
    };
})();
