<?php
/**
 * get_ads.php — Automatically lists images in the ads folder
 */
header('Content-Type: application/json');

$dir = 'images/ads/';
$ads = [];

if (is_dir($dir)) {
    // Scan directory for images
    $files = scandir($dir);
    if ($files) {
        foreach ($files as $file) {
            // Only include image files
            if (preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $file)) {
                $ads[] = $dir . $file;
            }
        }
    }
}

// Return the list as JSON
echo json_encode($ads);
?>
