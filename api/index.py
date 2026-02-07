"""
Vercel Serverless Function wrapper for FastAPI backend
"""
from backend.main import app

# Vercel expects a handler function
def handler(request, context):
    return app(request, context)
