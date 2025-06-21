// CE Exam System - JSON Format - Complete JavaScript Implementation
class ExamSystemJSON {
    constructor() {
        this.apiUrl = '../api/exam.php';
        this.currentUser = null;
        this.examData = null;
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.autoSaveInterval = null;
        this.isExamSubmitted = false;
        
        // JSON specific properties
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.totalQuestions = 4;
        this.debugMode = true;
        
        this.initQuestions();
        this.init();
    }

    initQuestions() {
        this.questions = [
            {
                id: 1,
                title: "CPMK-4 (25%)",
                content: `
                    <div class="question-header">
                        <div class="question-title">
                            <i class="fas fa-database"></i>
                            1. CPMK-4 (25%)
                        </div>
                    </div>
                    <div class="question-content">
                        <p>Fitur andalan NadaStream adalah halaman <strong>"For You"</strong> yang merekomendasikan lagu berdasarkan 
                        artis yang sering didengarkan pengguna. Fitur ini mengalami penurunan performa. Analisis menunjukkan 
                        bahwa query untuk mengambil semua judul lagu (<code>Lagu.judul_lagu</code>) dari seorang artis tertentu 
                        (<code>Artis.nama_artis</code>) menjadi <em>bottleneck</em>. Query ini, pada skema yang sudah ternormalisasi, 
                        memerlukan <strong>JOIN</strong> melalui tiga tabel: <em>Artis, Album, dan Lagu</em>.</p>
                        
                        <div class="sub-question">
                            <p><strong>a.</strong> Jelaskan secara singkat mengapa memisahkan data ke dalam tabel Artis, Album, dan Lagu 
                            (seperti pada skema kita saat ini) adalah praktik desain yang baik?</p>
                        </div>
                        
                        <div class="sub-question">
                            <p><strong>b.</strong> Buktikan bahwa optimasi dapat dicapai tanpa merusak struktur normalisasi. 
                            Tuliskan perintah SQL (<code>CREATE INDEX</code>) yang paling efektif untuk mempercepat query 
                            pencarian lagu berdasarkan nama artis pada skema yang sudah ada!</p>
                        </div>
                    </div>
                `
            },
            // ... other questions
            {
                id: 4,
                title: "CPMK-6 (25%)",
                content: `
                    <div class="question-header">
                        <div class="question-title">
                            <i class="fas fa-layer-group"></i>
                            4. CPMK-6 (25%)
                        </div>
                    </div>
                    <div class="question-content">
                        <p>Tabel Log Pemutaran di database NadaStream telah tumbuh menjadi sangat besar, berisi miliaran baris 
                        data historis sejak platform diluncurkan. Data ini adalah aset yang sangat berharga, tetapi ukurannya 
                        yang masif mulai menyebabkan masalah performa serius. Anda ditugaskan untuk mengimplementasikan 
                        <strong>partisi</strong> pada tabel Log Pemutaran.</p>
                        
                        <div class="sub-question">
                            <p><strong>a.</strong> Metode partisi apa (<em>Range, List, atau Hash</em>) yang paling tepat untuk 
                            digunakan pada tabel Log Pemutaran berdasarkan kolom <code>waktu_putar</code>? Berikan justifikasi 
                            teknis yang kuat untuk pilihan Anda.</p>
                        </div>
                        
                        <div class="sub-question">
                            <p><strong>b.</strong> Tuliskan perintah SQL yang diperlukan untuk membuat ulang tabel Log Pemutaran 
                            sebagai <em>partitioned table</em> menggunakan metode yang Anda pilih. Sertakan juga dalam kode Anda 
                            perintah untuk membuat dua partisi spesifik:</p>
                            <ul>
                                <li>Satu partisi untuk menampung data bulan Mei 2025.</li>
                                <li>Satu partisi untuk menampung data bulan Juni 2025.</li>
                            </ul>
                        </div>
                    </div>
                `
            }
        ];
    }

