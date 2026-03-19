New-Item -ItemType Directory -Force -Path backend
Move-Item -Path 'api.py', 'app.py', 'main.py', 'rag.py', '.env', '.python-version', 'pyproject.toml', 'uv.lock', 'chat_history.db', '.venv', '.vscode' -Destination 'backend' -Force
