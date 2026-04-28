// Создание и загрузка опросов
window.FC_POLL = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var ui = window.FC_UI;
    
    var currentPoll = null;
    var currentPollId = null;
    var currentOptions = [];
    
    function createPoll() {
        var question = document.getElementById('question').value.trim();
        var rawOptions = document.getElementById('options').value.trim();
        
        if (!question) { utils.showError('Введите вопрос'); return; }
        if (!rawOptions) { utils.showError('Введите варианты'); return; }
        
        currentOptions = rawOptions.split(/[,\n]/)
            .map(function(o) { return o.trim(); })
            .filter(function(o) { return o.length > 0; });
        
        if (currentOptions.length < 2) { utils.showError('Минимум 2 варианта'); return; }
        if (currentOptions.length > 3) {
            currentOptions = currentOptions.sort(function() { return Math.random() - 0.5; }).slice(0, 3);
        }
        
        utils.showLoader();
        
        function doCreate(retryCount) {
            retryCount = retryCount || 0;
            
            api.createPoll(question, currentOptions, function(err, data) {
                if (err || !data || !data.pollId) {
                    if (retryCount < FC_CONFIG.MAX_RETRIES) {
                        setTimeout(function() { doCreate(retryCount + 1); }, FC_CONFIG.RETRY_DELAY);
                    } else {
                        utils.showScreen('home-screen');
                        utils.showError('Сервер недоступен');
                    }
                    return;
                }
                
                currentPoll = data;
                currentPollId = data.pollId;
                
                ui.renderCreatedPoll(data);
                utils.showScreen('created-screen');
            });
        }
        
        doCreate(0);
    }
    
    function loadPoll(pollId) {
        utils.showLoader();
        
        api.getPoll(pollId, function(err, data) {
            if (err || !data || !data.options) {
                utils.showScreen('home-screen');
                utils.showError('Опрос не найден');
                return;
            }
            
            currentPoll = data;
            currentPollId = pollId;
            currentOptions = data.options.slice();
            
            // Если запрошены результаты
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('view') === 'results') {
                document.getElementById('question-display').textContent = data.question;
                ui.renderRankings(currentOptions);
                utils.showScreen('vote-screen');
            } else if (urlParams.get('results') === '1') {
                ui.renderResults(data);
                utils.showScreen('results-screen');
            } else {
                document.getElementById('question-display').textContent = data.question;
                ui.renderRankings(currentOptions);
                utils.showScreen('vote-screen');
            }
        });
    }
    
    function checkUrlParams() {
        var pollId = null;
        
        // Параметр poll
        try {
            var urlParams = new URLSearchParams(window.location.search);
            pollId = urlParams.get('poll');
        } catch(e) {}
        
        // Telegram startapp
        if (!pollId) {
            try {
                var webApp = utils.getWebApp();
                if (webApp.initDataUnsafe && webApp.initDataUnsafe.startapp) {
                    pollId = webApp.initDataUnsafe.startapp.replace('poll_', '');
                }
            } catch(e) {}
        }
        
        if (pollId) {
            pollId = pollId.trim().replace(/[^a-zA-Z0-9]/g, '');
            if (pollId) loadPoll(pollId);
        }
    }
    
    function getCurrentPoll() { return currentPoll; }
    function getCurrentPollId() { return currentPollId; }
    function getCurrentOptions() { return currentOptions; }
    function setCurrentOptions(opts) { currentOptions = opts; }
    
    return {
        createPoll: createPoll,
        loadPoll: loadPoll,
        checkUrlParams: checkUrlParams,
        getCurrentPoll: getCurrentPoll,
        getCurrentPollId: getCurrentPollId,
        getCurrentOptions: getCurrentOptions,
        setCurrentOptions: setCurrentOptions
    };
})();
