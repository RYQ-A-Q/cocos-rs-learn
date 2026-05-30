@echo off
echo ========================================
echo WebSocket 服务器启动脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 检查依赖...
if not exist "node_modules\" (
    echo 首次运行，安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo 错误：依赖安装失败！
        pause
        exit /b 1
    )
    echo.
)

echo.
echo 启动 WebSocket 服务器...
echo.
node server.js

pause
