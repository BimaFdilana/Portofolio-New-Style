<?php
// ============================================================
// API Konten Portofolio — PHP + SQLite (satu file, tanpa framework)
// Rute (PATH_INFO): 
//   GET    /api.php/content            -> konten publik (JSON ternormalisasi)
//   POST   /api.php/login              -> {email,password} => {token,email}
//   POST   /api.php/logout             (Bearer)
//   GET    /api.php/{tabel}            (Bearer) daftar baris mentah
//   POST   /api.php/{tabel}            (Bearer) tambah
//   PUT    /api.php/{tabel}/{id}       (Bearer) ubah
//   DELETE /api.php/{tabel}/{id}       (Bearer) hapus
//   GET    /api.php/settings           (Bearer) / PUT /api.php/settings
// Tabel: projects, certificates, skill_categories, journey
// ============================================================

declare(strict_types=1);

// Untuk pengujian lokal dengan PHP built-in server: layani file statis & SPA.
if (php_sapi_name() === 'cli-server') {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (!str_starts_with($path, '/api')) {
        $docroot = $_SERVER['DOCUMENT_ROOT'] ?? getcwd();
        $file = $docroot . $path;
        if ($path !== '/' && is_file($file)) return false; // file statis asli
        $index = $docroot . '/index.html';
        if (is_file($index)) { header('Content-Type: text/html'); readfile($index); return true; }
    }
}

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.php';
$config = is_file($configFile) ? (require $configFile) : [
    'admin_email' => '', 'admin_password' => '', 'db_path' => __DIR__ . '/data.sqlite',
];

try {
    $pdo = new PDO('sqlite:' . $config['db_path']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA journal_mode=WAL');
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database tidak dapat dibuka: ' . $e->getMessage()]);
    exit;
}

// ---------- Skema (dibuat otomatis) ----------
$pdo->exec("CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, passhash TEXT NOT NULL)");
$pdo->exec("CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL)");
$pdo->exec("CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL DEFAULT '',
  difficulty INTEGER NOT NULL DEFAULT 2, grad TEXT NOT NULL DEFAULT '', hue TEXT NOT NULL DEFAULT '',
  short_id TEXT NOT NULL DEFAULT '', short_en TEXT NOT NULL DEFAULT '',
  role_id TEXT NOT NULL DEFAULT '', role_en TEXT NOT NULL DEFAULT '',
  duration_id TEXT NOT NULL DEFAULT '', duration_en TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '[]', features TEXT NOT NULL DEFAULT '[]', boss TEXT NOT NULL DEFAULT '[]',
  demo TEXT NOT NULL DEFAULT '', repo TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1)");
$pdo->exec("CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title_id TEXT NOT NULL DEFAULT '', title_en TEXT NOT NULL DEFAULT '',
  issuer TEXT NOT NULL DEFAULT '', year INTEGER NOT NULL DEFAULT 2026, pages INTEGER NOT NULL DEFAULT 1, sort INTEGER NOT NULL DEFAULT 0)");
$pdo->exec("CREATE TABLE IF NOT EXISTS skill_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, icon TEXT NOT NULL DEFAULT '', title_id TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '', items TEXT NOT NULL DEFAULT '[]', sort INTEGER NOT NULL DEFAULT 0)");
$pdo->exec("CREATE TABLE IF NOT EXISTS journey (
  id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL DEFAULT '', title_id TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '', body_id TEXT NOT NULL DEFAULT '', body_en TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 0, sort INTEGER NOT NULL DEFAULT 0)");
$pdo->exec("CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}')");

// ---------- Seed (sekali, saat tabel masih kosong) ----------
$TABLES = [
    'projects' => ['slug','name','difficulty','grad','hue','short_id','short_en','role_id','role_en','duration_id','duration_en','stack','features','boss','demo','repo','sort','published'],
    'certificates' => ['title_id','title_en','issuer','year','pages','sort'],
    'skill_categories' => ['icon','title_id','title_en','items','sort'],
    'journey' => ['period','title_id','title_en','body_id','body_en','active','sort'],
];
$JSON_COLS = ['stack','features','boss','items'];
$INT_COLS = ['difficulty','year','pages','sort','published','active'];

function seedIfEmpty(PDO $pdo, array $TABLES): void {
    $count = (int)$pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    $seedFile = __DIR__ . '/seed.json';
    if ($count > 0 || !is_file($seedFile)) return;
    $seed = json_decode((string)file_get_contents($seedFile), true);
    if (!is_array($seed)) return;
    foreach (['projects','certificates','skill_categories','journey'] as $t) {
        $cols = $TABLES[$t];
        $stmt = $pdo->prepare("INSERT INTO $t (" . implode(',', $cols) . ") VALUES (" . implode(',', array_fill(0, count($cols), '?')) . ")");
        foreach ($seed[$t] ?? [] as $row) {
            $vals = [];
            foreach ($cols as $c) {
                $v = $row[$c] ?? null;
                $vals[] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
            }
            $stmt->execute($vals);
        }
    }
    if (isset($seed['settings'])) {
        $pdo->prepare("INSERT OR REPLACE INTO site_settings (id, data) VALUES (1, ?)")
            ->execute([json_encode($seed['settings'], JSON_UNESCAPED_UNICODE)]);
    }
}
seedIfEmpty($pdo, $TABLES);

// ---------- Bootstrap akun admin dari config ----------
if (!empty($config['admin_email']) && !empty($config['admin_password'])) {
    $n = (int)$pdo->query("SELECT COUNT(*) FROM admins")->fetchColumn();
    if ($n === 0) {
        $pdo->prepare("INSERT INTO admins (email, passhash) VALUES (?, ?)")
            ->execute([$config['admin_email'], password_hash($config['admin_password'], PASSWORD_DEFAULT)]);
    }
}

// ---------- Util ----------
function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}
function requireAuth(PDO $pdo): string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($h, 'Bearer ')) out(['error' => 'Belum login.'], 401);
    $hash = hash('sha256', substr($h, 7));
    $stmt = $pdo->prepare("SELECT email FROM sessions WHERE token_hash = ? AND expires > ?");
    $stmt->execute([$hash, time()]);
    $email = $stmt->fetchColumn();
    if (!$email) out(['error' => 'Sesi tidak berlaku / sudah kedaluwarsa.'], 401);
    return (string)$email;
}
function encodeRow(array $row, array $JSON_COLS, array $INT_COLS): array {
    if (isset($row['id'])) $row['id'] = (string)$row['id'];
    foreach ($JSON_COLS as $c) if (isset($row[$c]) && is_array($row[$c])) $row[$c] = json_encode($row[$c], JSON_UNESCAPED_UNICODE);
    foreach ($INT_COLS as $c) if (isset($row[$c])) $row[$c] = (int)$row[$c];
    if (isset($row['published'])) $row['published'] = ((int)$row['published']) === 1;
    if (isset($row['active'])) $row['active'] = ((int)$row['active']) === 1;
    return $row;
}
function decodeRow(array $row, array $JSON_COLS): array {
    $row['id'] = (string)$row['id'];
    foreach ($JSON_COLS as $c) if (isset($row[$c])) { $d = json_decode((string)$row[$c], true); $row[$c] = is_array($d) ? $d : []; }
    foreach (['difficulty','year','pages','sort'] as $c) if (isset($row[$c])) $row[$c] = (int)$row[$c];
    if (isset($row['published'])) $row['published'] = ((int)$row['published']) === 1;
    if (isset($row['active'])) $row['active'] = ((int)$row['active']) === 1;
    return $row;
}

