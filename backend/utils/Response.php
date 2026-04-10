<?php
class Response {
    public static function json($statusCode, $success, $message, $data = null) {
        http_response_code($statusCode);
        $response = [
            'success' => $success,
            'message' => $message
        ];
        if ($data !== null) {
            $response['data'] = $data;
        }
        echo json_encode($response);
        exit;
    }
}