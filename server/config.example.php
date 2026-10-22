<?php
// Salin file ini menjadi "config.php" di folder yang sama, lalu isi.
// File config.php TIDAK ikut ter-commit (sudah di .gitignore).
return [
    // Akun admin untuk login di halaman /admin.
    // Password disimpan ter-hash di database saat pertama kali dipakai.
    'admin_email'    => 'admin@example.com',
    'admin_password' => 'GANTI-PASSWORD-INI',

    // Lokasi file database SQLite. Default: server/data.sqlite
    // Paling aman: arahkan ke folder DI LUAR public_html bila hosting mengizinkan,
    // contoh: __DIR__ . '/../../private/portofolio.sqlite'
    'db_path'        => __DIR__ . '/data.sqlite',
];
