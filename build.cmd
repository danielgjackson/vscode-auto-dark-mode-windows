@ECHO OFF
SETLOCAL
CD /D %~dp0

set ARCH=x86

IF EXIST "%VS130COMNTOOLS%\..\..\VC\vcvarsall.bat" SET VCVARSALL=%VS130COMNTOOLS%\..\..\VC\vcvarsall.bat
IF EXIST "%VS140COMNTOOLS%\..\..\VC\vcvarsall.bat" SET VCVARSALL=%VS140COMNTOOLS%\..\..\VC\vcvarsall.bat
IF EXIST "%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvarsall.bat" SET VCVARSALL=%ProgramFiles(x86)%\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvarsall.bat
IF EXIST "%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat" SET VCVARSALL=%ProgramFiles(x86)%\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvarsall.bat
ECHO Setting environment variables for C compiler... %VCVARSALL%
call "%VCVARSALL%" %ARCH%

cl.exe wait-registry.c /link /out:wait-registry.exe

IF ERRORLEVEL 1 GOTO ERROR

del wait-registry.obj

rem   vsce package
rem   vsce publish
rem   code --install-extension auto-dark-mode-windows-*.vsix

GOTO END

:ERROR
ECHO ERROR: An error occured.
pause
GOTO END

:END
ENDLOCAL