    init() {
        this.bindEvents();
        this.updateCurrentTime();
        this.checkExistingSession();
        
        // Update current time every second
        setInterval(() => this.updateCurrentTime(), 1000);
        
        // Auto save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.currentUser && !this.isExamSubmitted) {
                this.saveCurrentAnswer();
            }
        }, 30000);
    }

    bindEvents() {
        // Login button
        $('#startExam').on('click', () => this.handleLogin());
        
        // Navigation buttons
        $('#prevBtn').on('click', () => this.goToPreviousQuestion());
        $('#nextBtn').on('click', () => this.goToNextQuestion());

        // Answer textarea auto-save
        $('#currentAnswer').on('input', () => {
            this.markAsUnsaved();
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(() => {
                this.saveCurrentAnswer();
            }, 2000);
        });

        // Submit button
        $('#submitExam').on('click', () => this.confirmSubmit());

        // Debug toggle
        $('#toggleDebug').on('click', () => this.toggleDebugPanel());
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
        
        $('#currentTime').text(timeString);
        $('#loginCurrentTime').text(`${dateString}, ${timeString} WIB`);
    }

    async handleLogin() {
        const nrp = $('#nrp').val().trim();
        
        if (!nrp || !/^\d{10}$/.test(nrp)) {
            this.showAlert('error', 'Format NRP tidak valid. Harus 10 digit angka.');
            return;
        }

        try {
            this.showLoading(true);
            const response = await this.apiCall('POST', 'login', { nrp });
            
            if (response.success) {
                this.currentUser = response.data;
                localStorage.setItem('exam_json_nrp', nrp);
                
                this.answers = {};
                this.saveAnswersToStorage();
                
                this.loadExamData();
                this.showExamPage();
                this.startTimer();
                this.loadCurrentQuestion();
                
                this.showAlert('success', 'Login berhasil! Ujian JSON format dimulai.');
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

    loadExamData() {
        if (this.currentUser) {
            $('#studentName').text(this.currentUser.name);
            $('#studentNrp').text(this.currentUser.nrp);
            $('#totalQuestions').text(this.totalQuestions);
            this.updateProgress();
        }
    }

    showExamPage() {
        $('#loginPage').removeClass('active');
        $('#examPage').addClass('active');
        setTimeout(() => $('#currentAnswer').focus(), 500);
    }

    loadCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;

        $('#questionContainer').addClass('question-fade-out');
        
        setTimeout(() => {
            $('#questionContainer').html(question.content).removeClass('question-fade-out').addClass('question-fade-in');
            $('#currentQuestionNum').text(this.currentQuestionIndex + 1);
            $('#answerQuestionNum').text(this.currentQuestionIndex + 1);
            
            const savedAnswer = this.answers[question.id] ? this.answers[question.id].answer : '';
            $('#currentAnswer').val(savedAnswer);
            
            this.updateNavigationButtons();
            this.updateProgress();
            this.updateDebugPanel();
            
            setTimeout(() => $('#questionContainer').removeClass('question-fade-in'), 500);
        }, 300);
    }

    saveCurrentAnswer(callback = null) {
        if (!this.currentUser || this.isExamSubmitted) {
            if (callback) callback();
            return;
        }

        const currentQuestion = this.questions[this.currentQuestionIndex];
        const answer = $('#currentAnswer').val();
        
        this.answers[currentQuestion.id] = {
            question_id: currentQuestion.id,
            question_title: currentQuestion.title,
            answer: answer,
            timestamp: new Date().toISOString(),
            question_number: this.currentQuestionIndex + 1
        };
        
        this.saveAnswersToStorage();
        this.updateDebugPanel();
        
        try {
            this.updateSaveStatus('saving', 'Menyimpan...');
            
            this.apiCall('POST', 'save_answer', {
                nrp: this.currentUser.nrp,
                answer: JSON.stringify(this.answers)
            }).then(response => {
                if (response.success) {
                    this.updateSaveStatus('saved', 'Tersimpan otomatis');
                } else {
                    this.updateSaveStatus('error', 'Gagal menyimpan');
                }
                if (callback) callback();
            }).catch(error => {
                console.error('Save error:', error);
                this.updateSaveStatus('error', 'Gagal menyimpan');
                if (callback) callback();
            });
        } catch (error) {
            console.error('Save error:', error);
            this.updateSaveStatus('error', 'Gagal menyimpan');
            if (callback) callback();
        }
    }

    updateDebugPanel() {
        if (this.debugMode) {
            const formattedJson = JSON.stringify(this.answers, null, 2);
            $('#debugJson').text(formattedJson);
        }
    }

    // Additional utility methods
    saveAnswersToStorage() {
        localStorage.setItem('exam_json_answers', JSON.stringify(this.answers));
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
        $('#progressFill').css('width', progress + '%');
        $('#progressPercent').text(Math.round(progress) + '%');
    }

    updateNavigationButtons() {
        $('#prevBtn').prop('disabled', this.currentQuestionIndex === 0);
        
        if (this.currentQuestionIndex === this.questions.length - 1) {
            $('#nextBtn').html('<i class="fas fa-flag-checkered"></i> Soal Terakhir');
        } else {
            $('#nextBtn').html('Selanjutnya <i class="fas fa-chevron-right"></i>');
        }
    }

    goToPreviousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveCurrentAnswer(() => {
                this.currentQuestionIndex--;
                this.loadCurrentQuestion();
            });
        }
    }

    goToNextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.saveCurrentAnswer(() => {
                this.currentQuestionIndex++;
                this.loadCurrentQuestion();
            });
        }
    }

    markAsUnsaved() {
        this.updateSaveStatus('unsaved', 'Belum tersimpan');
    }

    updateSaveStatus(status, message) {
        const $status = $('#saveStatus');
        $status.removeClass('saving saved error unsaved');
        $status.addClass(status);
        $status.text(message);
    }

    toggleDebugPanel() {
        const $panel = $('#debugPanel');
        const $button = $('#toggleDebug');
        
        if ($panel.is(':visible')) {
            $panel.hide();
            $button.text('Show Debug');
            this.debugMode = false;
        } else {
            $panel.show();
            $button.text('Hide Debug');
            this.debugMode = true;
            this.updateDebugPanel();
        }
    }

    startTimer() {
        if (!this.currentUser || !this.currentUser.start_time) return;

        const startTime = new Date(this.currentUser.start_time);
        const duration = this.currentUser.duration * 60 * 1000;
        const endTime = new Date(startTime.getTime() + duration);

        this.timerInterval = setInterval(() => {
            const now = new Date();
            const remaining = endTime - now;

            if (remaining <= 0) {
                this.timeUp();
                return;
            }

            this.timeRemaining = remaining;
            this.updateTimerDisplay(remaining);
        }, 1000);

        const now = new Date();
        const remaining = endTime - now;
        if (remaining > 0) {
            this.timeRemaining = remaining;
            this.updateTimerDisplay(remaining);
        } else {
            this.timeUp();
        }
    }

    updateTimerDisplay(remaining) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        $('#timeRemaining').text(display);

        const $countdown = $('#timeRemaining');
        $countdown.removeClass('warning danger');
        
        if (remaining <= 5 * 60 * 1000) {
            $countdown.addClass('danger');
        } else if (remaining <= 15 * 60 * 1000) {
            $countdown.addClass('warning');
        }
    }

    async timeUp() {
        clearInterval(this.timerInterval);
        this.isExamSubmitted = true;
        await this.submitExam(true);
        this.showAlert('error', 'Waktu ujian telah habis! Jawaban Anda telah disubmit otomatis.');
    }

    async confirmSubmit() {
        if (this.isExamSubmitted) return;

        this.saveCurrentAnswer();
        const answeredCount = Object.keys(this.answers).length;
        
        const confirmed = await this.showConfirmation(
            'Konfirmasi Submit Ujian',
            `Anda telah menjawab ${answeredCount} dari ${this.totalQuestions} soal. Anda yakin ingin submit ujian?`,
            'Submit Ujian',
            'Batal'
        );

        if (confirmed) {
            await this.submitExam(false);
        }
    }

    async submitExam(isAutoSubmit = false) {
        if (this.isExamSubmitted) return;

        try {
            this.showLoading(true);
            this.isExamSubmitted = true;
            
            const response = await this.apiCall('POST', 'submit_exam', {
                nrp: this.currentUser.nrp,
                answer: JSON.stringify(this.answers)
            });

            if (response.success) {
                clearInterval(this.timerInterval);
                clearInterval(this.autoSaveInterval);
                this.showSuccessPage();
                
                if (!isAutoSubmit) {
                    this.showAlert('success', 'Ujian berhasil disubmit!');
                }
            } else {
                this.isExamSubmitted = false;
                this.showAlert('error', response.message);
            }
        } catch (error) {
            console.error('Submit error:', error);
            this.isExamSubmitted = false;
            this.showAlert('error', 'Terjadi kesalahan saat submit. Silakan coba lagi.');
        } finally {
            this.showLoading(false);
        }
    }

    showSuccessPage() {
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
        
        const answeredCount = Object.keys(this.answers).length;
        $('#answeredCount').text(answeredCount);
        $('#totalSubmittedQuestions').text(this.totalQuestions);
        
        const formattedJson = JSON.stringify(this.answers, null, 2);
        $('#finalJsonDisplay').text(formattedJson);
        
        localStorage.removeItem('exam_json_nrp');
        localStorage.removeItem('exam_json_answers');
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

// Initialize when document is ready
$(document).ready(function() {
    window.examSystemJSON = new ExamSystemJSON();
    
    console.log('%cCE EXAM SYSTEM - JSON FORMAT', 'color: blue; font-size: 20px; font-weight: bold;');
    console.log('%cSistem ujian dengan format JSON untuk Teknik Komputer ITS', 'color: blue; font-size: 14px;');
});