// ---------- Routing ----------
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
if ($pathInfo === '') {
    // Cadangan: ambil dari REQUEST_URI setelah "api.php", atau awalan "/api/"
    $u = parse_url($uri, PHP_URL_PATH) ?: '';
    $pos = strpos($u, 'api.php');
    if ($pos !== false) $pathInfo = substr($u, $pos + 7);
    elseif (str_starts_with($u, '/api/')) $pathInfo = substr($u, 4);
}
$seg = array_values(array_filter(explode('/', trim($pathInfo, '/'))));
if (($seg[0] ?? '') === 'api') array_shift($seg); // PATH_INFO kadang menyertakan awalan /api
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$route = $seg[0] ?? '';

// ----- Konten publik -----
if ($route === 'content' && $method === 'GET') {
    $bi = fn($r, $k) => ['id' => $r[$k . '_id'] ?? '', 'en' => $r[$k . '_en'] ?? ''];
    $projects = [];
    foreach ($pdo->query("SELECT * FROM projects WHERE published = 1 ORDER BY sort, id") as $r) {
        $r = decodeRow($r, $JSON_COLS);
        $projects[] = [
            'slug' => $r['slug'], 'name' => $r['name'], 'difficulty' => $r['difficulty'],
            'grad' => $r['grad'], 'hue' => $r['hue'],
            'short' => $bi($r, 'short'), 'role' => $bi($r, 'role'), 'duration' => $bi($r, 'duration'),
            'stack' => $r['stack'], 'features' => $r['features'], 'boss' => $r['boss'],
            'demo' => $r['demo'], 'repo' => $r['repo'],
        ];
    }
    $certs = [];
    foreach ($pdo->query("SELECT * FROM certificates ORDER BY sort, id") as $r) {
        $certs[] = ['title' => $bi($r, 'title'), 'issuer' => $r['issuer'], 'year' => (int)$r['year'], 'pages' => (int)$r['pages']];
    }
    $skills = [];
    foreach ($pdo->query("SELECT * FROM skill_categories ORDER BY sort, id") as $r) {
        $items = json_decode((string)$r['items'], true) ?: [];
        $skills[] = [
            'icon' => $r['icon'], 'title' => $bi($r, 'title'),
            'items' => array_map(fn($i) => $i['name'] ?? '', $items),
            'levels' => array_map(fn($i) => (int)($i['level'] ?? 0), $items),
        ];
    }
    $journey = [];
    foreach ($pdo->query("SELECT * FROM journey ORDER BY sort, id") as $r) {
        $journey[] = ['period' => $r['period'], 'title' => $bi($r, 'title'), 'body' => $bi($r, 'body'), 'active' => ((int)$r['active']) === 1];
    }
    $settings = [];
    $row = $pdo->query("SELECT data FROM site_settings WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
    if ($row) $settings = json_decode((string)$row['data'], true) ?: [];
    out(['projects' => $projects, 'certificates' => $certs, 'skills' => $skills, 'journey' => $journey, 'settings' => $settings]);
}

// ----- Login / logout -----
if ($route === 'login' && $method === 'POST') {
    $b = body();
    $stmt = $pdo->prepare("SELECT passhash FROM admins WHERE email = ?");
    $stmt->execute([$b['email'] ?? '']);
    $hash = $stmt->fetchColumn();
    if (!$hash || !password_verify((string)($b['password'] ?? ''), (string)$hash)) {
        out(['error' => 'Email atau password salah.'], 401);
    }
    $token = bin2hex(random_bytes(32));
    $pdo->prepare("INSERT INTO sessions (token_hash, email, expires) VALUES (?, ?, ?)")
        ->execute([hash('sha256', $token), (string)$b['email'], time() + 7 * 24 * 3600]);
    $pdo->exec("DELETE FROM sessions WHERE expires <= " . time());
    out(['token' => $token, 'email' => (string)$b['email']]);
}
if ($route === 'logout' && $method === 'POST') {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($h, 'Bearer ')) {
        $pdo->prepare("DELETE FROM sessions WHERE token_hash = ?")->execute([hash('sha256', substr($h, 7))]);
    }
    out(['ok' => true]);
}

