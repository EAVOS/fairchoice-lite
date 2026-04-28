function renderCreatedPoll(poll) {
    var container = document.getElementById('created-content');
    var link = FC_CONFIG.WEBAPP_URL + '?poll=' + poll.pollId;
    var isAuthor = (poll.authorId === FC_UTILS.getUserId());
    
    container.innerHTML = 
        '<div class="poll-info">' +
            '<p style="margin-bottom:8px;"><strong>' + poll.question + '</strong></p>' +
            '<p>' + poll.options.map(function(o, i) { return (i+1) + '. ' + o; }).join('<br>') + '</p>' +
            '<div class="poll-status active">🟢 Опрос активен</div>' +
            '<div class="poll-link">' + link + '</div>' +
        '</div>';
    
    // Кнопка завершения только для автора
    var endBtn = document.getElementById('end-poll-btn');
    if (endBtn) {
        if (isAuthor) {
            endBtn.classList.remove('hidden');
        } else {
            endBtn.classList.add('hidden');
        }
    }
    
    // Подписи кнопок в зависимости от платформы
    var isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    var shareBtn = document.getElementById('share-to-chat-btn');
    if (shareBtn) {
        shareBtn.textContent = isMobile ? '📤 Отправить в чат (приложение)' : '📋 Копировать для чата';
    }
}
