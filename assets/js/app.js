// CE Exam System JavaScript with Enhanced Session Management
class ExamSystem {
    constructor() {
        this.apiUrl = 'api/exam.php';
        this.currentUser = null;
        this.examData = null;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.autoSaveInterval = null;
        this.isExamSubmitted = false;
        
        // JSON answers object
        this.answers = {
            "1": { question_id: 1, answer: "", timestamp: null },
            "2": { question_id: 2, answer: "", timestamp: null },
            "3": { question_id: 3, answer: "", timestamp: null },
            "4": { question_id: 4, answer: "", timestamp: null }
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCurrentTime();
        this.checkExistingSession();
        
        // Update current time every second
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    bindEvents() {
        // Login button
        $('#startExam').on('click', () => this.handleLogin());
        
        // Enter key on NRP input
        $('#nrp').on('keypress', (e) => {
            if (e.which === 13) {
                this.handleLogin();
            }
        });

        // NRP input validation
        $('#nrp').on('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            e.target.value = value;
        });

        // Answer inputs auto-save to localStorage only
        for (let i = 1; i <= 4; i++) {
            $(`#answer${i}`).on('input', (e) => {
                this.markAsUnsaved(i);
                
                // Clean answer before storing
                const cleanAnswer = this.cleanAnswer(e.target.value);
                console.log(`Question ${i} - Input cleaned`);
                
                // Update answers object
                this.answers[i.toString()] = {
                    question_id: i,
                    answer: cleanAnswer,
                    timestamp: new Date().toISOString()
                };
                
                // Save to localStorage immediately
                this.saveToLocalStorage();
                
                // Update status
                setTimeout(() => {
                    this.updateSaveStatus(i, 'saved', 'Tersimpan lokal');
                }, 500);
            });
        }

        // Submit button
        $('#submitExam').on('click', () => this.confirmSubmit());

        // PREVENT REFRESH/RELOAD - Multiple layers of protection
        this.preventRefresh();

        // Auto-save to localStorage every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.currentUser && !this.isExamSubmitted) {
                this.saveToLocalStorage();
                console.log('Auto-saved to localStorage at:', new Date().toLocaleTimeString());
            }
        }, 30000);

        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Prevent certain keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });
    }

    // Save answers to localStorage
    saveToLocalStorage() {
        if (!this.currentUser) return;
        
        console.log('=== SaveToLocalStorage Called ===');
        
        // Collect current answers from all textareas
        for (let i = 1; i <= 4; i++) {
            const answer = $(`#answer${i}`).val();
            // Clean answer: remove extra whitespace and normalize line breaks
            const cleanAnswer = this.cleanAnswer(answer);
            
            console.log(`Question ${i} - Raw:`, JSON.stringify(answer));
            console.log(`Question ${i} - Cleaned:`, JSON.stringify(cleanAnswer));
            
            this.answers[i.toString()] = {
                question_id: i,
                answer: cleanAnswer,
                timestamp: new Date().toISOString()
            };
        }
        
        const storageKey = `exam_answers_${this.currentUser.nrp}`;
        localStorage.setItem(storageKey, JSON.stringify(this.answers));
        
        console.log('Final answers saved to localStorage:', this.answers);
    }

    // Clean answer text
    cleanAnswer(answer) {
        if (!answer) return '';
        
        // Convert answer to string if not already
        let cleanedAnswer = String(answer);
        
        // DEBUG: Log original answer
        console.log('Original answer:', JSON.stringify(cleanedAnswer));
        
        // Normalize line breaks - convert \r\n and \r to \n
        cleanedAnswer = cleanedAnswer.replace(/\r\n/g, '\n');
        cleanedAnswer = cleanedAnswer.replace(/\r/g, '\n');
        
        // Convert actual newlines to spaces (this is the key fix)
        cleanedAnswer = cleanedAnswer.replace(/\n/g, ' ');
        
        // Remove excessive whitespace
        cleanedAnswer = cleanedAnswer.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
        
        // Trim leading and trailing whitespace
        cleanedAnswer = cleanedAnswer.trim();
        
        // DEBUG: Log cleaned answer
        console.log('Cleaned answer:', JSON.stringify(cleanedAnswer));
        
        return cleanedAnswer;
    }
    loadFromLocalStorage() {
        if (!this.currentUser) return;
        
        const storageKey = `exam_answers_${this.currentUser.nrp}`;
        const savedAnswers = localStorage.getItem(storageKey);
        
        if (savedAnswers) {
            try {
                this.answers = JSON.parse(savedAnswers);
                this.loadAnswersToInputs();
                console.log('Answers loaded from localStorage:', this.answers);
            } catch (e) {
                console.error('Error parsing localStorage answers:', e);
            }
        }
    }

    setupExamProtection() {
        // Push state to prevent back button
        history.pushState(null, '', window.location.href);
        
        // Additional protection measures
        console.log('Exam protection activated - refresh and navigation blocked');
        
        // Disable browser context menu during exam
        document.oncontextmenu = () => {
            if (this.currentUser && !this.isExamSubmitted) {
                this.showAlert('warning', 'Context menu tidak diizinkan selama ujian!');
                return false;
            }
        };
    }

    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
        
        const dateString = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Jakarta'
        });
        
        // Update jam di halaman ujian
        const examTimeElement = document.getElementById('currentTime');
        if (examTimeElement) {
            examTimeElement.textContent = timeString;
        }
        
        // Update jam di halaman login
        const loginTimeElement = document.getElementById('loginCurrentTime');
        if (loginTimeElement) {
            loginTimeElement.textContent = `${dateString}, ${timeString} WIB`;
        }
    }

    async checkExistingSession() {
        const savedNRP = localStorage.getItem('exam_nrp');
        if (savedNRP) {
            try {
                const response = await this.apiCall('GET', 'check_session', null, { nrp: savedNRP });
                if (response.success) {
                    this.currentUser = response.data;
                    
                    // Activate protection immediately on recovery
                    this.setupExamProtection();
                    
                    // Silent recovery - langsung ke halaman ujian
                    this.loadExamData();
                    this.showExamPage();
                    
                    // Load answers dari localStorage first (priority)
                    this.loadFromLocalStorage();
                    
                    // If no localStorage data, load from database
                    if (response.data.answer && this.isEmpty(this.answers)) {
                        try {
                            const savedAnswers = JSON.parse(response.data.answer);
                            this.answers = { ...this.answers, ...savedAnswers };
                            this.loadAnswersToInputs();
                        } catch (e) {
                            console.error('Error parsing saved answers:', e);
                        }
                    }
                    
                    // Start timer AFTER everything is loaded
                    this.startTimer();
                    
                    console.log('Session recovered successfully - staying on exam page with protection active');
                } else if (response.already_submitted) {
                    // Ujian sudah difinalisasi, langsung ke halaman sukses
                    localStorage.removeItem('exam_nrp');
                    this.clearLocalStorage(savedNRP);
                    this.showSuccessPageWithMessage('Ujian sudah difinalisasi sebelumnya pada: ' + response.submit_time);
                } else {
                    localStorage.removeItem('exam_nrp');
                    // Kembali ke halaman login jika session invalid
                    this.showLoginPage();
                }
            } catch (error) {
                console.error('Session check error:', error);
                localStorage.removeItem('exam_nrp');
                this.showLoginPage();
            }
        } else {
            // Tidak ada session tersimpan, tampilkan halaman login
            this.showLoginPage();
        }
    }

    // Check if answers object is empty
    isEmpty(answers) {
        for (let key in answers) {
            if (answers[key].answer && answers[key].answer.trim()) {
                return false;
            }
        }
        return true;
    }

    // Clear localStorage for specific user
    clearLocalStorage(nrp) {
        const storageKey = `exam_answers_${nrp}`;
        localStorage.removeItem(storageKey);
        console.log('LocalStorage cleared for NRP:', nrp);
    }

    preventRefresh() {
        // Prevent F5 refresh
        document.addEventListener('keydown', (e) => {
            // Prevent F5
            if (e.key === 'F5') {
                if (this.currentUser && !this.isExamSubmitted) {
                    e.preventDefault();
                    this.showAlert('warning', 'Refresh tidak diizinkan selama ujian berlangsung!');
                    return false;
                }
            }
            
            // Prevent Ctrl+R
            if (e.ctrlKey && e.key === 'r') {
                if (this.currentUser && !this.isExamSubmitted) {
                    e.preventDefault();
                    this.showAlert('warning', 'Refresh tidak diizinkan selama ujian berlangsung!');
                    return false;
                }
            }
            
            // Prevent Ctrl+F5
            if (e.ctrlKey && e.key === 'F5') {
                if (this.currentUser && !this.isExamSubmitted) {
                    e.preventDefault();
                    this.showAlert('warning', 'Hard refresh tidak diizinkan selama ujian berlangsung!');
                    return false;
                }
            }
            
            // Prevent Ctrl+Shift+R
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                if (this.currentUser && !this.isExamSubmitted) {
                    e.preventDefault();
                    this.showAlert('warning', 'Hard refresh tidak diizinkan selama ujian berlangsung!');
                    return false;
                }
            }
        });

        // Prevent browser refresh button and navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.currentUser && !this.isExamSubmitted) {
                // Save to localStorage before any potential leaving
                this.saveToLocalStorage();
                
                // Prevent the action with a custom message
                const message = 'Anda tidak dapat meninggalkan halaman atau refresh selama ujian berlangsung!';
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });

        // Additional protection - disable right-click
        document.addEventListener('contextmenu', (e) => {
            if (this.currentUser && !this.isExamSubmitted) {
                e.preventDefault();
                this.showAlert('warning', 'Right-click tidak diizinkan selama ujian!');
                return false;
            }
        });

        // Prevent back/forward browser navigation
        window.addEventListener('popstate', (e) => {
            if (this.currentUser && !this.isExamSubmitted) {
                // Push the current state back to prevent navigation
                history.pushState(null, '', window.location.href);
                this.showAlert('warning', 'Navigasi browser tidak diizinkan selama ujian!');
            }
        });

        // Push initial state to prevent back button
        if (this.currentUser && !this.isExamSubmitted) {
            history.pushState(null, '', window.location.href);
        }
    }

    loadAnswersToInputs() {
        for (let i = 1; i <= 4; i++) {
            if (this.answers[i.toString()] && this.answers[i.toString()].answer) {
                $(`#answer${i}`).val(this.answers[i.toString()].answer);
                this.updateSaveStatus(i, 'saved', 'Tersimpan lokal');
            }
        }
    }

    async handleLogin() {
        const nrp = $('#nrp').val().trim();
        
        if (!nrp) {
            this.showAlert('error', 'Silakan masukkan NRP Anda');
            return;
        }

        if (!/^\d{10}$/.test(nrp)) {
            this.showAlert('error', 'Format NRP tidak valid. Harus 10 digit angka.');
            return;
        }

        // Show confirmation
        const confirmed = await this.showConfirmation(
            'Konfirmasi Memulai Ujian',
            `Dengan mengklik "Mulai", waktu ujian akan dimulai dan tidak dapat dihentikan. Refresh/reload halaman akan diblokir. Anda yakin ingin memulai ujian dengan NRP: ${nrp}?`,
            'Mulai Ujian',
            'Batal'
        );

        if (!confirmed) return;

        try {
            this.showLoading(true);
            const response = await this.apiCall('POST', 'login', { nrp });
            
            if (response.success) {
                this.currentUser = response.data;
                localStorage.setItem('exam_nrp', nrp);
                
                // Enable additional refresh prevention after successful login
                this.setupExamProtection();
                
                this.loadExamData();
                this.showExamPage();
                this.startTimer();
                
                // Load from localStorage first
                this.loadFromLocalStorage();
                
                // If no localStorage, load from database
                if (response.data.answer && this.isEmpty(this.answers)) {
                    try {
                        const savedAnswers = JSON.parse(response.data.answer);
                        this.answers = { ...this.answers, ...savedAnswers };
                        this.loadAnswersToInputs();
                    } catch (e) {
                        console.error('Error parsing saved answers:', e);
                    }
                }
                
                this.showAlert('success', 'Login berhasil! Ujian dimulai. Refresh diblokir untuk keamanan.');
            } else {
                this.showAlert('error', response.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('error', 'Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            this.showLoading(false);
        }
    }

    markAsUnsaved(questionId) {
        this.updateSaveStatus(questionId, 'unsaved', 'Belum tersimpan');
    }

    updateSaveStatus(questionId, status, message) {
        const $status = $(`#saveStatus${questionId}`);
        $status.removeClass('saving saved error unsaved');
        $status.addClass(status);
        $status.find('span').text(message);
    }

    loadExamData() {
        if (this.currentUser) {
            $('#studentName').text(this.currentUser.name);
            $('#studentNrp').text(this.currentUser.nrp);
            $('#teacherName').text(': ' + this.currentUser.teacher);
            $('#examDuration').text(': ' + this.currentUser.duration + ' Menit');
        }
    }

    showLoginPage() {
        $('#loginPage').addClass('active');
        $('#examPage').removeClass('active');
        $('#successPage').removeClass('active');
    }

    showExamPage() {
        $('#loginPage').removeClass('active');
        $('#examPage').addClass('active');
        $('#successPage').removeClass('active');
        
        // Focus on first answer textarea
        setTimeout(() => {
            $('#answer1').focus();
        }, 500);
    }

    showSuccessPage() {
        $('#loginPage').removeClass('active');
        $('#examPage').removeClass('active');
        $('#successPage').addClass('active');
        
        const now = new Date();
        const submitTimeString = now.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        $('#submitTime').text(submitTimeString);
    }

    showSuccessPageWithMessage(message) {
        this.showSuccessPage();
        // Tampilkan pesan tanpa alert popup
        const messageEl = $('#successPage').find('.success-message');
        if (messageEl.length) {
            messageEl.append(`<div style="margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 8px; color: #1976d2;">${message}</div>`);
        }
    }

    async confirmSubmit() {
        if (this.isExamSubmitted) return;

        // Save to localStorage before submit
        this.saveToLocalStorage();

        // Count answered questions
        let answeredCount = 0;
        for (let i = 1; i <= 4; i++) {
            if ($(`#answer${i}`).val().trim()) {
                answeredCount++;
            }
        }

        const confirmed = await this.showConfirmation(
            'Finalisasi Ujian',
            `Anda telah menjawab ${answeredCount} dari 4 soal.\n\nApakah Anda yakin ingin FINALISASI ujian? Setelah difinalisasi, Anda tidak dapat mengubah jawaban lagi.`,
            'Finalisasi Ujian',
            'Batal'
        );

        if (confirmed) {
            await this.submitExam(false);
        }
    }

    async submitExam(isAutoSubmit = false) {
        if (this.isExamSubmitted) {
            console.log('Exam already submitted, skipping...');
            return;
        }

        console.log('Finalizing exam submission...');
        
        try {
            this.showLoading(true);
            
            // Collect final answers from inputs with cleaning
            for (let i = 1; i <= 4; i++) {
                const answer = $(`#answer${i}`).val();
                const cleanAnswer = this.cleanAnswer(answer);
                
                this.answers[i.toString()] = {
                    question_id: i,
                    answer: cleanAnswer,
                    timestamp: new Date().toISOString()
                };
            }
            
            console.log('Final cleaned answers for submission:', this.answers);
            
            // Submit final answers to database
            const response = await this.apiCall('POST', 'submit_exam', {
                nrp: this.currentUser.nrp,
                answer: JSON.stringify(this.answers)
            });

            if (response.success) {
                this.isExamSubmitted = true;
                clearInterval(this.timerInterval);
                clearInterval(this.autoSaveInterval);
                
                // Clear session data
                localStorage.removeItem('exam_nrp');
                this.clearLocalStorage(this.currentUser.nrp);
                
                if (isAutoSubmit) {
                    this.showSuccessPageWithMessage('Waktu ujian telah habis! Jawaban Anda telah difinalisasi otomatis.');
                } else {
                    this.showSuccessPage();
                    this.showAlert('success', 'Ujian berhasil difinalisasi!');
                }
            } else {
                this.showAlert('error', response.message || 'Gagal finalisasi ujian');
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.showAlert('error', 'Terjadi kesalahan saat finalisasi: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    startTimer() {
        if (!this.currentUser || !this.currentUser.start_time) {
            console.log('Cannot start timer: missing user or start_time');
            return;
        }

        // Clear existing timer if any
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const startTime = new Date(this.currentUser.start_time);
        const duration = this.currentUser.duration * 60 * 1000; // Convert to milliseconds
        const endTime = new Date(startTime.getTime() + duration);
        
        console.log('Timer starting:', {
            start: startTime.toLocaleString(),
            end: endTime.toLocaleString(),
            duration: this.currentUser.duration + ' minutes'
        });

        this.timerInterval = setInterval(() => {
            const now = new Date();
            const remaining = endTime - now;

            if (remaining <= 0) {
                console.log('Time up detected in timer');
                this.timeUp();
                return;
            }

            this.timeRemaining = remaining;
            this.updateTimerDisplay(remaining);
        }, 1000);

        // Initial update
        const now = new Date();
        const remaining = endTime - now;
        if (remaining > 0) {
            this.timeRemaining = remaining;
            this.updateTimerDisplay(remaining);
        } else {
            console.log('Time already up on start');
            this.timeUp();
        }
    }

    updateTimerDisplay(remaining) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        $('#timeRemaining').text(display);

        // Warning colors
        const $countdown = $('#timeRemaining');
        $countdown.removeClass('warning danger');
        
        if (remaining <= 5 * 60 * 1000) { // 5 minutes
            $countdown.addClass('danger');
        } else if (remaining <= 15 * 60 * 1000) { // 15 minutes
            $countdown.addClass('warning');
        }

        // Warning notifications
        if (remaining === 15 * 60 * 1000) { // 15 minutes remaining
            this.showAlert('warning', 'Peringatan: Waktu ujian tersisa 15 menit!');
        } else if (remaining === 5 * 60 * 1000) { // 5 minutes remaining
            this.showAlert('warning', 'Peringatan: Waktu ujian tersisa 5 menit!');
        }
    }

    async timeUp() {
        // Prevent multiple calls
        if (this.isExamSubmitted) {
            console.log('Exam already submitted, ignoring timeUp call');
            return;
        }
        
        console.log('Time is up - preparing auto submission...');
        
        // Clear intervals immediately
        clearInterval(this.timerInterval);
        clearInterval(this.autoSaveInterval);
        
        // Set flag to prevent double submission
        this.isExamSubmitted = true;
        
        try {
            // Ensure we have current answers from textareas with cleaning
            let hasAnswers = false;
            for (let i = 1; i <= 4; i++) {
                const answerElement = document.getElementById(`answer${i}`);
                const answer = answerElement ? answerElement.value : '';
                const cleanAnswer = this.cleanAnswer(answer);
                
                this.answers[i.toString()] = {
                    question_id: i,
                    answer: cleanAnswer,
                    timestamp: new Date().toISOString()
                };
                
                if (cleanAnswer.trim()) {
                    hasAnswers = true;
                }
            }
            
            console.log('Auto-submit cleaned answers collected:', this.answers);
            console.log('Has answers:', hasAnswers);
            
            // Auto submit to database with final answers
            const response = await this.apiCall('POST', 'submit_exam', {
                nrp: this.currentUser.nrp,
                answer: JSON.stringify(this.answers)
            });
            
            if (response.success) {
                // Clear session data
                localStorage.removeItem('exam_nrp');
                this.clearLocalStorage(this.currentUser.nrp);
                
                // Show success page with auto-submit message
                this.showSuccessPageWithMessage('Waktu ujian telah habis! Jawaban Anda telah difinalisasi otomatis.');
                
                console.log('Auto-submit successful');
            } else {
                console.error('Auto-submit failed:', response.message);
                this.showAlert('error', 'Waktu habis! Gagal auto-submit: ' + response.message);
            }
        } catch (error) {
            console.error('Auto-submit error:', error);
            this.showAlert('error', 'Waktu habis! Terjadi kesalahan saat auto-submit.');
        }
    }

    // Utility methods
    async apiCall(method, action, data = null, params = null) {
        let url = `${this.apiUrl}?action=${action}`;
        
        if (params) {
            Object.keys(params).forEach(key => {
                url += `&${key}=${encodeURIComponent(params[key])}`;
            });
        }

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }

    showAlert(type, message) {
        swal({
            title: type === 'success' ? 'Berhasil!' : 
                   type === 'error' ? 'Error!' : 
                   type === 'warning' ? 'Peringatan!' : 'Informasi',
            text: message,
            icon: type,
            button: 'OK',
        });
    }

    showConfirmation(title, text, confirmText, cancelText) {
        return new Promise((resolve) => {
            swal({
                title: title,
                text: text,
                icon: 'warning',
                buttons: {
                    cancel: {
                        text: cancelText,
                        value: false,
                        visible: true,
                        className: 'btn-cancel'
                    },
                    confirm: {
                        text: confirmText,
                        value: true,
                        visible: true,
                        className: 'btn-confirm'
                    }
                },
                dangerMode: true,
            }).then((result) => {
                resolve(result);
            });
        });
    }

    showLoading(show) {
        if (show) {
            $('body').append('<div id="loadingOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;"><div class="loading"></div></div>');
        } else {
            $('#loadingOverlay').remove();
        }
    }
}

// Initialize the exam system when document is ready
$(document).ready(function() {
    window.examSystem = new ExamSystem();
});

// Start clock immediately when script loads (before jQuery ready)
(function() {
    function updateLoginClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
        
        const dateString = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Jakarta'
        });
        
        const loginTimeElement = document.getElementById('loginCurrentTime');
        if (loginTimeElement) {
            loginTimeElement.textContent = `${dateString}, ${timeString} WIB`;
        }
    }
    
    // Update immediately
    updateLoginClock();
    
    // Update every second
    setInterval(updateLoginClock, 1000);
    
    // Also update when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateLoginClock);
    }
})();

