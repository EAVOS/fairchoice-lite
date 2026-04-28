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
