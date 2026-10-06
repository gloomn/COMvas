.PHONY: start

start:
	@echo "🚀 Starting COMvas Server with xvfb..."
	xvfb-run -a uvicorn app.main:app --host 0.0.0.0 --port 8000
