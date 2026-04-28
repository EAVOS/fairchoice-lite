// Управление интерфейсом
window.FC_UI = (function() {
    var utils = window.FC_UTILS;
    
    function renderCreatedPoll(poll) {
        var container = document.getElementById('created-content');
        var link = FC_CONFIG.WEBAPP_URL + '?poll=' + poll.pollId;
        
        container.innerHTML = 
            '<div class="poll-info">' +
                '<p style="margin-bottom:8px;"><strong>' + poll.question + '</strong></p>' +
                '<p>' + poll.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('<br>') + '</p>' +
                '<div class="poll-status active">🟢 Опрос активен</div>' +
                '<div class="poll-link">' + link + '</div>' +
            '</div>';
        
        // Показываем/скрываем кнопку завершения
        var endBtn = document.getElementById('end-poll-btn');
        if (endBtn) {
            endBtn.style.display = (poll.authorId === utils.getUserId()) ? 'block' : 'none';
        }
    }
    
    function renderRankings(options) {
        var container = document.getElementById('rankings');
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
        
        // Обновляем заголовок
        var title = document.getElementById('results-title');
        if (title) {
            title.textContent = poll.status === 'ended' ? '🏆 Итоги' : '📊 Результаты';
        }
    }
    
    return {
        renderCreatedPoll: renderCreatedPoll,
        renderRankings: renderRankings,
        renderResults: renderResults
    };
})();
