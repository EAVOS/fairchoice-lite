// Создание и загрузка опросов
window.FC_POLL = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    var ui; // Будет установлен позже
    
    var currentPoll = null;
    var currentPollId = null;
    var currentOptions = [];
    
    // Инициализация после загрузки всех модулей
    function init() {
        ui = window.FC_UI;
    }
    
    function createPoll() {
        if (!ui) ui = window.FC_UI;
        
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
                    if (retryCount < 3) {
                        setTimeout(function() { doCreate(retryCount + 1); }, 2000);
                    } else {
                        utils.showScreen('home-screen');
                        utils.showError('Сервер недоступен');
                    }
                    return;
                }
                
                currentPoll = data;
                currentPollId = data.pollId;
                
                if (!ui) ui = window.FC_UI;
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
            
            // Проверяем, голосовал ли уже пользователь
            if (data.alreadyVoted) {
                if (!ui) ui = window.FC_UI;
                ui.renderResults(data);
                utils.showScreen('results-screen');
                return;
            }
            
            document.getElementById('question-display').textContent = data.question;
            if (!ui) ui = window.FC_UI;
            ui.renderRankings(currentOptions);
            utils.showScreen('vote-screen');
        });
    }
    
    function checkUrlParams() {
        var pollId = null;
        
        try {
            var urlParams = new URLSearchParams(window.location.search);
            pollId = urlParams.get('poll');
        } catch(e) {}
        
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
    
    // Отложенная инициализация
    setTimeout(init, 100);
    
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
