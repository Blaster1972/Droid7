@echo off
REM Check if CUDA is installed
where nvidia-smi >nul 2>nul
if %errorlevel%==0 (
    echo CUDA is installed. Running CUDA-enabled container.
    docker run --gpus all -it --rm --name droid7_container droid7
) else (
    echo CUDA is not installed. Running standard container.
    docker run -it --rm --name droid7_container droid7
)
pause
