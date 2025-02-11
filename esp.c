#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// Replace with your WiFi credentials
const char* ssid     = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

// Replace with your backend server's URL (ensure it’s accessible)
const char* serverUrl = "http://your-backend-server.com/api/process/next";

// Polling interval in milliseconds (e.g., 10000 ms = 10 seconds)
const unsigned long pollInterval = 10000;

unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
}

void loop() {
  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= pollInterval) {
    previousMillis = currentMillis;
    checkForCommands();
  }
}

void checkForCommands() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // Begin the GET request to your API endpoint
    http.begin(serverUrl);
    int httpCode = http.GET();

    if (httpCode > 0) {  // Check for the returning code
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        Serial.println("Received payload:");
        Serial.println(payload);
        // TODO: Parse the JSON payload and execute the appropriate action
      } else {
        Serial.printf("Unexpected HTTP code: %d\n", httpCode);
      }
    } else {
      Serial.printf("GET request failed: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();  // Close connection
  } else {
    Serial.println("WiFi not connected");
  }
}
