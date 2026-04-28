// Модуль опросов и интерфейса
window.FC_POLL = (function() {
    var utils = window.FC_UTILS;
    var api = window.FC_API;
    
    var currentPoll = null;
    var currentPollId = null;
    var currentOptions = [];
    
    // ========== UI ФУНКЦИИ ==========
    function renderCreatedPoll(poll) {
        var container = document.getElementById('created-content');
        if (!container) return;
        
        var link = FC_CONFIG.WEBAPP_URL + '?poll=' + poll.pollId;
        var isAuthor = (String(poll.authorId) === utils.getUserId());
        
        container.innerHTML = 
            '<div class="poll-info">' +
                '<p style="margin-bottom:8px;"><strong>' + poll.question + '</strong></p>' +
                '<p>' + poll.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('<br>') + '</p>' +
                '<div class="poll-status active">🟢 Опрос активен</div>' +
                '<div class="poll-link">' + link + '</div>' +
            '</div>';
        
        var endBtn = document.getElementById('end-poll-btn');
        if (endBtn) {
            endBtn.style.display = isAuthor ? 'block' : 'none';
        }
        
        var isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        var shareBtn = document.getElementById('share-to-chat-btn');
        if (shareBtn) {
            shareBtn.textContent = isMobile ? '📤 Отправить в чат' : '📋 Копировать для чата';
        }
    }
    
    function renderRankings(options) {
        var container = document.getElementById('rankings');
        if (!container) return;
        
        var medals = ['🥇', '🥈', '🥉'];
        
        container.innerHTML = options.map(function(option, index) {
            var upDisabled = index === 0 ? ' disabled' : '';
            var downDisabled = index === options.length - 1 ? ' disabled' : '';
            
            return '<div class="poll-card" style="display:flex;align-items:center;gap:12px;">' +
                '<div style="display:flex;flex-direction:column;gap:4px;">' +
                '<button class="sort-btn" onclick="FC_VOTE.moveUp(' + index + ')"' + upDisabled + '>▲</button>' +
                '<button class="sort-btn" onclick="FC_VOTE.moveDown(' + index + ')"' + downDisabled + '>▼</button>' +
                '</div>' +
                '<span style="flex:1;">' + medals[index] + ' ' + option + '</span>' +
                '</div>';
        }).join('');
    }
    
    function renderResults(poll) {
        var container = document.getElementById('results-display');
        if (!container) return;
        
        if (!poll || !poll.scores) {
            container.innerHTML = '<p style="text-align:center;">Нет результатов</p>';
            return;
        }
        
        var sorted = Object.entries(poll.scores).sort(function(a, b) { return b[1] - a[1]; });
        var medals = ['🥇', '🥈', '🥉'];
        
        var html = sorted.map(function(entry, index) {
            var optionText = poll.options[parseInt(entry[0])] || 'Вариант';
            return '<div class="poll-card">' + 
                medals[index] + ' <strong>' + optionText + '</strong><br>' +
                '<span style="font-size:14px;color:rgba(255,255,255,0.7);">' + entry[1] + ' очков</span>' +
                '</div>';
        }).join('');
        
        html += '<p class="voter-count">👥 Проголосовало: ' + (poll.totalVoters || 0) + ' человек</p>';
        
        if (poll.status === 'ended') {
            html += '<div class="poll-status ended" style="margin-top:12px;">🔴 Опрос завершён</div>';
        }
        
        container.innerHTML = html;
        
        var title = document.getElementById('results-title');
        if (title) {
            title.textContent = poll.status === 'ended' ? '🏆 Итоги' : '📊 Результаты';
        }
    }
    
    // Экспортируем UI функции глобально
    window.FC_UI = {
        renderCreatedPoll: renderCreatedPoll,
        renderRankings: renderRankings,
        renderResults: renderResults
    };
    
    // ========== POLL ФУНКЦИИ ==========
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
                
                renderCreatedPoll(data);
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
            
            if (data.alreadyVoted) {
                renderResults(data);
                utils.showScreen('results-screen');
                return;
            }
            
            document.getElementById('question-display').textContent = data.question;
            renderRankings(currentOptions);
            utils.showScreen('vote-screen');
        });
    }
    
    function loadMyPolls() {
        utils.showLoader();
        
        var params = new URLSearchParams({
            action: 'myPolls',
            userId: utils.getUserId()
        });
        
        utils.jsonp(FC_CONFIG.GAS_URL + '?' + params.toString(), function(err, data) {
            if (err || !data) {
                utils.showScreen('home-screen');
                utils.showError('Не удалось загрузить опросы');
                return;
            }
            
            if (data.length === 0) {
                utils.showScreen('home-screen');
                utils.showSuccess('У вас нет активных опросов');
                return;
            }
            
            var container = document.getElementById('results-display');
            var html = '<h2>📋 Ваши активные опросы</h2>';
            
            data.forEach(function(poll, index) {
                html += '<div class="poll-card" style="cursor:pointer" onclick="window.location.href=\'?poll=' + poll.pollId + '\'">' +
                    '<strong>' + (index+1) + '. ' + poll.question + '</strong><br>' +
                    '<span style="font-size:14px;color:rgba(255,255,255,0.7);">👥 ' + poll.totalVoters + ' голосов</span>' +
                    '</div>';
            });
            
            container.innerHTML = html;
            document.getElementById('results-title').textContent = '📋 Мои опросы';
            utils.showScreen('results-screen');
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
    
    return {
        createPoll: createPoll,
        loadPoll: loadPoll,
        loadMyPolls: loadMyPolls,
        checkUrlParams: checkUrlParams,
        getCurrentPoll: getCurrentPoll,
        getCurrentPollId: getCurrentPollId,
        getCurrentOptions: getCurrentOptions,
        setCurrentOptions: setCurrentOptions
    };
})();
