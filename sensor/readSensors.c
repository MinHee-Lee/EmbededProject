#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <errno.h>
#include <wiringPi.h>
#include <wiringPiSPI.h>
#include <signal.h>
#include <sys/types.h>
#include <unistd.h>
#include <json-c/json.h>
#include <mysql/mysql.h>

#define CS_MCP3208 8
#define SPI_CHANNEL 0
#define SPI_SPEED 1000000

#define MAXTIMINGS 85
static int DHTPIN = 7;
static int dht22_dat[5] = {0, 0, 0, 0, 0};

#define PUMP 21

int ret_humid = 0, ret_temp = 0;

int read_mcp3208_adc(unsigned char adcChannel);
int read_dht22_dat();
void sig_handler(int signo);
uint8_t sizecvt(const int read);
void finish_with_error(MYSQL *con);

int main(void) {
    unsigned char adcChannel_light = 0;
    int adcValue_light = 0;
    int received_temp;

    signal(SIGINT, (void *)sig_handler);

    if (wiringPiSetupGpio() == -1) {
        fprintf(stdout, "Unable to start wiringPi: %s\n", strerror(errno));
        return 1;
    }
    if (wiringPiSPISetup(SPI_CHANNEL, SPI_SPEED) == -1) {
        fprintf(stdout, "wiringPiSPISetup Failed: %s\n", strerror(errno));
        return 1;
    }
    pinMode(CS_MCP3208, OUTPUT);
    pinMode(PUMP, OUTPUT);

    // MariaDB 연결 정보 설정
    const char *host = "192.168.123.102"; // 또는 실제 호스트 이름 또는 IP 주소
    const char *user = "mergen";
    const char *password = "bumtan55";
    const char *database = "smart_flower_pot";
    unsigned int port = 3306; // 기본 포트 번호

    MYSQL *con = mysql_init(NULL);
    if (con == NULL) {
        fprintf(stderr, "mysql_init() failed\n");
        return 1;
    }

    if (mysql_real_connect(con, host, user, password, database, port, NULL, 0) == NULL) {
        finish_with_error(con);
    }

    while (1) {
        adcValue_light = read_mcp3208_adc(adcChannel_light);
        while (read_dht22_dat() == 0) {
            delay(500);
        }
        received_temp = ret_temp;

        json_object *jobj = json_object_new_object();
        json_object *jtemp = json_object_new_int(received_temp);
        json_object *jhumid = json_object_new_int(ret_humid);
        json_object *jlight = json_object_new_int(adcValue_light);

        json_object_object_add(jobj, "temperature", jtemp);
        json_object_object_add(jobj, "humidity", jhumid);
        json_object_object_add(jobj, "light", jlight);

        printf("%s\n", json_object_to_json_string(jobj));

        // 데이터베이스에 삽입
        char query[256];
        snprintf(query, sizeof(query), "INSERT INTO sensor_data (temperature, humidity, light) VALUES (%d, %d, %d)",
                 received_temp, ret_humid, adcValue_light);

        if (mysql_query(con, query)) {
            finish_with_error(con);
        }

        json_object_put(jobj);
        delay(5000);
    }

    mysql_close(con);
    return 0;
}

void finish_with_error(MYSQL *con) {
    fprintf(stderr, "%s\n", mysql_error(con));
    mysql_close(con);
    exit(1);
}

int read_mcp3208_adc(unsigned char adcChannel) {
    unsigned char buff[3];
    int adcValue = 0;
    buff[0] = 0x06 | ((adcChannel & 0x07) >> 2);
    buff[1] = ((adcChannel & 0x07) << 6);
    buff[2] = 0x00;
    digitalWrite(CS_MCP3208, 0);
    wiringPiSPIDataRW(SPI_CHANNEL, buff, 3);
    buff[1] = 0x0F & buff[1];
    adcValue = (buff[1] << 8) | buff[2];
    digitalWrite(CS_MCP3208, 1);
    return adcValue;
}

uint8_t sizecvt(const int read) {
    if (read > 255 || read < 0) {
        printf("Invalid data from wiringPi library\n");
        exit(EXIT_FAILURE);
    }
    return (uint8_t)read;
}

int read_dht22_dat() {
    uint8_t laststate = HIGH;
    uint8_t counter = 0;
    uint8_t j = 0, i;
    dht22_dat[0] = dht22_dat[1] = dht22_dat[2] = dht22_dat[3] = dht22_dat[4] = 0;

    pinMode(DHTPIN, OUTPUT);
    digitalWrite(DHTPIN, HIGH);
    delay(10);
    digitalWrite(DHTPIN, LOW);
    delay(18);
    digitalWrite(DHTPIN, HIGH);
    delayMicroseconds(40);
    pinMode(DHTPIN, INPUT);

    for (i = 0; i < MAXTIMINGS; i++) {
        counter = 0;
        while (sizecvt(digitalRead(DHTPIN)) == laststate) {
            counter++;
            delayMicroseconds(1);
            if (counter == 255) {
                break;
            }
        }
        laststate = sizecvt(digitalRead(DHTPIN));
        if (counter == 255) break;
        if ((i >= 4) && (i % 2 == 0)) {
            dht22_dat[j / 8] <<= 1;
            if (counter > 16)
                dht22_dat[j / 8] |= 1;
            j++;
        }
    }

    if ((j >= 40) && (dht22_dat[4] == ((dht22_dat[0] + dht22_dat[1] + dht22_dat[2] + dht22_dat[3]) & 0xFF))) {
        float t, h;
        h = (float)dht22_dat[0] * 256 + (float)dht22_dat[1];
        h /= 10;
        t = (float)(dht22_dat[2] & 0x7F) * 256 + (float)dht22_dat[3];
        t /= 10.0;
        if ((dht22_dat[2] & 0x80) != 0) t *= -1;
        ret_humid = (int)h;
        ret_temp = (int)t;
        return ret_temp;
    } else {
        printf("Data not good, skip\n");
        return 0;
    }
}

void sig_handler(int signo) {
    printf("Process stop\n");
    digitalWrite(PUMP, 0);
    exit(0);
}
