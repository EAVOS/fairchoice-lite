const webApp = window.Telegram.WebApp;
webApp.ready();
webApp.expand();

let currentPoll = null;
let currentOptions = [];

function getUserId() {
    let userId = webApp.initDataUnsafe?.user?.id;
    if (userId) return userId.toString();
    userId = localStorage.getItem('fc_user_id');
    if (!userId) {
        userId = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('fc_user_id', userId);
    }
    return userId;
}

const userId = getUserId();

function showError(msg) {
    const error = document.getElementById('error');
    error.textContent = msg;
    error.classList.add('show');
    setTimeout(function() { error.classList.remove('show'); }, 3000);
}

function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

function showScreen(screenId) {
    ['home-screen', 'vote-screen', 'results-screen', 'loader'].forEach(function(id) {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function createPoll() {
    const question = document.getElementById('question').value.trim();
    const optionsRaw = document.getElementById('options').value.trim();
    
    if (!question || !optionsRaw) {
        showError('Заполни оба поля');
        return;
    }
    
    currentOptions = optionsRaw.split(/[,\n]/).map(function(o) { return o.trim(); }).filter(function(o) { return o.length > 0; });
    
    if (currentOptions.length < 2) {
        showError('Нужно минимум 2 варианта');
        return;
    }
    
    if (currentOptions.length > 3) {
        currentOptions = currentOptions.sort(function() { return Math.random() - 0.5; }).slice(0, 3);
    }
    
    document.getElementById('question-display').textContent = question;
    renderRankings();
    showScreen('vote-screen');
}

function renderRankings() {
    const container = document.getElementById('rankings');
    const medals = ['🥇', '🥈', '🥉'];
    
    container.innerHTML = currentOptions.map(function(opt, i) {
        return '<div class="poll-card">' + (medals[i] || '') + ' ' + opt + '</div>';
    }).join('');
}

function shuffle() {
    currentOptions = currentOptions.sort(function() { return Math.random() - 0.5; });
    renderRankings();
}

async function submitVote() {
    showLoader();
    const question = document.getElementById('question-display').textContent;
    
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createAndVote',
                question: question,
                options: currentOptions,
                userId: userId,
                rankings: { first: 0, second: 1, third: 2 }
            })
        });
        
        if (!response.ok) throw new Error('Сервер перегружен. Попробуй через минуту.');
        
        const data = await response.json();
        currentPoll = data;
        renderResults();
        showScreen('results-screen');
        
    } catch (e) {
        showError(e.message || 'Ошибка соединения');
        showScreen('vote-screen');
    } finally {
        hideLoader();
    }
}

function renderResults() {
    const container = document.getElementById('results-display');
    
    if (!currentPoll || !currentPoll.scores) {
        container.innerHTML = '<p>Нет результатов</p>';
        return;
    }
    
    const sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
    const medals = ['🥇', '🥈', '🥉'];
    
    container.innerHTML = sorted.map(function(entry, i) {
        const idx = entry[0];
        const score = entry[1];
        const option = currentPoll.options[idx];
        return '<div class="poll-card">' + (medals[i] || '') + ' ' + option + ' — <strong>' + score + ' очков</strong></div>';
    }).join('');
    
    container.innerHTML += '<p class="voter-count">👥 Проголосовало: ' + (currentPoll.totalVoters || 0) + ' человек</p>';
}

function shareResults() {
    if (!currentPoll) return;
    
    const sorted = Object.entries(currentPoll.scores).sort(function(a, b) { return b[1] - a[1]; });
    const medals = ['🥇', '🥈', '🥉'];
    
    const text = sorted.map(function(entry, i) {
        const idx = entry[0];
        const score = entry[1];
        const option = currentPoll.options[idx];
        return (medals[i] || '') + ' ' + option + ' — ' + score + ' очков';
    }).join('\n');
    
    const shareText = '🗳️ ' + currentPoll.question + '\n\n' + text + '\n\nГолосовать: t.me/FairChoiceBot?startapp=poll_' + currentPoll.pollId;
    
    webApp.openTelegramLink('https://t.me/share/url?text=' + encodeURIComponent(shareText));
}
