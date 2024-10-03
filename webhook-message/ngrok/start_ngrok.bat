@echo off
REM Stop any existing ngrok processes
ngrok kill

REM Start ngrok using the configuration file and log output
start "" ngrok start --config=ngrok.yml --all > ngrok_log.txt 2>&1

REM Wait for user input to keep the command prompt open
pause
