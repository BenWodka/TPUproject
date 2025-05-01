#include <esp_wifi.h>

//http protocols
//#include <WebServer.h>

//WebServer server(80);
// #define ESPPORT = "COM8";

void set_up()
{
    //sets up the serial monitor
    //Serial.begin(115200);
    wifi_config_t config = {
        .ap = {
            .ssid = "TPU_wifi",
            .channel = 1,
            .password = "capstone_tpu",
            .max_connection = 4,
        },
    };
    esp_err_t wifi = esp_wifi_init(&config);

    //sets the wifi mode for soft access point
    wifi = esp_wifi_set_mode(WIFI_MODE_AP);
    //set the esp's wifi credentials
    // const char* ap_ssid = "TPU_Connection"; // potential error may need to change the variable type.
    // const char* ap_password = "esp_password";

    wifi = esp_wifi_start();
    if(wifi != ESP_OK)
    {
        //handle errors


    }
    

    // // server setup
    // server.on("/", HTTP_GET, [](WebServerRequest * request) {request->send(200, "text/html", "<h1>Sent from ESP</h1>");});
    // server.begin();
}

void main()
{
    set_up();
}