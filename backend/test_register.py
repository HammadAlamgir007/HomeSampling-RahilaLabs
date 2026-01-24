import requests

url = "http://localhost:5000/api/auth/register"
payload = {
    "username": "TestUser",
    "email": "testuser@example.com",
    "password": "password123",
    "phone": "03000000000",
    "city": "Debugging City"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
