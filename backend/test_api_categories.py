import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000/api"

def run_test():
    # 1. Register/Login to get token
    # Using the admin credentials from memory or creating new
    username = "testuser_cat_v2"
    password = "testpassword123"
    email = "test_cat_v2@example.com"
    
    # Try login first
    print("Attempting login...")
    response = requests.post(f"{BASE_URL}/token/", json={
        "username": username,
        "password": password
    })
    
    if response.status_code != 200:
        print("Login failed, registering...")
        response = requests.post(f"{BASE_URL}/users/register/", json={
            "username": username,
            "password": password,
            "email": email
        })
        if response.status_code not in [200, 201]:
            print(f"Registration failed: {response.text}")
            return
        
        # Login again
        response = requests.post(f"{BASE_URL}/token/", json={
            "username": username,
            "password": password
        })
        
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return

    token = response.json()["access"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    print("Authenticated successfully.")

    # 2. Check existing categories
    print("\nFetching categories...")
    response = requests.get(f"{BASE_URL}/wallet/categories/", headers=headers)
    print(f"GET categories status: {response.status_code}")
    print(f"Existing categories: {response.json()}")
    
    existing_cats = response.json()

    # 3. Test Batch Create (Seed)
    if len(existing_cats) == 0:
        print("\nTesting Batch Create (Seed)...")
        seed_data = [
            {"name": "Comida"},
            {"name": "Transporte"},
            {"name": "Salud"}
        ]
        response = requests.post(
            f"{BASE_URL}/wallet/categories/batch_create/", 
            headers=headers, 
            json=seed_data
        )
        print(f"Batch Create status: {response.status_code}")
        print(f"Batch Create response: {response.json()}")
    else:
        print("\nSkipping Batch Create (already has categories)")

    # 4. Test Single Create (Add)
    print("\nTesting Add Category...")
    new_cat = {"name": "Test Category"}
    response = requests.post(
        f"{BASE_URL}/wallet/categories/", 
        headers=headers, 
        json=new_cat
    )
    print(f"Add Category status: {response.status_code}")
    print(f"Add Category response: {response.json()}")
    
    if response.status_code == 400:
         print(f"Error details: {response.text}")

if __name__ == "__main__":
    # Ensure django server is running? 
    # This script assumes server is running on localhost:8000
    # In this environment, we might need to run it via python manage.py shell or similar if we can't access localhost:8000 externally?
    # Actually, we can use the requests library to hit the local server if it's running.
    # But wait, I need to start the server first or assume it's running?
    # I'll try to run this script. If connection refused, I'll start the server in background.
    try:
        run_test()
    except Exception as e:
        print(f"Test failed: {e}")