// Additional security measures for SEB
document.addEventListener('keydown', function(e) {
    // Disable F1-F12
    if (e.keyCode >= 112 && e.keyCode <= 123) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+A (Select All)
    if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+C (Copy)
    if (e.ctrlKey && e.keyCode === 67) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+V (Paste)
    if (e.ctrlKey && e.keyCode === 86) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+X (Cut)
    if (e.ctrlKey && e.keyCode === 88) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+S (Save)
    if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+P (Print)
    if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+Z (Undo)
    if (e.ctrlKey && e.keyCode === 90) {
        e.preventDefault();
        return false;
    }
    
    // Disable Ctrl+Y (Redo)
    if (e.ctrlKey && e.keyCode === 89) {
        e.preventDefault();
        return false;
    }
    
    // Disable Alt+Tab
    if (e.altKey && e.keyCode === 9) {
        e.preventDefault();
        return false;
    }
    
    // Disable Windows key
    if (e.keyCode === 91 || e.keyCode === 92) {
        e.preventDefault();
        return false;
    }
});

// Disable drag and drop
document.addEventListener('dragover', function(e) {
    e.preventDefault();
});

document.addEventListener('drop', function(e) {
    e.preventDefault();
});

// Disable image dragging
document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Disable text selection (except in textarea)
document.addEventListener('selectstart', function(e) {
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
    }
});

