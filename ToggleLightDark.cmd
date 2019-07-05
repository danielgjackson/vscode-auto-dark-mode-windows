@echo off
rem Icon for shortcut: "%SystemRoot%\System32\accessibilitycpl.dll" :338

reg query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme | findstr 0x0 >NUL
if errorlevel 1 goto make_dark
goto make_light

:make_light
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme    /t REG_DWORD /f /d 1 >NUL
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /f /d 1 >NUL
goto notify

:make_dark
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme    /t REG_DWORD /f /d 0 >NUL
reg add HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v SystemUsesLightTheme /t REG_DWORD /f /d 0 >NUL
goto notify

:notify
rem Broadcast WM_THEMECHANGED message (if the helper executable exists)
if exist "%~dp0wait-registry.exe" "%~dp0wait-registry.exe" !
goto end

:end
