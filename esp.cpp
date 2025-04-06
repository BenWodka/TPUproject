#include <iostream>

using namespace std;

// example code if we can use the facility's wifi

#include <WiFi.h>

const char* facility_ssid = "the_ssid";
const char* facility_password = "password";

void set_up()
{
    //sets up the serial monitor
    Serial.begin(115200);
    //sets the wifi mode to station
    WiFi.mode(WIFI_STA); //or WiFi.mode(WIFI_AP) for access point i.e. creating its own network
    //connects to the set network with the creditials provided. 
    WiFi.begin(facility_ssid, facility_password);

    //checks the connection status
    while(WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("");
    }

    //prints the ip address
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    //example code if we are using the esp's generated wifi
    //same code as above with a few changes 

    //set the esp's wifi credentials
    const char* ap_ssid = "esp_ssid";
    const char* ap_password = "esp_password";

    // set up the access point
    WiFi.softAP(ap_ssid, ap_password);

    // prints the ip address of the ap
    Serial.print("AP ip address: ");
    Serail.println(WiFi.softAP());

    
}

//rest of code goes here