// Console warning
console.log('%cSTOP!', 'color: red; font-size: 50px; font-weight: bold;');
console.log('%cIni adalah fitur browser yang ditujukan untuk developer. Jangan mengetik atau paste kode apapun di sini karena dapat membahayakan akun Anda.', 'color: red; font-size: 16px;');

// Additional protection
(function() {
    let devtools = false;
    setInterval(function() {
        if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
            if (!devtools) {
                devtools = true;
                console.clear();
                console.log('%cDeveloper tools detected! This action has been logged.', 'color: red; font-size: 20px;');
            }
        } else {
            devtools = false;
        }
    }, 1000);
})();

// ERD Modal Functions
function showERDModal() {
    const modal = document.getElementById('erdModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Prevent page scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        console.log('ERD Modal opened');
    }
}

function closeERDModal() {
    const modal = document.getElementById('erdModal');
    if (modal) {
        modal.classList.remove('show');
        
        // Add fade out animation
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        
        // Restore page scroll
        document.body.style.overflow = 'auto';
        
        console.log('ERD Modal closed');
    }
}

// Close modal when clicking outside the content
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('erdModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeERDModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('erdModal');
            if (modal && modal.classList.contains('show')) {
                closeERDModal();
            }
        }
    });
});

// Test function untuk debug cleaning
function testCleaning() {
    const testText = "Line 1\nLine 2\nLine 3";
    console.log('Testing text cleaning:');
    console.log('Original:', JSON.stringify(testText));
    
    if (window.examSystem) {
        const cleaned = window.examSystem.cleanAnswer(testText);
        console.log('Cleaned:', JSON.stringify(cleaned));
    } else {
        console.log('ExamSystem not available');
    }
}

// Expose untuk debugging
window.testCleaning = testCleaning;