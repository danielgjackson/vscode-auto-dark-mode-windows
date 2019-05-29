@ECHO OFF
SETLOCAL
CD /D %~dp0

rem Run efficient executable if present, otherwise run rubbish polling method
IF NOT EXIST "wait-registry.exe" GOTO NO_EXECUTABLE
"wait-registry.exe" "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize" "AppsUseLightTheme" *
GOTO END

:NO_EXECUTABLE
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

