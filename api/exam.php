<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Load environment variables
if (file_exists('../.env')) {
    $lines = file('../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

require_once '../config/Database.php';

class ExamAPI {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    private function logAccess($nrp, $action = 'access') {
        try {
            $query = "INSERT INTO log (nrp, ip, action, user_agent) VALUES (?, ?, ?, ?)";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                $nrp,
                $this->getClientIP(),
                $action,
                $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]);
        } catch (Exception $e) {
            error_log("Log error: " . $e->getMessage());
        }
    }

    private function getClientIP() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                return trim($ips[0]);
            }
        }
        return 'unknown';
    }

    private function cleanAnswerData($jsonAnswer) {
        if (empty($jsonAnswer)) {
            return '';
        }
        
        try {
            // Decode JSON to clean individual answers
            $answers = json_decode($jsonAnswer, true);
            
            if (!is_array($answers)) {
                return $jsonAnswer; // Return as-is if not valid JSON
            }
            
            // Clean each answer
            foreach ($answers as $key => $answerData) {
                if (isset($answerData['answer'])) {
                    $cleanedText = $this->cleanAnswerText($answerData['answer']);
                    $answers[$key]['answer'] = $cleanedText;
                }
            }
            
            // Re-encode to JSON
            $cleanedJson = json_encode($answers, JSON_UNESCAPED_UNICODE);
            
            error_log("Answer cleaning - Original length: " . strlen($jsonAnswer) . ", Cleaned length: " . strlen($cleanedJson));
            
            return $cleanedJson;
            
        } catch (Exception $e) {
            error_log("Error cleaning answer data: " . $e->getMessage());
            return $jsonAnswer; // Return original if cleaning fails
        }
    }
    
    private function cleanAnswerText($text) {
        if (empty($text)) {
            return '';
        }
        
        // Convert to string
        $cleaned = (string) $text;
        
        // DEBUG: Log original
        error_log("Original answer text: " . json_encode($cleaned));
        
        // Normalize line breaks
        $cleaned = str_replace(["\r\n", "\r"], "\n", $cleaned);
        
        // Convert newlines to spaces (key fix)
        $cleaned = str_replace("\n", " ", $cleaned);
        
        // Remove excessive whitespace
        $cleaned = preg_replace('/[ \t]+/', ' ', $cleaned); // Multiple spaces/tabs to single space
        
        // Trim leading and trailing whitespace
        $cleaned = trim($cleaned);
        
        // Additional safety: remove any potential harmful characters
        $cleaned = filter_var($cleaned, FILTER_SANITIZE_STRING, FILTER_FLAG_NO_ENCODE_QUOTES);
        
        // DEBUG: Log cleaned
        error_log("Cleaned answer text: " . json_encode($cleaned));
        
        return $cleaned;
    }

    // Add debug method
    public function debugDatabase() {
        $db = new Database();
        $testResult = $db->testConnection();
        
        return [
            'success' => true,
            'debug_info' => [
                'env_file_exists' => file_exists('../.env'),
                'config_file_exists' => file_exists('../config/Database.php'),
                'connection_test' => $testResult,
                'env_vars' => [
                    'DB_HOST' => $_ENV['DB_HOST'] ?? 'not_set',
                    'DB_NAME' => $_ENV['DB_NAME'] ?? 'not_set', 
                    'DB_USER' => $_ENV['DB_USER'] ?? 'not_set',
                    'DB_PASS_LENGTH' => isset($_ENV['DB_PASS']) ? strlen($_ENV['DB_PASS']) : 0
                ]
            ]
        ];
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        switch ($method) {
            case 'POST':
                $this->handlePOST($action);
                break;
            case 'GET':
                $this->handleGET($action);
                break;
            default:
                $this->response(['success' => false, 'message' => 'Method not allowed'], 405);
        }
    }

    private function handlePOST($action) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        switch ($action) {
            case 'login':
                $this->login($input);
                break;
            case 'submit_exam':
                $this->submitExam($input);
                break;
            default:
                $this->response(['success' => false, 'message' => 'Invalid action'], 400);
        }
    }

    private function handleGET($action) {
        switch ($action) {
            case 'exam_data':
                $this->getExamData();
                break;
            case 'check_session':
                $this->checkSession();
                break;
            case 'debug':
                $this->response($this->debugDatabase());
                break;
            default:
                $this->response(['success' => false, 'message' => 'Invalid action'], 400);
        }
    }

    private function login($input) {
        $nrp = $this->db->sanitizeInput($input['nrp'] ?? '');
        
        if (!$this->db->validateNRP($nrp)) {
            $this->response(['success' => false, 'message' => 'Format NRP tidak valid (harus 10 digit)']);
            return;
        }

        try {
            // Check if student exists and get exam info
            $query = "SELECT p.*, k.* FROM peserta p 
                     JOIN kelas k ON p.kelas = k.name 
                     WHERE p.nrp = ? AND k.name = 'BASDAT-25E'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$nrp]);
            $student = $stmt->fetch();

            if (!$student) {
                $this->response(['success' => false, 'message' => 'NRP tidak terdaftar dalam ujian ini']);
                return;
            }

            // Check if already submitted
            if ($student['is_submitted']) {
                $this->response(['success' => false, 'message' => 'Anda sudah mengsubmit ujian']);
                return;
            }

            // Set timezone untuk konsistensi
            date_default_timezone_set('Asia/Jakarta');
            
            // Check exam time dengan timezone yang benar
            $exam_start = new DateTime($student['datetime_open']);
            $exam_end = clone $exam_start;
            $exam_end->add(new DateInterval('PT' . $student['duration'] . 'M'));
            $now = new DateTime();
            
            // Debug log untuk troubleshooting
            error_log("Current time: " . $now->format('Y-m-d H:i:s'));
            error_log("Exam start: " . $exam_start->format('Y-m-d H:i:s'));
            error_log("Exam end: " . $exam_end->format('Y-m-d H:i:s'));
            
            if ($now < $exam_start) {
                $time_diff = $exam_start->diff($now);
                $this->response([
                    'success' => false, 
                    'message' => 'Ujian belum dimulai. Waktu mulai: ' . $exam_start->format('d/m/Y H:i:s') . ' WIB',
                    'exam_status' => 'not_started',
                    'time_until_start' => $time_diff->format('%h jam %i menit %s detik')
                ]);
                return;
            }
            
            if ($now > $exam_end) {
                $this->response([
                    'success' => false, 
                    'message' => 'Ujian telah berakhir',
                    'exam_status' => 'ended'
                ]);
                return;
            }

            // Set start time if not set
            if (!$student['start_time']) {
                $update_query = "UPDATE peserta SET start_time = NOW(), ip_address = ? WHERE nrp = ? AND kelas = ?";
                $update_stmt = $this->conn->prepare($update_query);
                $update_stmt->execute([$this->getClientIP(), $nrp, $student['kelas']]);
                $student['start_time'] = date('Y-m-d H:i:s');
            }

            $this->logAccess($nrp, 'login');

            $this->response([
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'nrp' => $student['nrp'],
                    'name' => $student['name'],
                    'kelas' => $student['name'],
                    'teacher' => $student['teacher'],
                    'start_time' => $student['start_time'],
                    'duration' => $student['duration'],
                    'answer' => $student['answer']
                ]
            ]);

        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()]);
        }
    }

    // Remove save_answer function - not needed anymore
    // Auto-save is handled in localStorage only

    private function submitExam($input) {
        $nrp = $this->db->sanitizeInput($input['nrp'] ?? '');
        $answer = $input['answer'] ?? ''; // Final answers in JSON format

        if (!$this->db->validateNRP($nrp)) {
            $this->response(['success' => false, 'message' => 'Invalid NRP']);
            return;
        }

        // Clean and validate JSON answer
        $cleanedAnswer = $this->cleanAnswerData($answer);
        
        try {
            // Check current status dengan detail
            $check_query = "SELECT nrp, name, is_submitted, submit_time FROM peserta WHERE nrp = ? AND kelas = 'BASDAT-25E'";
            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->execute([$nrp]);
            $current_status = $check_stmt->fetch();
            
            error_log("Submit check - NRP: $nrp, Status: " . json_encode($current_status));
            
            if (!$current_status) {
                $this->response(['success' => false, 'message' => 'Student not found']);
                return;
            }
            
            if ($current_status['is_submitted']) {
                $this->response(['success' => false, 'message' => 'Ujian sudah difinalisasi sebelumnya pada: ' . $current_status['submit_time']]);
                return;
            }

            // Update dengan final answers dan set submit status
            $query = "UPDATE peserta SET answer = ?, submit_time = NOW(), is_submitted = TRUE 
                     WHERE nrp = ? AND kelas = 'BASDAT-25E'";
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute([$cleanedAnswer, $nrp]);
            
            error_log("Submit update - Success: " . ($result ? 'true' : 'false') . ", Rows: " . $stmt->rowCount());
            error_log("Final answer JSON length: " . strlen($cleanedAnswer));

            if ($result && $stmt->rowCount() > 0) {
                $this->logAccess($nrp, 'submit_exam_final');
                $this->response(['success' => true, 'message' => 'Ujian berhasil difinalisasi']);
            } else {
                $this->response(['success' => false, 'message' => 'Gagal update database. Rows affected: ' . $stmt->rowCount()]);
            }

        } catch (Exception $e) {
            error_log("Submit exam error: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
        }
    }

    private function getExamData() {
        try {
            $query = "SELECT * FROM kelas WHERE name = 'BASDAT-25E'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $exam = $stmt->fetch();

            if ($exam) {
                $this->response([
                    'success' => true,
                    'data' => $exam
                ]);
            } else {
                $this->response(['success' => false, 'message' => 'Exam not found']);
            }

        } catch (Exception $e) {
            error_log("Get exam data error: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
        }
    }

    private function checkSession() {
        $nrp = $_GET['nrp'] ?? '';
        
        if (!$this->db->validateNRP($nrp)) {
            $this->response(['success' => false, 'message' => 'Invalid NRP']);
            return;
        }

        try {
            $query = "SELECT p.*, k.duration, k.datetime_open, k.teacher 
                     FROM peserta p 
                     JOIN kelas k ON p.kelas = k.name 
                     WHERE p.nrp = ? AND k.name = 'BASDAT-25E'";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$nrp]);
            $student = $stmt->fetch();

            if ($student) {
                // Jika sudah disubmit, redirect ke halaman sukses
                if ($student['is_submitted']) {
                    $this->response([
                        'success' => false, 
                        'message' => 'Ujian sudah difinalisasi',
                        'already_submitted' => true,
                        'submit_time' => $student['submit_time']
                    ]);
                    return;
                }
                
                // Jika ada start_time dan belum disubmit, return session data
                if ($student['start_time']) {
                    // Just return the session data, let JavaScript handle time validation
                    $this->response([
                        'success' => true,
                        'data' => [
                            'nrp' => $student['nrp'],
                            'name' => $student['name'],
                            'kelas' => $student['kelas'],
                            'teacher' => $student['teacher'],
                            'start_time' => $student['start_time'],
                            'duration' => $student['duration'],
                            'answer' => $student['answer'],
                            'is_submitted' => $student['is_submitted']
                        ]
                    ]);
                } else {
                    $this->response(['success' => false, 'message' => 'Session not found']);
                }
            } else {
                $this->response(['success' => false, 'message' => 'Student not found']);
            }

        } catch (Exception $e) {
            error_log("Check session error: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Terjadi kesalahan sistem']);
        }
    }

    private function response($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
}

// Handle the request
$api = new ExamAPI();
$api->handleRequest();
?>