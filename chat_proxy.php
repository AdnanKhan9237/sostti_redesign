<?php
/**
 * chat_proxy.php - Dual-API Smart Proxy for SOSTTI Chatbot
 * 
 * DeepSeek is the Primary Provider.
 * Supports automatic failover to Groq.
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(); }

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION - API KEYS & ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// 1. DEEPSEEK (Primary - High Intelligence)
$DEEPSEEK_CONFIG = [
    'key' => '',
    'url' => 'https://api.deepseek.com/chat/completions',
    'model' => 'deepseek-chat'
];

// 2. GROQ (Secondary Fallback - Fast)
$GROQ_CONFIG = [
    'key' => '',
    'url' => 'https://api.groq.com/openai/v1/chat/completions',
    'model' => 'llama-3.3-70b-versatile'
];

// ═══════════════════════════════════════════════════════════════
// PROCESS REQUEST
// ═══════════════════════════════════════════════════════════════

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request.']);
    exit();
}

// 1. Try DeepSeek first (Primary)
$response = callOpenAICompatible($DEEPSEEK_CONFIG, $data);

// 2. Fallback to Groq if DeepSeek fails
if ($response['status'] !== 200) {
    $response = callOpenAICompatible($GROQ_CONFIG, $data);
}

// Final output
http_response_code($response['status']);
echo $response['body'];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function callOpenAICompatible($config, $data) {
    if (empty($config['key'])) return ['status' => 500, 'body' => json_encode(['error' => 'Key not configured'])];

    $body = [
        'model' => $config['model'],
        'messages' => $data['messages'],
        'max_tokens' => $data['max_tokens'] ?? 800,
        'temperature' => $data['temperature'] ?? 0.7
    ];

    $ch = curl_init($config['url']);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $config['key']
        ],
        CURLOPT_TIMEOUT => 20
    ]);

    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $code, 'body' => $res];
}
?>
