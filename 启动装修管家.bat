@echo off
chcp 65001 >nul
title 装修费用管家 - 局域网服务
echo ============================================
echo    装修费用管家 - 本地服务器启动中...
echo ============================================
echo.

cd /d "%~dp0"

REM 检查是否已有端口占用
netstat -ano | findstr ":4173 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [提示] 服务已经在运行中，正在打开浏览器...
    start "" "http://localhost:4173/"
    echo.
    echo 手机访问地址：http://192.168.0.115:4173/
    pause
    exit /b
)

echo [1/2] 正在启动本地服务器...
echo.

REM 后台启动 preview 服务器
start "装修费用管家服务" cmd /c "cd /d ""%~dp0"" && npm run preview -- --port 4173"

REM 等待服务器就绪
echo 等待服务器启动...
set count=0
:waitloop
set /a count+=1
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":4173 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 goto ready
if %count% geq 15 (
    echo [错误] 服务器启动失败，请确认已安装 Node.js
    pause
    exit /b
)
goto waitloop

:ready
echo [2/2] 服务器已启动！
echo.
echo ============================================
echo   本机访问：http://localhost:4173/
echo   手机访问：http://192.168.0.115:4173/
echo   （请确保手机和电脑连接同一个WiFi）
echo ============================================
echo.
echo 正在打开浏览器...
start "" "http://localhost:4173/"
echo.
echo 提示：保持本窗口开启，关闭窗口即停止服务
pause >nul
