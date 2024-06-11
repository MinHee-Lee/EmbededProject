const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '192.168.123.102',
    user: 'mergen',
    password: 'bumtan55',
    database: 'smart_flower_pot',
    port: 3306,
    connectionLimit: 20, // 연결 풀 크기 조정 필요
    acquireTimeout: 60000, // 연결 타임아웃 증가 (밀리초)
    connectTimeout: 10000, // 연결 시도 타임아웃
    idleTimeout: 60000, // 유휴 연결 타임아웃
    trace: true // 로깅 활성화
});

pool.getConnection()
    .then(conn => {
        console.log('MariaDB Connected...');
        conn.release(); // release to pool
    })
    .catch(err => {
        console.error('Not connected due to error: ' + err);
    });

module.exports = pool;
