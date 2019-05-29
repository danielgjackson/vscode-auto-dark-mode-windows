@ECHO OFF
SETLOCAL
CD /D %~dp0

rem NOTE: Use "wait-registry.exe" instead as it efficiently waits for the registry change.
rem "wait-registry.exe" "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize" "AppsUseLightTheme" *
rem This batch file is an alternative (rubbish) polling method.

SET LASTRESULT=

:LOOP
reg.exe query HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize /v AppsUseLightTheme | FINDSTR "0x0" >NUL
SET RESULT=%ERRORLEVEL%
IF NOT %RESULT%!==%LASTRESULT%! GOTO CHANGED

rem --- test whether TIMEOUT/CHOICE work if there is no stdin? ---
rem TIMEOUT /NOBREAK /T 15 >NUL
rem CHOICE /C 0 /N /D 0 /T 15 >NUL
PING 0.0.0.0 -n 10 >NUL

GOTO LOOP

:CHANGED
ECHO %RESULT%
SET LASTRESULT=%RESULT%
GOTO LOOP

:END