// ----- Pengaturan (admin) -----
if ($route === 'settings') {
    requireAuth($pdo);
    if ($method === 'GET') {
        $row = $pdo->query("SELECT data FROM site_settings WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
        out(['data' => $row ? (json_decode((string)$row['data'], true) ?: []) : []]);
    }
    if ($method === 'PUT') {
        $b = body();
        $pdo->prepare("INSERT OR REPLACE INTO site_settings (id, data) VALUES (1, ?)")
            ->execute([json_encode($b['data'] ?? [], JSON_UNESCAPED_UNICODE)]);
        out(['ok' => true]);
    }
    out(['error' => 'Metode tidak didukung.'], 405);
}

// ----- CRUD generik (admin) -----
if (isset($TABLES[$route])) {
    requireAuth($pdo);
    $cols = $TABLES[$route];
    $id = isset($seg[1]) ? (int)$seg[1] : null;

    if ($method === 'GET' && $id === null) {
        $rows = [];
        foreach ($pdo->query("SELECT * FROM $route ORDER BY sort, id") as $r) $rows[] = decodeRow($r, $JSON_COLS);
        out($rows);
    }
    if ($method === 'POST') {
        $b = body();
        $vals = [];
        foreach ($cols as $c) $vals[$c] = $b[$c] ?? null;
        $row = encodeRow($vals, $JSON_COLS, $INT_COLS);
        try {
            $stmt = $pdo->prepare("INSERT INTO $route (" . implode(',', $cols) . ") VALUES (" . implode(',', array_fill(0, count($cols), '?')) . ")");
            $stmt->execute(array_values($row));
        } catch (PDOException $e) {
            out(['error' => 'Gagal menyimpan (slug mungkin sudah dipakai): ' . $e->getMessage()], 409);
        }
        out(['id' => (string)$pdo->lastInsertId()], 201);
    }
    if ($method === 'PUT' && $id !== null) {
        $b = body();
        $vals = [];
        foreach ($cols as $c) if (array_key_exists($c, $b)) $vals[$c] = $b[$c];
        if ($vals) {
            $row = encodeRow($vals, $JSON_COLS, $INT_COLS);
            $set = implode(',', array_map(fn($c) => "$c = ?", array_keys($row)));
            try {
                $pdo->prepare("UPDATE $route SET $set WHERE id = ?")->execute([...array_values($row), $id]);
            } catch (PDOException $e) {
                out(['error' => 'Gagal mengubah (slug mungkin sudah dipakai): ' . $e->getMessage()], 409);
            }
        }
        out(['ok' => true]);
    }
    if ($method === 'DELETE' && $id !== null) {
        $pdo->prepare("DELETE FROM $route WHERE id = ?")->execute([$id]);
        out(['ok' => true]);
    }
    out(['error' => 'Metode tidak didukung.'], 405);
}

out(['error' => 'Rute tidak ditemukan.'], 404);
