<?php
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $charset = 'utf8mb4';
    public $conn;

    public function __construct() {
        // Load environment variables from .env file
        $this->loadEnvFile();
        
        $this->host = $_ENV['DB_HOST'] ?? '145.79.10.205';
        $this->db_name = $_ENV['DB_NAME'] ?? 'ce_exam_system';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? 'CTcBrkKOlp8VjzVBJyhz1V8vt9tH16KM8Mc6jnvG1a2RT43kmDnYFO6ztR69bYPU';
        $this->port = $_ENV['DB_PORT'] ?? 3306;
    }

    private function loadEnvFile() {
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0 || empty(trim($line))) continue;
                if (strpos($line, '=') !== false) {
                    list($name, $value) = explode('=', $line, 2);
                    $_ENV[trim($name)] = trim($value);
                }
            }
        }
    }

    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
                PDO::ATTR_TIMEOUT => 30,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Test connection dengan simple query
            $this->conn->query("SELECT 1");
            
        } catch(PDOException $exception) {
            $error_msg = "Connection error: " . $exception->getMessage();
            error_log($error_msg);
            
            // Return detailed error for debugging
            throw new Exception($error_msg);
        }

        return $this->conn;
    }

    public function testConnection() {
        try {
            $conn = $this->getConnection();
            return [
                'success' => true,
                'message' => 'Database connection successful',
                'host' => $this->host,
                'port' => $this->port,
                'database' => $this->db_name,
                'username' => $this->username
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'host' => $this->host,
                'port' => $this->port,
                'database' => $this->db_name,
                'username' => $this->username
            ];
        }
    }

    public function sanitizeInput($data) {
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        return $data;
    }

    public function validateNRP($nrp) {
        // Validate NRP format (10 digits)
        return preg_match('/^[0-9]{10}$/', $nrp);
    }
}
?>