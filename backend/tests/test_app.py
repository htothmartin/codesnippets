import pytest
import mongomock
import os
from datetime import datetime, timezone
from unittest.mock import patch

os.environ['FLASK_ENV'] = 'testing'
os.environ['MONGO_URI'] = 'mongodb://mock-test-uri'

from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True

    mock_client = mongomock.MongoClient()
    mock_db = mock_client.get_database('testdb')
    mock_collection = mock_db.snippets_collection

    with patch('app.snippets_collection', mock_collection):
        with app.test_client() as client:
            yield client

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json == {"status": "UP", "db": "CONNECTED"}

def test_create_snippet_success(client):
    payload = {
        "title": "Python Hello World",
        "code": "print('Hello')",
    }
    
    response = client.post('/api/snippets', json=payload)
    
    assert response.status_code == 201
    data = response

def test_create_snippet_missing_data(client):
    payload = {"title": "title"} 
    
    response = client.post('/api/snippets', json=payload)
    
    assert response.status_code == 400
    assert "error" in response.json

def test_get_snippets(client):
    from app import snippets_collection

    snippets_collection.insert_many([
        {"title": "Régi kód", "code": "old", "created_at": datetime(2023, 1, 1)},
        {"title": "Új kód", "code": "new", "created_at": datetime(2023, 12, 1)}
    ])
    
    response = client.get('/api/snippets')
    
    assert response.status_code == 200
    data = response.json
    
    assert len(data) == 2
    assert data[0]["title"] == "Új kód"
    assert isinstance(data[0]["_id"], str)