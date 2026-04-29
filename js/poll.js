// Модуль опросов и интерфейса
window.goHome = function() {
    window.FC_POLL.resetHomeFields();
    window.FC_UTILS.showScreen('home-screen');
};

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
        
        var isAuthor = (String(poll.authorId) === utils.getUserId());
        
        var endBtn = document.getElementById('end-poll-btn-results');
        if (endBtn) {
            endBtn.style.display = (isAuthor && poll.status === 'active') ? 'block' : 'none';
        }
        
        var backToVoteBtn = document.getElementById('back-to-vote-btn');
        if (backToVoteBtn) {
            backToVoteBtn.style.display = (poll.status === 'active') ? 'block' : 'none';
        }
    }
    
    window.FC_UI = {
        renderCreatedPoll: renderCreatedPoll,
        renderRankings: renderRankings,
        renderResults: renderResults
    };
    
    // ========== POLL ФУНКЦИИ ==========
    function resetHomeFields() {
        var q = document.getElementById('question');
        var o = document.getElementById('options');
        if (q) {
            q.value = '';
            q.placeholder = '❓ Что выбираем?';
        }
        if (o) {
            o.value = '';
            o.placeholder = '📝 Варианты через запятую:\nПицца, Суши, Бургер';
        }
    }
    
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
            
            var isAuthor = (String(data.authorId) === utils.getUserId());
            
            if (data.alreadyVoted || data.status === 'ended') {
                renderResults(data);
                utils.showScreen('results-screen');
                return;
            }
            
            document.getElementById('question-display').textContent = data.question;
            renderRankings(currentOptions);
            
            var endBtn = document.getElementById('end-poll-btn-vote');
            if (endBtn) {
                endBtn.style.display = isAuthor ? 'block' : 'none';
            }
            
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
            var backBtn = document.getElementById('back-to-vote-btn');
            var endBtn = document.getElementById('end-poll-btn-results');
            
            if (backBtn) backBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = 'none';
            
            var html = '<h2>📋 Ваши активные опросы</h2>';
            
            data.forEach(function(poll, index) {
                var voteUrl = FC_CONFIG.WEBAPP_URL + '?poll=' + poll.pollId;
                
                html += '<div class="poll-card">' +
                    '<strong>' + (index+1) + '. ' + poll.question + '</strong><br>' +
                    '<span style="font-size:14px;color:rgba(255,255,255,0.7);">👥 ' + poll.totalVoters + ' голосов</span>' +
                    '<div style="margin-top:8px;display:flex;gap:8px;">' +
                    '<button class="btn btn-primary" style="flex:1;padding:8px;font-size:12px;" onclick="window.location.href=\'' + voteUrl + '\'">🗳️ Голосовать</button>' +
                    '<button class="btn btn-secondary" style="flex:1;padding:8px;font-size:12px;" onclick="window.FC_POLL.endPollDirect(\'' + poll.pollId + '\')">⏹️ Завершить</button>' +
                    '</div>' +
                    '</div>';
            });
            
            html += '<button class="btn btn-secondary" style="margin-top:12px;" onclick="window.goHome()">🏠 На главную</button>';
            
            container.innerHTML = html;
            document.getElementById('results-title').textContent = '📋 Мои опросы';
            utils.showScreen('results-screen');
        });
    }
    
    function loadEndedPolls() {
        utils.showLoader();
        
        var params = new URLSearchParams({
            action: 'endedPolls',
            userId: utils.getUserId()
        });
        
        utils.jsonp(FC_CONFIG.GAS_URL + '?' + params.toString(), function(err, data) {
            if (err || !data) {
                utils.showScreen('home-screen');
                utils.showError('Не удалось загрузить опросы');
                return;
            }
            
            var container = document.getElementById('results-display');
            var backBtn = document.getElementById('back-to-vote-btn');
            var endBtn = document.getElementById('end-poll-btn-results');
            
            if (backBtn) backBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = 'none';
            
            if (data.length === 0) {
                var html = '<h2>📁 Завершённые опросы</h2>';
                html += '<p style="text-align:center;color:rgba(255,255,255,0.5);">Нет завершённых опросов</p>';
                html += '<button class="btn btn-secondary" style="margin-top:12px;" onclick="window.goHome()">🏠 На главную</button>';
                container.innerHTML = html;
            } else {
                var html = '<h2>📁 Завершённые опросы</h2>';
                
                data.forEach(function(poll, index) {
                    var resultsUrl = FC_CONFIG.WEBAPP_URL + '?poll=' + poll.pollId;
                    
                    html += '<div class="poll-card">' +
                        '<strong>' + (index+1) + '. ' + poll.question + '</strong><br>' +
                        '<span style="font-size:14px;color:rgba(255,255,255,0.7);">👥 ' + poll.totalVoters + ' голосов</span>' +
                        '<div style="margin-top:8px;">' +
                        '<button class="btn btn-secondary" style="width:100%;padding:8px;font-size:12px;" onclick="window.location.href=\'' + resultsUrl + '\'">📊 Результаты</button>' +
                        '</div>' +
                        '</div>';
                });
                
                html += '<button class="btn btn-secondary" style="margin-top:12px;" onclick="window.goHome()">🏠 На главную</button>';
                container.innerHTML = html;
            }
            
            document.getElementById('results-title').textContent = '📁 Завершённые';
            utils.showScreen('results-screen');
        });
    }
    
    function loadAdminStats() {
        utils.showLoader();
        
        utils.jsonp(FC_CONFIG.GAS_URL + '?action=stats', function(err, data) {
            if (err || !data) {
                utils.showScreen('home-screen');
                utils.showError('Не удалось загрузить статистику');
                return;
            }
            
            var container = document.getElementById('results-display');
            var html = '<h2>📊 Статистика</h2>';
            
            html += '<div class="poll-info">' +
                '<h3>Всего</h3>' +
                '<p>📝 Опросов создано: <strong>' + (data.polls_created_total || 0) + '</strong></p>' +
                '<p>🗳️ Голосов: <strong>' + (data.votes_total || 0) + '</strong></p>' +
                '<p>👥 MAU (30 дней): <strong>' + (data.mau || 0) + '</strong></p>' +
                '</div>';
            
            html += '<div class="poll-info">' +
                '<h3>Сегодня</h3>' +
                '<p>📝 Опросов: <strong>' + (data.today?.polls || 0) + '</strong></p>' +
                '<p>🗳️ Голосов: <strong>' + (data.today?.votes || 0) + '</strong></p>' +
                '<p>💬 Активных чатов: <strong>' + (data.today?.active_chats || 0) + '</strong></p>' +
                '<p>👤 Голосующих: <strong>' + (data.today?.voters || 0) + '</strong></p>' +
                '</div>';
            
            if (data.retention_7d) {
                html += '<div class="poll-info">' +
                    '<h3>Retention (7 дней)</h3>' +
                    '<p>Всего новых: <strong>' + data.retention_7d.total + '</strong></p>' +
                    '<p>Вернулись: <strong>' + data.retention_7d.returned + '</strong></p>' +
                    '<p>Rate: <strong>' + data.retention_7d.rate + '%</strong></p>' +
                    '</div>';
            }
            
            html += '<button class="btn btn-secondary" style="margin-top:12px;" onclick="window.goHome()">🏠 На главную</button>';
            
            container.innerHTML = html;
            document.getElementById('results-title').textContent = '📊 Статистика';
            utils.showScreen('results-screen');
        });
    }
    
    function endPollDirect(pollId) {
        if (!confirm('Завершить опрос? Результаты станут финальными.')) return;
        
        utils.showLoader();
        
        var params = new URLSearchParams({
            action: 'endPoll',
            pollId: pollId,
            userId: utils.getUserId()
        });
        
        utils.jsonp(FC_CONFIG.GAS_URL + '?' + params.toString(), function(err, data) {
            if (err || !data || !data.ok) {
                utils.showError('Не удалось завершить опрос');
                loadMyPolls();
                return;
            }
            
            utils.showSuccess('Опрос завершён!');
            loadMyPolls();
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
        loadEndedPolls: loadEndedPolls,
        loadAdminStats: loadAdminStats,
        endPollDirect: endPollDirect,
        resetHomeFields: resetHomeFields,
        checkUrlParams: checkUrlParams,
        getCurrentPoll: getCurrentPoll,
        getCurrentPollId: getCurrentPollId,
        getCurrentOptions: getCurrentOptions,
        setCurrentOptions: setCurrentOptions
    };
})();
