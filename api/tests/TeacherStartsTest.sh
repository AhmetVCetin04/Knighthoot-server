{
  "info": {
    "name": "Start Test API",
    "_postman_id": "start-test-001",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Start Test",
      "request": {
        "method": "POST",
        "header": [
          { "key": "Content-Type", "value": "application/json" },
          { "key": "Authorization", "value": "Bearer {{login_teacher_token}}" }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/startTest",
          "host": ["{{baseUrl}}"],
          "path": ["api", "startTest"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ID\": \"{{created_test_ID}}\",\n  \"PIN\": \"{{created_test_pin}}\"\n}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "let json = pm.response.json();",
              "pm.test('Start test success', () => pm.expect(pm.response.code).to.eql(200));",
              "",
              "// If server returns updated state, you can store anything you need here",
              "if (json.currentQuestion !== undefined) {",
              "    pm.environment.set('current_question', json.currentQuestion);",
              "}"
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:5173" }
  ]
}
