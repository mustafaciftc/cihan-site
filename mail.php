<?php
// mail.php — iletişim formu → e-posta
// Alıcıyı değiştirmek için sadece $TO satırını düzenle.
$TO = 'vuurelax@gmail.com';

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

function bitir($kod, $metin) { http_response_code($kod); echo $metin; exit; }
function temiz($v, $max) { $v = trim((string) $v); $v = preg_replace('/[\r\n\t]+/', ' ', $v); return mb_substr($v, 0, $max, 'UTF-8'); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { bitir(405, 'Geçersiz istek.'); }

// Spam tuzağı (gizli alan dolu ise sessizce başarılı say)
if (!empty($_POST['website'])) { bitir(200, 'Mesajınız gönderildi. Teşekkürler!'); }

$ad      = temiz($_POST['name'] ?? '', 100);
$konu    = temiz($_POST['subject'] ?? '', 150);
$eposta  = temiz($_POST['email'] ?? '', 150);
$mesaj   = trim((string) ($_POST['message'] ?? ''));
$mesaj   = mb_substr(str_replace("\r", '', $mesaj), 0, 5000, 'UTF-8');

if ($ad === '' || $konu === '' || $mesaj === '' || !filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
	bitir(422, 'Lütfen tüm alanları doğru şekilde doldurun.');
}

// Basit hız sınırı: aynı IP 30 sn'de 1, saatte en fazla 5 mesaj
$ip   = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$dosya = sys_get_temp_dir() . '/cy_mail_' . md5($ip) . '.json';
$simdi = time();
$kayit = is_file($dosya) ? (json_decode((string) @file_get_contents($dosya), true) ?: []) : [];
$kayit = array_values(array_filter($kayit, function ($t) use ($simdi) { return $t > $simdi - 3600; }));
if ($kayit && end($kayit) > $simdi - 30) { bitir(429, 'Çok hızlı gönderiyorsunuz, lütfen birkaç saniye bekleyin.'); }
if (count($kayit) >= 5) { bitir(429, 'Çok fazla mesaj gönderildi, lütfen daha sonra tekrar deneyin.'); }

$host = preg_replace('/[^a-z0-9.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$host = preg_replace('/^www\./i', '', $host);
$gonderen = 'noreply@' . ($host !== '' ? $host : 'localhost');

$govde  = "Web sitesinden yeni mesaj\n";
$govde .= "-------------------------\n";
$govde .= "Ad Soyad : $ad\n";
$govde .= "E-Mail   : $eposta\n";
$govde .= "Konu     : $konu\n";
$govde .= "Tarih    : " . date('d.m.Y H:i') . "\n";
$govde .= "IP       : $ip\n\n";
$govde .= $mesaj . "\n";

$basliklar  = "From: " . mb_encode_mimeheader('Cihan Yıldız Web Sitesi', 'UTF-8') . " <$gonderen>\r\n";
$basliklar .= "Reply-To: " . mb_encode_mimeheader($ad, 'UTF-8') . " <$eposta>\r\n";
$basliklar .= "MIME-Version: 1.0\r\n";
$basliklar .= "Content-Type: text/plain; charset=UTF-8\r\n";
$basliklar .= "Content-Transfer-Encoding: 8bit\r\n";
$basliklar .= "X-Mailer: PHP/" . phpversion();

$konuBasligi = mb_encode_mimeheader('[Web Sitesi] ' . $konu, 'UTF-8');

$ok = @mail($TO, $konuBasligi, $govde, $basliklar, '-f' . $gonderen);
if (!$ok) { $ok = @mail($TO, $konuBasligi, $govde, $basliklar); }

if ($ok) {
	$kayit[] = $simdi;
	@file_put_contents($dosya, json_encode($kayit), LOCK_EX);
	bitir(200, 'Mesajınız gönderildi. Teşekkürler!');
}
bitir(500, 'Mesaj gönderilemedi. Lütfen telefon veya e-posta ile ulaşın.');
